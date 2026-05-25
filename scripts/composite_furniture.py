#!/usr/bin/env python3
"""
Composites a furniture PNG (transparent bg) onto a room photo
at the exact position/scale/rotation specified.
Outputs: composited image + inpaint mask.

Usage:
  python3 scripts/composite_furniture.py \
    --room /path/to/room.png \
    --furniture /path/to/furniture_nobg.png \
    --x 300 --y 400 \
    --scale_x 0.8 --scale_y 0.8 \
    --rotation 0 \
    --out_composite /path/to/composite.png \
    --out_mask /path/to/mask.png
"""

import argparse
import sys
from PIL import Image, ImageDraw, ImageFilter
import numpy as np


def composite_furniture(
    room_path, furniture_path,
    x, y, scale_x, scale_y, rotation,
    out_composite, out_mask
):
    # Load images
    room = Image.open(room_path).convert('RGBA')
    furniture = Image.open(furniture_path).convert('RGBA')

    room_w, room_h = room.size

    # Scale furniture
    new_w = int(furniture.width * scale_x)
    new_h = int(furniture.height * scale_y)
    if new_w < 1:
        new_w = 1
    if new_h < 1:
        new_h = 1
    furniture = furniture.resize((new_w, new_h), Image.LANCZOS)

    # Rotate furniture (Fabric.js angle is clockwise; PIL is counter-clockwise)
    if rotation != 0:
        furniture = furniture.rotate(
            -rotation,
            expand=True,
            resample=Image.BICUBIC
        )

    # Calculate paste position (x,y is center in Fabric.js with originX/Y='center')
    paste_x = int(x - furniture.width / 2)
    paste_y = int(y - furniture.height / 2)

    # Composite onto room
    composite = room.copy()
    composite.paste(furniture, (paste_x, paste_y), furniture)

    # Save composited image (RGB for ComfyUI)
    composite.convert('RGB').save(out_composite, 'PNG')

    # Create inpaint mask
    # White = area to inpaint (where furniture is placed)
    # Black = keep original (rest of room)
    mask = Image.new('L', (room_w, room_h), 0)

    # Get furniture alpha channel to use as mask shape
    furniture_alpha = furniture.split()[3]  # alpha channel

    # Paste white where furniture has alpha > 0
    white = Image.new('L', furniture.size, 255)
    mask.paste(white, (paste_x, paste_y), furniture_alpha)

    # Slightly expand mask edges for better blending at borders (~4px dilation)
    mask = mask.filter(ImageFilter.MaxFilter(9))

    mask.convert('RGB').save(out_mask, 'PNG')

    print(f'Composite: {out_composite}')
    print(f'Mask: {out_mask}')
    print(f'   Room size: {room_w}x{room_h}')
    print(f'   Furniture placed at: ({paste_x}, {paste_y})')
    print(f'   Furniture size: {furniture.width}x{furniture.height}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Composite furniture onto room at specified position.'
    )
    parser.add_argument('--room',          required=True,  help='Path to room image')
    parser.add_argument('--furniture',     required=True,  help='Path to furniture PNG (transparent bg)')
    parser.add_argument('--x',             type=float, required=True,  help='Center X in room pixels')
    parser.add_argument('--y',             type=float, required=True,  help='Center Y in room pixels')
    parser.add_argument('--scale_x',       type=float, default=1.0,    help='Horizontal scale factor')
    parser.add_argument('--scale_y',       type=float, default=1.0,    help='Vertical scale factor')
    parser.add_argument('--rotation',      type=float, default=0.0,    help='Rotation angle in degrees (Fabric.js clockwise)')
    parser.add_argument('--out_composite', required=True,  help='Output path for composited image')
    parser.add_argument('--out_mask',      required=True,  help='Output path for inpaint mask')
    args = parser.parse_args()

    composite_furniture(
        args.room, args.furniture,
        args.x, args.y,
        args.scale_x, args.scale_y,
        args.rotation,
        args.out_composite, args.out_mask
    )
