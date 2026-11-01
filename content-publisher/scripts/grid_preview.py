"""Instagram profile-grid preview (3 columns, 3:4 tiles, newest top-left).

python3 -I grid_preview.py <out.jpg> <newest.png> <next.png> ... <oldest.png>
Pass each post's cover (first slide) in feed order, newest first. Any count works; 9 = three rows.
"""
import sys
from PIL import Image

out, paths = sys.argv[1], sys.argv[2:]
w, h, g = 300, 400, 4
rows = (len(paths) + 2) // 3
img = Image.new('RGB', (w * 3 + g * 2, h * rows + g * (rows - 1)), 'white')
for i, p in enumerate(paths):
    im = Image.open(p).convert('RGB')
    if im.width / im.height > w / h:   # too wide: crop sides
        nw = int(im.height * w / h); x = (im.width - nw) // 2; im = im.crop((x, 0, x + nw, im.height))
    else:                              # too tall: crop top/bottom
        nh = int(im.width * h / w); y = (im.height - nh) // 2; im = im.crop((0, y, im.width, y + nh))
    img.paste(im.resize((w, h)), ((i % 3) * (w + g), (i // 3) * (h + g)))
img.save(out, quality=88); print('grid', img.size)
