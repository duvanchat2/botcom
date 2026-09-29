import sys, glob, os
from PIL import Image, ImageDraw
# usage: sheet.py <dir> <prefix> <out.jpg> [cols] [thumbw]
d, prefix, out = sys.argv[1], sys.argv[2], sys.argv[3]
cols = int(sys.argv[4]) if len(sys.argv) > 4 else 4
tw = int(sys.argv[5]) if len(sys.argv) > 5 else 480
files = sorted(f for f in glob.glob(os.path.join(d, prefix + '-*.png')))
ims = [Image.open(f).convert('RGB') for f in files]
th = int(tw * ims[0].height / ims[0].width)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * (tw + 8) + 8, rows * (th + 28) + 8), (30, 30, 30))
dr = ImageDraw.Draw(sheet)
for i, (f, im) in enumerate(zip(files, ims)):
    x = 8 + (i % cols) * (tw + 8); y = 8 + (i // cols) * (th + 28)
    sheet.paste(im.resize((tw, th), Image.LANCZOS), (x, y + 20))
    dr.text((x, y + 4), os.path.basename(f).replace(prefix + '-', '')[:-4], fill=(235, 235, 235))
sheet.save(out, quality=82)
print(out, sheet.size)
