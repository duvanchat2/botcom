#!/usr/bin/env python3
"""Real-media pipeline for the canvas journey.

raw/seg1.mp4 … raw/seg6.mp4  -> checks every junction, assembles master/master.mp4,
                               samples each chapter into frames/NNN.webp (1280x720),
                               writes cfg.json with chapter bounds for site.html.
raw/k1.png (E1 keyframe)     -> assets/product.webp  (4:5 crop for "El producto")
raw/s_*.png (ingredients)    -> assets/ing-*.webp
frame 0                      -> assets/poster.webp (small, blurred loading poster)

Frame budget is enforced: WebP quality steps down until all frames fit FRAME_BUDGET.
usage: process.py [--frames 44,38,56,36,44,44] [--budget 9.0] [--width 1280]
"""
import argparse
import json
import pathlib
import shutil
import subprocess

ROOT = pathlib.Path(__file__).resolve().parent
RAW, FRAMES, ASSETS, MASTER, TMP = (ROOT / d for d in ("raw", "frames", "assets", "master", "frames_tmp"))
FF = "ffmpeg"


def run(args, quiet=True):
    return subprocess.run([FF, "-y", "-loglevel", "error", *args], check=True, capture_output=quiet)


def probe(path):
    err = subprocess.run([FF, "-i", str(path)], capture_output=True, text=True).stderr
    dur = fps = w = h = None
    for line in err.splitlines():
        line = line.strip()
        if line.startswith("Duration:"):
            hh, mm, ss = line.split(",")[0].split()[1].split(":")
            dur = int(hh) * 3600 + int(mm) * 60 + float(ss)
        if "Video:" in line:
            for part in line.split(","):
                part = part.strip()
                if part.endswith(" fps"):
                    fps = float(part.split()[0])
                tok = part.split()[0] if part else ""
                if "x" in tok and tok.replace("x", "").isdigit():
                    w, h = map(int, tok.split("x"))
    return {"dur": dur, "fps": fps, "w": w, "h": h}


def grab(path, t, out, width=320):
    run(["-ss", f"{max(0.0, t):.3f}", "-i", str(path), "-frames:v", "1", "-vf", f"scale={width}:-2", str(out)])


def diff(a, b):
    from PIL import Image, ImageChops, ImageStat
    A = Image.open(a).convert("L").resize((160, 90))
    B = Image.open(b).convert("L").resize((160, 90))
    return ImageStat.Stat(ImageChops.difference(A, B)).mean[0]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--frames", default="44,38,56,36,44,44")
    ap.add_argument("--budget", type=float, default=9.0, help="MB for all frames")
    ap.add_argument("--width", type=int, default=1280)
    a = ap.parse_args()
    per = [int(x) for x in a.frames.split(",")]
    segs = [RAW / f"seg{i}.mp4" for i in range(1, 7)]
    for d in (FRAMES, ASSETS, MASTER, TMP):
        d.mkdir(exist_ok=True)

    info = [probe(s) for s in segs]
    for s, i in zip(segs, info):
        print(f"{s.name}: {i}")

    # junctions: last frame of segment n vs the first frames of segment n+1
    report = []
    skip = [0.0] * 6
    for n in range(5):
        last = TMP / f"j{n}_last.png"
        grab(segs[n], info[n]["dur"] - 0.05, last)
        best = (999.0, 0.0)
        for t in (0.0, 0.04, 0.08, 0.12, 0.2, 0.3, 0.5):
            f = TMP / f"j{n}_{t:.2f}.png"
            grab(segs[n + 1], t, f)
            d = diff(last, f)
            best = min(best, (d, t))
        first = diff(last, TMP / f"j{n}_0.00.png")
        skip[n + 1] = best[1] if best[0] < 4.0 else 0.0
        report.append({"junction": f"{n+1}->{n+2}", "diff_first": round(first, 2), "best": round(best[0], 2), "at": best[1]})
    print(json.dumps(report, indent=1))

    # master: segments concatenated, overlap trimmed where the extension repeats the tail
    parts = []
    for n, s in enumerate(segs):
        out = TMP / f"m{n}.mp4"
        run(["-ss", f"{skip[n]:.3f}", "-i", str(s), "-an", "-vf", "scale=1920:1080:flags=lanczos,fps=24,format=yuv420p",
             "-c:v", "libx264", "-crf", "16", "-preset", "medium", str(out)])
        parts.append(out)
    lst = TMP / "list.txt"
    lst.write_text("".join(f"file '{p}'\n" for p in parts))
    run(["-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", "-movflags", "+faststart", str(MASTER / "master.mp4")])
    print("master:", probe(MASTER / "master.mp4"))

    # frames per chapter: decode each (trimmed) segment once, then pick evenly spaced
    # source frames so every chapter ends exactly on its segment's last frame
    shutil.rmtree(TMP / "png", ignore_errors=True)
    (TMP / "png").mkdir()
    idx, bounds = 0, [0]
    for n, (p, count) in enumerate(zip(parts, per)):
        src = TMP / f"all{n}"
        shutil.rmtree(src, ignore_errors=True)
        src.mkdir()
        run(["-i", str(p), "-vf", f"scale={a.width}:-2:flags=lanczos", str(src / "%04d.png")])
        allf = sorted(src.glob("*.png"))
        first = 0 if n == 0 else 1          # the previous chapter already ends on this frame
        for k in range(first, count + 1):
            pick = allf[round(k / count * (len(allf) - 1))]
            shutil.copy(pick, TMP / "png" / f"{idx:03d}.png")
            idx += 1
        bounds.append(idx - 1)
        print(f"chapter {n+1}: {len(allf)} source frames -> {count + 1 - first} picked")
    pngs = sorted((TMP / "png").glob("*.png"))
    assert len(pngs) == bounds[-1] + 1, (len(pngs), bounds)

    from PIL import Image, ImageFilter
    for q in (58, 54, 50, 46, 42, 38):
        shutil.rmtree(FRAMES, ignore_errors=True)
        FRAMES.mkdir()
        total = 0
        for pth in pngs:
            dst = FRAMES / (pth.stem + ".webp")
            Image.open(pth).convert("RGB").save(dst, "WEBP", quality=q, method=6)
            total += dst.stat().st_size
        print(f"frames q{q}: {len(pngs)} frames, {total/1e6:.2f} MB")
        if total / 1e6 <= a.budget:
            break

    im0 = Image.open(pngs[0]).convert("RGB")
    im0.resize((480, 270), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.5)).save(ASSETS / "poster.webp", "WEBP", quality=50)

    def crop_save(src, dst, size, q, fx=0.5):
        im = Image.open(src).convert("RGB")
        w, h = size
        r = max(w / im.width, h / im.height)
        im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
        left = int((im.width - w) * fx)
        top = (im.height - h) // 2
        im.crop((left, top, left + w, top + h)).save(ASSETS / dst, "WEBP", quality=q, method=6)

    crop_save(RAW / "k1.png", "product.webp", (900, 1125), 72, fx=0.62)
    for n in ("collagen", "probiotics", "ginger", "mint"):
        crop_save(RAW / f"s_{n}.png", f"ing-{n}.webp", (800, 1000), 72)

    cfg = {
        "bounds": bounds,
        "chapters": [{"len": 2.1, "hold0": 0.42}, {"len": 1.3}, {"len": 2.1}, {"len": 1.35}, {"len": 1.5}, {"len": 2.0, "hold1": 0.36}],
        "focus": [0.5] * 7,
        "stills": bounds,
        "named": {"k0": 0, "k2": bounds[2], "k3": bounds[3], "k6": bounds[6], "buy": bounds[1]},
        "buyFocus": 0.6,
    }
    (ROOT / "cfg.json").write_text(json.dumps(cfg, indent=1))
    print("cfg:", cfg["bounds"])


if __name__ == "__main__":
    main()
