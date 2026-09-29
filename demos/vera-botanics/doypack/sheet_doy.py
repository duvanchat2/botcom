#!/usr/bin/env python3
"""Frame sheet for chained doypack segments: start, 1/3, 2/3 and last frame of each.
usage: sheet_doy.py out.jpg raw/d1.mp4 raw/d2.mp4 ..."""
import subprocess, sys
from PIL import Image, ImageDraw
out, segs = sys.argv[1], sys.argv[2:]
def dur(f):
    e = subprocess.run(['ffmpeg', '-i', f], capture_output=True, text=True).stderr
    t = e.split('Duration: ')[1].split(',')[0].split(':')
    return int(t[0]) * 3600 + int(t[1]) * 60 + float(t[2])
cells = []
for n, f in enumerate(segs, 1):
    d = dur(f)
    for lab, t in (('ini', 0), ('1/3', d / 3), ('2/3', 2 * d / 3), ('fin', d - 0.06)):
        p = f'/tmp/sh_{n}_{lab.replace("/", "")}.png'
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', f'{t:.3f}', '-i', f, '-frames:v', '1', '-vf', 'scale=480:-2', p], check=True)
        cells.append((Image.open(p).convert('RGB'), f'seg {n} {lab} ({t:.1f}s)'))
w, h = cells[0][0].size
s = Image.new('RGB', (4 * (w + 4), len(segs) * (h + 20)), (30, 30, 30))
dr = ImageDraw.Draw(s)
for k, (im, l) in enumerate(cells):
    x, y = (k % 4) * (w + 4), (k // 4) * (h + 20)
    s.paste(im, (x, y + 18)); dr.text((x + 2, y + 3), l, fill=(240, 240, 240))
s.save(out, quality=85)
print(out, s.size)
