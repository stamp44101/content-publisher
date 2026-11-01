"""Numbered contact sheet for QA: every candidate image at a glance.

python3 -I contact_sheet.py <out.jpg> <img1> [<img2> ...] [--labels "001,002,..."] [--cols 7]
Labels default to each file's name without extension (use the Run ID number).
"""
import argparse, os
from PIL import Image, ImageDraw

a = argparse.ArgumentParser()
a.add_argument('out'); a.add_argument('imgs', nargs='+')
a.add_argument('--labels', default=''); a.add_argument('--cols', type=int, default=7)
o = a.parse_args()
labels = o.labels.split(',') if o.labels else [os.path.splitext(os.path.basename(p))[0] for p in o.imgs]
w, h = 300, 400
rows = (len(o.imgs) + o.cols - 1) // o.cols
sheet = Image.new('RGB', (w * o.cols, h * rows), 'white')
for i, (p, lab) in enumerate(zip(o.imgs, labels)):
    im = Image.open(p).convert('RGB'); im.thumbnail((w, h))
    d = ImageDraw.Draw(im); d.rectangle([0, 0, 8 + 8 * len(lab), 26], fill='black'); d.text((6, 7), lab, fill='white')
    sheet.paste(im, ((i % o.cols) * w, (i // o.cols) * h))
sheet.save(o.out, quality=85); print('contact sheet', sheet.size)
