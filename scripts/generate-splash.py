#!/usr/bin/env python3
"""
Generate the branded NOMO splash screen as a static PNG.
Matches the HTML neon splash design: dark gradient, purple glow,
app icon, NOMO title with glow, tagline, loading bar.

Output: ios/App/App/Assets.xcassets/LaunchSplash.imageset/ (1x, 2x, 3x)
"""

import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

# Canvas: iPhone 14 Pro Max native resolution (3x)
W, H = 1290, 2796

# Colors (matching index.html splash)
BG_TOP    = (10, 0, 20)      # #0a0014
BG_MID    = (26, 5, 48)      # #1a0530
BG_BOT    = (13, 0, 32)      # #0d0020
PURPLE    = (168, 85, 247)   # #a855f7
PURPLE_LT = (192, 132, 252)  # #c084fc
TEXT_CLR   = (226, 212, 240)  # #e2d4f0
TAG_CLR    = (168, 130, 220)  # muted purple for tagline
WHITE      = (255, 255, 255)

FONT_BOLD = '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'
FONT_REG  = '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'
ICON_PATH = os.path.join(PROJECT_ROOT, 'public', 'app-icon.png')


def lerp_color(c1, c2, t):
    """Linear interpolate between two RGB tuples."""
    return tuple(int(a + (b - a) * t) for a, b in zip(c1, c2))


def draw_gradient(img):
    """Draw the vertical 3-stop gradient background."""
    draw = ImageDraw.Draw(img)
    mid_y = int(H * 0.4)  # gradient midpoint at 40%
    for y in range(H):
        if y <= mid_y:
            t = y / mid_y
            color = lerp_color(BG_TOP, BG_MID, t)
        else:
            t = (y - mid_y) / (H - mid_y)
            color = lerp_color(BG_MID, BG_BOT, t)
        draw.line([(0, y), (W, y)], fill=color)


def draw_glow(img):
    """Draw the ambient purple glow circle (blurred)."""
    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    # Circle center at 30% from top (matching CSS: top:30%)
    cx, cy = W // 2, int(H * 0.30)
    radius = 450  # ~900px diameter at 3x
    bbox = (cx - radius, cy - radius, cx + radius, cy + radius)
    # Draw radial gradient by concentric circles
    for r in range(radius, 0, -1):
        t = 1.0 - (r / radius)  # 0 at edge, 1 at center
        alpha = int(t * t * 80)  # quadratic falloff, max ~80/255
        glow_draw.ellipse(
            (cx - r, cy - r, cx + r, cy + r),
            fill=(*PURPLE, alpha)
        )
    # Blur for extra softness
    glow = glow.filter(ImageFilter.GaussianBlur(radius=60))
    img.paste(Image.alpha_composite(
        img.convert('RGBA'), glow
    ))
    return img


def draw_scanlines(img):
    """Draw subtle horizontal scanlines overlay."""
    overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for y in range(0, H, 4):
        draw.line([(0, y + 2), (W, y + 2)], fill=(255, 255, 255, 2))
        draw.line([(0, y + 3), (W, y + 3)], fill=(255, 255, 255, 2))
    img = Image.alpha_composite(img.convert('RGBA'), overlay)
    return img


def draw_icon(img):
    """Draw the app icon with rounded corners and shadow."""
    icon_size = 216  # 72px * 3x
    corner_radius = 48  # 16px * 3x

    icon = Image.open(ICON_PATH).convert('RGBA')
    icon = icon.resize((icon_size, icon_size), Image.LANCZOS)

    # Round corners
    mask = Image.new('L', (icon_size, icon_size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle(
        (0, 0, icon_size, icon_size),
        radius=corner_radius, fill=255
    )
    icon.putalpha(mask)

    # Shadow
    shadow = Image.new('RGBA', (icon_size + 60, icon_size + 60), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle(
        (30, 30, icon_size + 30, icon_size + 30),
        radius=corner_radius,
        fill=(147, 51, 234, 60)  # purple shadow
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=20))

    # Position: centered, above NOMO (at ~38% from top)
    icon_y = int(H * 0.34)
    icon_x = (W - icon_size) // 2
    shadow_x = icon_x - 30
    shadow_y = icon_y - 30

    img.paste(shadow, (shadow_x, shadow_y), shadow)
    img.paste(icon, (icon_x, icon_y), icon)
    return img, icon_y + icon_size


def draw_text(img, below_icon_y):
    """Draw NOMO title, tagline."""
    draw = ImageDraw.Draw(img)

    # NOMO title
    title_size = 156  # ~52px * 3x
    try:
        font_title = ImageFont.truetype(FONT_BOLD, title_size)
    except:
        font_title = ImageFont.load_default()

    title_text = "NOMO"
    bbox = font_title.getbbox(title_text)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]

    # Add letter spacing by drawing char by char
    spacing = 24  # 8px * 3x
    total_w = 0
    char_widths = []
    for ch in title_text:
        cb = font_title.getbbox(ch)
        cw = cb[2] - cb[0]
        char_widths.append(cw)
        total_w += cw
    total_w += spacing * (len(title_text) - 1)

    title_y = below_icon_y + 60  # 20px * 3x gap after icon
    title_x = (W - total_w) // 2

    # Draw glow layers (multiple passes with offsets for shadow/glow)
    glow_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_layer)

    # Purple glow (outer)
    x = title_x
    for i, ch in enumerate(title_text):
        glow_draw.text((x, title_y), ch, fill=(*PURPLE, 100), font=font_title)
        x += char_widths[i] + (spacing if i < len(title_text) - 1 else 0)
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=30))
    img = Image.alpha_composite(img.convert('RGBA'), glow_layer)

    # Second glow pass (tighter)
    glow_layer2 = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    glow_draw2 = ImageDraw.Draw(glow_layer2)
    x = title_x
    for i, ch in enumerate(title_text):
        glow_draw2.text((x, title_y), ch, fill=(*PURPLE, 140), font=font_title)
        x += char_widths[i] + (spacing if i < len(title_text) - 1 else 0)
    glow_layer2 = glow_layer2.filter(ImageFilter.GaussianBlur(radius=12))
    img = Image.alpha_composite(img, glow_layer2)

    # Main text
    main_draw = ImageDraw.Draw(img)
    x = title_x
    for i, ch in enumerate(title_text):
        main_draw.text((x, title_y), ch, fill=TEXT_CLR, font=font_title)
        x += char_widths[i] + (spacing if i < len(title_text) - 1 else 0)

    # Tagline
    tag_size = 36  # ~12px * 3x
    try:
        font_tag = ImageFont.truetype(FONT_REG, tag_size)
    except:
        font_tag = ImageFont.load_default()

    tag_text = "FOCUS  \u00b7  GROW  \u00b7  COLLECT"
    tag_bbox = font_tag.getbbox(tag_text)
    tag_w = tag_bbox[2] - tag_bbox[0]
    tag_x = (W - tag_w) // 2
    tag_y = title_y + th + 36  # 12px * 3x gap

    main_draw.text((tag_x, tag_y), tag_text, fill=(*TAG_CLR, 153), font=font_tag)

    return img, tag_y + (tag_bbox[3] - tag_bbox[1])


def draw_loading_bar(img, below_tag_y):
    """Draw the loading bar track and fill."""
    draw = ImageDraw.Draw(img)

    bar_w = 540  # 180px * 3x
    bar_h = 18   # 6px * 3x
    bar_x = (W - bar_w) // 2
    bar_y = below_tag_y + 120  # 40px * 3x gap

    # Track background
    draw.rounded_rectangle(
        (bar_x, bar_y, bar_x + bar_w, bar_y + bar_h),
        radius=9,
        fill=(255, 255, 255, 20)  # rgba(255,255,255,0.08)
    )

    # Track border
    draw.rounded_rectangle(
        (bar_x, bar_y, bar_x + bar_w, bar_y + bar_h),
        radius=9,
        outline=(*PURPLE, 51),  # rgba(168,85,247,0.2)
        width=2
    )

    # Fill (~30%)
    fill_w = int(bar_w * 0.3)

    # Gradient fill
    fill_img = Image.new('RGBA', (fill_w, bar_h), (0, 0, 0, 0))
    fill_draw = ImageDraw.Draw(fill_img)
    for x in range(fill_w):
        t = x / fill_w
        color = lerp_color(PURPLE, PURPLE_LT, t)
        fill_draw.line([(x, 0), (x, bar_h)], fill=(*color, 255))

    # Round the fill
    fill_mask = Image.new('L', (fill_w, bar_h), 0)
    fm_draw = ImageDraw.Draw(fill_mask)
    fm_draw.rounded_rectangle((0, 0, fill_w, bar_h), radius=9, fill=255)
    fill_img.putalpha(fill_mask)

    # Glow on the fill
    glow = fill_img.copy().filter(ImageFilter.GaussianBlur(radius=8))
    img.paste(Image.alpha_composite(
        img.crop((bar_x, bar_y - 10, bar_x + fill_w, bar_y + bar_h + 10)).convert('RGBA').resize((fill_w, bar_h + 20)),
        glow.resize((fill_w, bar_h + 20)) if fill_w > 0 else glow
    ), (bar_x, bar_y - 10))

    img.paste(fill_img, (bar_x + 2, bar_y + 1), fill_img)

    return img


def main():
    print(f"Generating splash image {W}x{H}...")

    # Start with gradient background
    img = Image.new('RGB', (W, H), BG_TOP)
    draw_gradient(img)
    img = img.convert('RGBA')

    # Add glow
    img = draw_glow(img)

    # Add scanlines
    img = draw_scanlines(img)

    # Add icon
    img, below_icon = draw_icon(img)

    # Add text
    img, below_tag = draw_text(img, below_icon)

    # Add loading bar
    img = draw_loading_bar(img, below_tag)

    # Convert to RGB for PNG output (no alpha needed)
    img = img.convert('RGB')

    # Output directory
    out_dir = os.path.join(
        PROJECT_ROOT, 'ios', 'App', 'App',
        'Assets.xcassets', 'LaunchSplash.imageset'
    )
    os.makedirs(out_dir, exist_ok=True)

    # Save at 3 scales
    # 3x = full res (1290x2796)
    img.save(os.path.join(out_dir, 'splash-3x.png'), 'PNG', optimize=True)
    print(f"  3x: {W}x{H}")

    # 2x = 860x1864
    w2, h2 = W * 2 // 3, H * 2 // 3
    img2 = img.resize((w2, h2), Image.LANCZOS)
    img2.save(os.path.join(out_dir, 'splash-2x.png'), 'PNG', optimize=True)
    print(f"  2x: {w2}x{h2}")

    # 1x = 430x932
    w1, h1 = W // 3, H // 3
    img1 = img.resize((w1, h1), Image.LANCZOS)
    img1.save(os.path.join(out_dir, 'splash-1x.png'), 'PNG', optimize=True)
    print(f"  1x: {w1}x{h1}")

    # Write Contents.json
    contents = """{
  "images": [
    {
      "idiom": "universal",
      "filename": "splash-1x.png",
      "scale": "1x"
    },
    {
      "idiom": "universal",
      "filename": "splash-2x.png",
      "scale": "2x"
    },
    {
      "idiom": "universal",
      "filename": "splash-3x.png",
      "scale": "3x"
    }
  ],
  "info": {
    "version": 1,
    "author": "xcode"
  }
}"""
    with open(os.path.join(out_dir, 'Contents.json'), 'w') as f:
        f.write(contents)

    print(f"Done! Output: {out_dir}")


if __name__ == '__main__':
    main()
