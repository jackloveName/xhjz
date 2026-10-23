from pathlib import Path
import math

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "static" / "images" / "piaoyu"
OUT_DIR = ASSET_DIR / "app-intro"

FONT_REG = "/System/Library/Fonts/Hiragino Sans GB.ttc"
FONT_BOLD = "/System/Library/Fonts/Hiragino Sans GB.ttc"
FONT_LATIN = "/System/Library/Fonts/HelveticaNeue.ttc"

INK = (16, 23, 34)
MUTED = (91, 105, 123)
BLUE = (61, 139, 255)
BLUE_DARK = (22, 69, 129)
BLUE_SOFT = (238, 246, 255)
YELLOW = (255, 197, 31)
GREEN = (24, 148, 90)
LINE = (223, 234, 248)
WHITE = (255, 255, 255)


def font(size, bold=False, latin=False):
    path = FONT_LATIN if latin else (FONT_BOLD if bold else FONT_REG)
    return ImageFont.truetype(path, int(size), index=0)


def lerp(a, b, t):
    return int(a + (b - a) * t)


def vertical_gradient(size, top, mid, bottom):
    w, h = size
    img = Image.new("RGB", size, top)
    pix = img.load()
    for y in range(h):
        p = y / max(1, h - 1)
        if p < 0.55:
            t = p / 0.55
            c = tuple(lerp(top[i], mid[i], t) for i in range(3))
        else:
            t = (p - 0.55) / 0.45
            c = tuple(lerp(mid[i], bottom[i], t) for i in range(3))
        for x in range(w):
            pix[x, y] = c
    return img.convert("RGBA")


def rounded_rect(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def shadow(base, box, radius, blur, offset, color):
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    moved = (box[0] + offset[0], box[1] + offset[1], box[2] + offset[0], box[3] + offset[1])
    d.rounded_rectangle(moved, radius=radius, fill=color)
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    base.alpha_composite(layer)


def text_center(draw, xy, text, fnt, fill=INK, spacing=8):
    lines = text.split("\n")
    y = xy[1]
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=fnt)
        x = xy[0] - (bbox[2] - bbox[0]) / 2
        draw.text((x, y), line, font=fnt, fill=fill)
        y += bbox[3] - bbox[1] + spacing
    return y - spacing


def text(draw, xy, content, size, fill=INK, bold=False, latin=False, anchor=None):
    draw.text(xy, content, font=font(size, bold=bold, latin=latin), fill=fill, anchor=anchor)


def pill(draw, xy, content, size, fill, color=INK, pad_x=28, pad_y=12):
    f = font(size, bold=True)
    bbox = draw.textbbox((0, 0), content, font=f)
    w = bbox[2] - bbox[0] + pad_x * 2
    h = bbox[3] - bbox[1] + pad_y * 2
    rounded_rect(draw, (xy[0], xy[1], xy[0] + w, xy[1] + h), h // 2, fill)
    draw.text((xy[0] + pad_x, xy[1] + pad_y - 2), content, font=f, fill=color)
    return w, h


def fit_asset(path, size, mode="contain"):
    img = Image.open(path).convert("RGBA")
    sw, sh = img.size
    tw, th = size
    if mode == "cover":
        scale = max(tw / sw, th / sh)
    else:
        scale = min(tw / sw, th / sh)
    nw, nh = int(sw * scale), int(sh * scale)
    img = img.resize((nw, nh), Image.Resampling.LANCZOS)
    if mode == "cover":
        left = max(0, (nw - tw) // 2)
        top = max(0, (nh - th) // 2)
        img = img.crop((left, top, left + tw, top + th))
    return img


def paste_center(base, img, center, alpha=255):
    if alpha < 255:
        img = img.copy()
        a = img.getchannel("A").point(lambda p: int(p * alpha / 255))
        img.putalpha(a)
    x = int(center[0] - img.width / 2)
    y = int(center[1] - img.height / 2)
    base.alpha_composite(img, (x, y))


def draw_header(base, title, subtitle, kicker, compact=False, brand_name="薪花记账"):
    draw = ImageDraw.Draw(base)
    w, h = base.size
    s = w / 1242
    top_y = int(h * (0.055 if compact else 0.065))
    brand_font = font(int(26 * s), True)
    brand_bbox = draw.textbbox((0, 0), brand_name, font=brand_font)
    brand_w = brand_bbox[2] - brand_bbox[0]
    chip_w, chip_h = max(int(214 * s), int(92 * s + brand_w)), int(62 * s)
    chip_x = (w - chip_w) // 2
    rounded_rect(draw, (chip_x, top_y, chip_x + chip_w, top_y + chip_h), int(31 * s), (255, 255, 255, 218), LINE, max(1, int(2 * s)))
    logo = fit_asset(ASSET_DIR / "app-icon.png", (int(42 * s), int(42 * s)))
    base.alpha_composite(logo, (chip_x + int(12 * s), top_y + int(10 * s)))
    draw.text((chip_x + int(66 * s), top_y + int(13 * s)), brand_name, font=brand_font, fill=INK)
    title_size = int((74 if compact else 82) * s)
    title_y = top_y + int((108 if compact else 132) * s)
    title_bottom = text_center(draw, (w / 2, title_y), title, font(title_size, True), INK, int(14 * s))
    sub_y = title_bottom + int(30 * s)
    text_center(draw, (w / 2, sub_y), subtitle, font(int(34 * s), False), MUTED, int(8 * s))
    if kicker:
        pill(draw, (int(96 * s), sub_y + int(72 * s)), kicker, int(24 * s), BLUE_SOFT, BLUE_DARK, int(26 * s), int(12 * s))


def draw_bottom_note(base, note):
    draw = ImageDraw.Draw(base)
    w, h = base.size
    s = w / 1242
    y = h - int(170 * s)
    text_center(draw, (w / 2, y), note, font(int(29 * s), False), (73, 88, 108), int(8 * s))


def draw_phone_surface(base, box):
    draw = ImageDraw.Draw(base)
    radius = int((box[2] - box[0]) * 0.07)
    shadow(base, box, radius, int((box[2] - box[0]) * 0.045), (0, int((box[3] - box[1]) * 0.025)), (33, 86, 148, 28))
    rounded_rect(draw, box, radius, WHITE, LINE, 2)
    inner = (box[0] + 28, box[1] + 28, box[2] - 28, box[3] - 28)
    rounded_rect(draw, inner, max(8, radius - 22), (248, 251, 255), None)
    return inner


def draw_home_mock(base, box):
    draw = ImageDraw.Draw(base)
    inner = draw_phone_surface(base, box)
    x1, y1, x2, y2 = inner
    sw = x2 - x1
    s = sw / 650
    text(draw, (x1 + 34 * s, y1 + 34 * s), "今日收纳", 29 * s, INK, True)
    rounded_rect(draw, (x2 - 155 * s, y1 + 28 * s, x2 - 34 * s, y1 + 76 * s), 22 * s, (16, 23, 34), None)
    text(draw, (x2 - 120 * s, y1 + 39 * s), "新增", 21 * s, WHITE, True)
    card = (x1 + 34 * s, y1 + 112 * s, x2 - 34 * s, y1 + 318 * s)
    rounded_rect(draw, card, 28 * s, (238, 246, 255), LINE, 2)
    text(draw, (card[0] + 28 * s, card[1] + 30 * s), "上传小票", 32 * s, INK, True)
    text(draw, (card[0] + 28 * s, card[1] + 84 * s), "拍照、相册、备注一次完成", 23 * s, MUTED)
    for i, label in enumerate(["小票", "报销", "售后", "重要"]):
        bx = x1 + 34 * s + i * 142 * s
        by = y1 + 356 * s
        rounded_rect(draw, (bx, by, bx + 118 * s, by + 86 * s), 22 * s, WHITE, LINE, 2)
        text(draw, (bx + 28 * s, by + 28 * s), label, 23 * s, INK, True)
    y = y1 + 486 * s
    for i, (label, tag, color) in enumerate([("高铁小票", "待处理", YELLOW), ("耳机售后", "快到期", BLUE), ("纸质发票", "已归档", GREEN)]):
        row = (x1 + 34 * s, y + i * 106 * s, x2 - 34 * s, y + 82 * s + i * 106 * s)
        rounded_rect(draw, row, 24 * s, WHITE, LINE, 2)
        text(draw, (row[0] + 24 * s, row[1] + 20 * s), label, 24 * s, INK, True)
        rounded_rect(draw, (row[2] - 126 * s, row[1] + 20 * s, row[2] - 20 * s, row[1] + 58 * s), 18 * s, color, None)
        text(draw, (row[2] - 108 * s, row[1] + 26 * s), tag, 18 * s, INK if color == YELLOW else WHITE, True)


def draw_flow_mock(base, box):
    draw = ImageDraw.Draw(base)
    inner = draw_phone_surface(base, box)
    x1, y1, x2, y2 = inner
    sw = x2 - x1
    s = sw / 650
    text(draw, (x1 + 34 * s, y1 + 34 * s), "新建凭证", 31 * s, INK, True)
    receipt = (x1 + 46 * s, y1 + 108 * s, x2 - 46 * s, y1 + 340 * s)
    rounded_rect(draw, receipt, 28 * s, WHITE, LINE, 2)
    for i in range(6):
        yy = receipt[1] + 40 * s + i * 28 * s
        draw.rounded_rectangle((receipt[0] + 38 * s, yy, receipt[2] - (190 if i % 2 else 90) * s, yy + 10 * s), 5 * s, fill=(220, 228, 239))
    draw.rounded_rectangle((receipt[0], receipt[3] - 18 * s, receipt[2], receipt[3] - 10 * s), 3 * s, fill=BLUE)
    labels = [("凭证类型", "报销"), ("报销金额", "128.60"), ("提醒日期", "7天后")]
    y = y1 + 388 * s
    for i, (a, b) in enumerate(labels):
        row = (x1 + 34 * s, y + i * 94 * s, x2 - 34 * s, y + 72 * s + i * 94 * s)
        rounded_rect(draw, row, 22 * s, (248, 251, 255), LINE, 2)
        text(draw, (row[0] + 24 * s, row[1] + 22 * s), a, 22 * s, MUTED, True)
        text(draw, (row[2] - 24 * s, row[1] + 20 * s), b, 24 * s, INK, True, anchor="ra")
    flow_y = y1 + 698 * s
    steps = ["上传", "提醒", "处理", "归档"]
    for i, st in enumerate(steps):
        cx = x1 + 82 * s + i * 158 * s
        draw.ellipse((cx - 31 * s, flow_y - 31 * s, cx + 31 * s, flow_y + 31 * s), fill=BLUE if i < 3 else GREEN)
        text(draw, (cx, flow_y + 52 * s), st, 21 * s, INK, True, anchor="ma")
        if i < 3:
            draw.line((cx + 42 * s, flow_y, cx + 116 * s, flow_y), fill=(180, 202, 232), width=max(2, int(4 * s)))


def draw_reminder_mock(base, box):
    draw = ImageDraw.Draw(base)
    inner = draw_phone_surface(base, box)
    x1, y1, x2, y2 = inner
    sw = x2 - x1
    s = sw / 650
    text(draw, (x1 + 34 * s, y1 + 34 * s), "提醒日程", 31 * s, INK, True)
    banner = (x1 + 34 * s, y1 + 96 * s, x2 - 34 * s, y1 + 164 * s)
    rounded_rect(draw, banner, 22 * s, (255, 243, 191), None)
    text(draw, (banner[0] + 24 * s, banner[1] + 20 * s), "有 2 项未完成提醒", 23 * s, INK, True)
    modal = (x1 + 52 * s, y1 + 218 * s, x2 - 52 * s, y1 + 718 * s)
    shadow(base, modal, int(34 * s), int(34 * s), (0, int(20 * s)), (16, 23, 34, 28))
    rounded_rect(draw, modal, 34 * s, WHITE, LINE, 2)
    draw.ellipse((modal[0] + 38 * s, modal[1] + 38 * s, modal[0] + 84 * s, modal[1] + 84 * s), fill=YELLOW)
    text(draw, (modal[0] + 110 * s, modal[1] + 42 * s), "有凭证需要处理", 29 * s, INK, True)
    photo = (modal[0] + 54 * s, modal[1] + 108 * s, modal[2] - 54 * s, modal[1] + 296 * s)
    rounded_rect(draw, photo, 22 * s, BLUE_SOFT, LINE, 2)
    for i in range(5):
        draw.rounded_rectangle((photo[0] + 36 * s, photo[1] + 34 * s + i * 27 * s, photo[2] - 70 * s - i * 18 * s, photo[1] + 45 * s + i * 27 * s), 5 * s, fill=(201, 216, 235))
    text(draw, (modal[0] + 54 * s, modal[1] + 330 * s), "报销小票", 28 * s, INK, True)
    text(draw, (modal[0] + 54 * s, modal[1] + 376 * s), "2026-07-31 提醒", 22 * s, MUTED)
    buttons = [("不再提醒", (248, 251, 255), MUTED), ("今日不提醒", (248, 251, 255), MUTED), ("去处理", BLUE, WHITE)]
    by = modal[3] - 96 * s
    bw = (modal[2] - modal[0] - 132 * s) / 3
    for i, (label, bg, fg) in enumerate(buttons):
        bx = modal[0] + 42 * s + i * (bw + 24 * s)
        rounded_rect(draw, (bx, by, bx + bw, by + 62 * s), 20 * s, bg, LINE if i < 2 else None, 2)
        text(draw, (bx + bw / 2, by + 16 * s), label, 20 * s, fg, True, anchor="ma")


def draw_stats_mock(base, box):
    draw = ImageDraw.Draw(base)
    inner = draw_phone_surface(base, box)
    x1, y1, x2, y2 = inner
    sw = x2 - x1
    s = sw / 650
    text(draw, (x1 + 34 * s, y1 + 34 * s), "统计概览", 31 * s, INK, True)
    rounded_rect(draw, (x2 - 170 * s, y1 + 28 * s, x2 - 34 * s, y1 + 76 * s), 20 * s, (16, 23, 34), None)
    text(draw, (x2 - 147 * s, y1 + 39 * s), "切换月份", 20 * s, WHITE, True)
    hero = (x1 + 34 * s, y1 + 112 * s, x2 - 34 * s, y1 + 260 * s)
    rounded_rect(draw, hero, 28 * s, (16, 23, 34), None)
    text(draw, (hero[0] + 32 * s, hero[1] + 30 * s), "本月处理率", 22 * s, (190, 204, 224), True)
    text(draw, (hero[0] + 32 * s, hero[1] + 68 * s), "76%", 54 * s, WHITE, True, latin=True)
    text(draw, (hero[2] - 32 * s, hero[1] + 46 * s), "未完成 3 项", 24 * s, YELLOW, True, anchor="ra")
    text(draw, (x1 + 34 * s, y1 + 308 * s), "本月类型", 25 * s, INK, True)
    bars = [("小票", 0.72, BLUE), ("报销", 0.52, YELLOW), ("售后", 0.34, GREEN), ("重要", 0.22, BLUE_DARK)]
    y = y1 + 358 * s
    for i, (label, pct, color) in enumerate(bars):
        yy = y + i * 64 * s
        text(draw, (x1 + 34 * s, yy), label, 21 * s, MUTED, True)
        draw.rounded_rectangle((x1 + 126 * s, yy + 7 * s, x2 - 80 * s, yy + 23 * s), 8 * s, fill=(232, 238, 247))
        draw.rounded_rectangle((x1 + 126 * s, yy + 7 * s, x1 + 126 * s + (x2 - x1 - 206 * s) * pct, yy + 23 * s), 8 * s, fill=color)
    text(draw, (x1 + 34 * s, y1 + 650 * s), "生活提示", 25 * s, INK, True)
    tips = ["月底先看未归档凭证", "报销材料建议保留原图", "售后凭证到期前再确认一次"]
    for i, tip in enumerate(tips):
        row = (x1 + 34 * s, y1 + 696 * s + i * 76 * s, x2 - 34 * s, y1 + 752 * s + i * 76 * s)
        rounded_rect(draw, row, 20 * s, (248, 251, 255), LINE, 2)
        text(draw, (row[0] + 24 * s, row[1] + 15 * s), tip, 20 * s, INK, True)


def compose(idx, size):
    w, h = size
    compact = h / w < 2.0
    base = vertical_gradient(size, (235, 245, 255), (248, 251, 255), (255, 255, 255))
    draw = ImageDraw.Draw(base)
    s = w / 1242
    brand_name = "薪花记账"
    if idx == 1:
        draw_header(base, "把凭证收进\n安全的小岛" if not compact else "把凭证收进安全的小岛", "小票、报销、售后、重要材料，一次归档", "不做记账，只管凭证闭环", compact, brand_name)
        art_size = (int(w * (0.96 if compact else 1.06)), int(h * (0.42 if compact else 0.38)))
        art = fit_asset(ASSET_DIR / "home-hero.png", art_size, "contain")
        paste_center(base, art, (w * 0.55, h * (0.61 if compact else 0.6)), 245)
        logo = fit_asset(ASSET_DIR / "app-logo-1024.png", (int(w * 0.31), int(w * 0.31)), "contain")
        paste_center(base, logo, (w * 0.25, h * (0.72 if compact else 0.72)), 245)
        draw_bottom_note(base, "照片证据、保修材料、报销附件，都安静留好")
    elif idx == 2:
        draw_header(base, "上传小票\n处理有闭环" if not compact else "上传小票，处理有闭环", "金额、图片、备注、提醒日期都留好", "适合报销、售后和重要凭证", compact, brand_name)
        box_w = int(w * (0.78 if compact else 0.72))
        box_h = int(h * (0.48 if compact else 0.44))
        draw_flow_mock(base, ((w - box_w) // 2, int(h * (0.38 if compact else 0.36)), (w + box_w) // 2, int(h * (0.38 if compact else 0.36)) + box_h))
        draw_bottom_note(base, "创建时不选处理状态，后续办理时再完成归档")
    elif idx == 3:
        draw_header(base, "提醒不打扰\n但不会漏" if not compact else "提醒不打扰，但不会漏", "打开 App 就看到待处理凭证", "不再提醒、今日不提醒、去处理", compact, brand_name)
        box_w = int(w * (0.78 if compact else 0.72))
        box_h = int(h * (0.5 if compact else 0.45))
        draw_reminder_mock(base, ((w - box_w) // 2, int(h * (0.36 if compact else 0.35)), (w + box_w) // 2, int(h * (0.36 if compact else 0.35)) + box_h))
        draw_bottom_note(base, "小票图片可直接预览，办理完一键归档")
    else:
        draw_header(base, "按月统计\n月底总览" if not compact else "按月统计，月底总览", "看处理率、类型分布和生活提示", "只关注未完成，不制造负担", compact, brand_name)
        box_w = int(w * (0.78 if compact else 0.72))
        box_h = int(h * (0.5 if compact else 0.45))
        draw_stats_mock(base, ((w - box_w) // 2, int(h * (0.36 if compact else 0.35)), (w + box_w) // 2, int(h * (0.36 if compact else 0.35)) + box_h))
        draw_bottom_note(base, "每月最后一天提醒未处理凭证，当天关闭后不再打扰")
    return base.convert("RGB")


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    sizes = [(1242, 2688), (1080, 1920)]
    for idx in range(1, 5):
        for size in sizes:
            img = compose(idx, size)
            out = OUT_DIR / f"intro-{idx:02d}-{size[0]}x{size[1]}.png"
            img.save(out, quality=95)
            print(out)


if __name__ == "__main__":
    main()
