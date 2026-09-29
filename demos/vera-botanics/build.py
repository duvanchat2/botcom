#!/usr/bin/env python3
"""Assemble the single self-contained Vera Botanics page from site.html.

usage: build.py --frames DIR --cfg FILE --poster IMG --product IMG --ing DIR [--qa] [--out NAME]

  --frames   directory of WebP frames (sorted by name) for the scroll canvas
  --cfg      JSON with chapter bounds, lengths, holds, focal points, stills, named frames
  --poster   small blurred first frame shown while the canvas loads
  --product  product still for the "El producto" section
  --ing      directory with ing-collagen/probiotics/ginger/mint.webp
  --qa       wrap in the same skeleton the artifact host adds (viewport meta etc.)
"""
import argparse
import base64
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent
MIME = {".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png"}


def b64(path) -> str:
    return base64.b64encode(pathlib.Path(path).read_bytes()).decode("ascii")


def uri(path) -> str:
    p = pathlib.Path(path)
    return f"data:{MIME[p.suffix]};base64,{b64(p)}"


def placeholder(w, h, title, sub="Imagen pendiente de descarga") -> str:
    """Labelled SVG stand-in for a generated image that could not be embedded yet."""
    text = "" if not title else (
        f'<text x="50%" y="48%" text-anchor="middle" font-family="Georgia, serif" font-style="italic" '
        f'font-size="{w/13:.0f}" fill="#262C25">{title}</text>'
        f'<text x="50%" y="57%" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" '
        f'font-size="{w/36:.0f}" letter-spacing="2" fill="#6E5A40">{sub.upper()}</text>')
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">'
           '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F3EEE4"/>'
           '<stop offset="1" stop-color="#E2D9C7"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/>'
           f'<rect x="{w*.06:.0f}" y="{h*.06:.0f}" width="{w*.88:.0f}" height="{h*.88:.0f}" fill="none" stroke="#8A7152" stroke-opacity=".45"/>'
           + text + '</svg>')
    return "data:image/svg+xml;base64," + base64.b64encode(svg.encode("utf-8")).decode("ascii")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--frames", default="")
    ap.add_argument("--cfg", required=True)
    ap.add_argument("--poster", default="")
    ap.add_argument("--product", default="")
    ap.add_argument("--ing", default="")
    ap.add_argument("--board", action="store_true", help="no frames: storyboard mode with labelled placeholders")
    ap.add_argument("--qa", action="store_true")
    ap.add_argument("--out", default="")
    a = ap.parse_args()

    html = (ROOT / "site.html").read_text(encoding="utf-8")
    frames = [] if a.board else sorted(p for p in pathlib.Path(a.frames).iterdir() if p.suffix == ".webp")
    cfg = json.loads(pathlib.Path(a.cfg).read_text())
    if frames and cfg["bounds"][-1] != len(frames) - 1:
        raise SystemExit(f"cfg bounds end {cfg['bounds'][-1]} != last frame {len(frames) - 1}")
    ing = pathlib.Path(a.ing) if a.ing else None

    def img(path, w, h, title):
        p = pathlib.Path(path) if path else None
        return uri(p) if p and p.exists() else placeholder(w, h, title)
    swaps = {
        "FONT_ALBERT": b64(ROOT / "fonts/albert.woff2"),
        "FONT_IBARRA": b64(ROOT / "fonts/ibarra.woff2"),
        "FONT_IBARRA_I": b64(ROOT / "fonts/ibarra-italic.woff2"),
        "GRAIN": b64(ROOT / "media/grain.png"),
        "POSTER": img(a.poster, 480, 270, ""),
        "PRODUCT": img(a.product, 900, 1125, "Ritual N.º 1"),
        "ING_COLLAGEN": img(ing and ing / "ing-collagen.webp", 800, 1000, "Colágeno hidrolizado"),
        "ING_PROBIOTICS": img(ing and ing / "ing-probiotics.webp", 800, 1000, "Cultivos vivos"),
        "ING_GINGER": img(ing and ing / "ing-ginger.webp", 800, 1000, "Raíz de jengibre"),
        "ING_MINT": img(ing and ing / "ing-mint.webp", 800, 1000, "Hoja de menta"),
        "CFG": json.dumps(cfg, separators=(",", ":")),
    }
    for key, val in swaps.items():
        token = "{{" + key + "}}"
        if token not in html:
            raise SystemExit(f"missing placeholder {token}")
        html = html.replace(token, val)
    if "{{" in html:
        raise SystemExit("unfilled placeholder left in template")

    block = '<script type="text/plain" id="frames" data-mime="image/webp">\n' + "\n".join(b64(f) for f in frames) + "\n</script>"
    if not frames:
        block = '<script type="text/plain" id="frames" data-mime="image/webp"></script>'
    html = html.replace("<!--FRAMES-->", block)

    if a.qa:
        html = (
            '<!doctype html><html><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
            '<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);'
            'padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif;'
            'background:#fafafa}img{max-width:100%}[hidden]{display:none!important}</style>'
            '</head><body>' + html + '</body></html>'
        )

    out = ROOT / "dist" / (a.out or ("vera-qa.html" if a.qa else "vera-botanics.html"))
    out.parent.mkdir(exist_ok=True)
    out.write_text(html, encoding="utf-8")
    fsize = sum(f.stat().st_size for f in frames)
    print(f"{out.name}: {out.stat().st_size/1e6:.2f} MB  ({len(frames)} frames, {fsize/1e6:.2f} MB raw)")
    if out.stat().st_size > 16_000_000:
        raise SystemExit("over the 16 MB artifact limit")


if __name__ == "__main__":
    main()
