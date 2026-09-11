#!/usr/bin/env python3
"""Bereitet die Lab-Logos fuer die Team-Auswahl auf.

Die Quellbilder sind deckende Screenshots mit flaechigem Hintergrund. Hier wird
der Hintergrund per Flood-Fill von den Raendern entfernt, das Motiv beschnitten
und auf eine quadratische, transparente Flaeche gelegt. Logos mit dunklem Grund
werden vorher invertiert, damit alle vier auf hellen Karten funktionieren.

Aufruf:  python3 scripts/build_logos.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SRC = Path("/home/mgross/Pictures/Screenshots")
OUT = ROOT / "app/assets/logos"

SIZE = 512
MARGIN = 0.04          # Anteil der Kantenlaenge, der frei bleibt
FLOOD_TOLERANCE = 8    # eng halten: helle Bildteile duerfen nicht mitgefressen werden

SOURCES = {
    "closedai": "closedAI.png",
    "antithropic": "antithropic.png",
    "grek": "grek.png",
    "shallowseek": "shallowseek.png",
}


def luminance(px):
    return 0.2126 * px[0] + 0.7152 * px[1] + 0.0722 * px[2]


def border_color(im):
    """Medianfarbe der Randpixel — der Hintergrund, den wir entfernen wollen."""
    w, h = im.size
    px = im.load()
    samples = []
    for x in range(0, w, max(1, w // 40)):
        samples += [px[x, 0], px[x, h - 1]]
    for y in range(0, h, max(1, h // 40)):
        samples += [px[0, y], px[w - 1, y]]
    samples.sort(key=luminance)
    return samples[len(samples) // 2]


def strip_background(im):
    """Flood-Fill von allen vier Raendern: nur zusammenhaengender Grund faellt weg.

    Global nach Farbe zu loeschen wuerde helle Motivteile mitnehmen — etwa den
    Sandstreifen im ShallowSeek-Logo, der fast so hell ist wie der Hintergrund.
    """
    rgb = im.convert("RGB")
    w, h = rgb.size
    marker = (255, 0, 255)          # Farbe, die in keinem der Logos vorkommt
    seeds = []
    for x in range(0, w, max(1, w // 60)):
        seeds += [(x, 0), (x, h - 1)]
    for y in range(0, h, max(1, h // 60)):
        seeds += [(0, y), (w - 1, y)]

    bg = border_color(rgb)
    for seed in seeds:
        if rgb.getpixel(seed) == marker:
            continue
        if abs(luminance(rgb.getpixel(seed)) - luminance(bg)) > FLOOD_TOLERANCE:
            continue                # Motiv laeuft hier ueber den Rand — nicht anfassen
        ImageDraw.floodfill(rgb, seed, marker, thresh=FLOOD_TOLERANCE)

    out = im.convert("RGBA")
    pixels = out.load()
    src = rgb.load()
    for y in range(h):
        for x in range(w):
            if src[x, y] == marker:
                pixels[x, y] = (0, 0, 0, 0)
    return out


def is_monochrome(im, tolerance=18):
    """Schwarz-Weiss-Strichzeichnung? Dann ist die Saettigung ueberall nahe null."""
    arr = np.array(im.convert("RGB")).astype(np.int16)
    spread = arr.max(axis=2) - arr.min(axis=2)
    return float(np.percentile(spread, 99)) < tolerance


def ink_from_luminance(im):
    """Strichzeichnung in reine Deckkraft uebersetzen.

    Fuer Schwarz-auf-Weiss-Logos ist die Helligkeit die Information: dunkel wird
    deckend, hell wird transparent. Kompressionsrauschen im hellen Bereich
    verschwindet damit restlos, statt als Fleck stehen zu bleiben — Flood-Fill
    erreicht es nicht, weil es von Anti-Aliasing-Kanten eingeschlossen ist.
    """
    lum = np.array(im.convert("L")).astype(np.float32)
    # Steile Kurve statt linearer Umkehr: dunkle Flaechen werden voll deckend,
    # helles Rauschen faellt auf null. Nur die schmale Kante dazwischen bleibt
    # weich, damit das Anti-Aliasing erhalten bleibt.
    alpha = np.clip((255.0 - lum - 40.0) * 2.6, 0, 255)
    out = np.zeros((*alpha.shape, 4), dtype=np.uint8)
    out[:, :, 3] = alpha.astype(np.uint8)       # Farbe bleibt Schwarz
    return Image.fromarray(out, "RGBA")


def drop_specks(im, min_share=0.0015):
    """Entfernt Streusel, die der Flood-Fill nicht erreicht hat.

    Die Quellbilder enthalten vereinzelte Kompressionsflecken, die nicht mit dem
    Rand zusammenhaengen. Alles, was kleiner ist als `min_share` der groessten
    Flaeche, gehoert nicht zum Motiv.
    """
    arr = np.array(im)
    mask = arr[:, :, 3] > 24
    labels, count = ndimage.label(mask)
    if count == 0:
        return im
    sizes = ndimage.sum(mask, labels, range(1, count + 1))
    keep = np.zeros(count + 1, dtype=bool)
    keep[1:] = sizes >= sizes.max() * min_share
    arr[:, :, 3] = np.where(keep[labels], arr[:, :, 3], 0)
    return Image.fromarray(arr, "RGBA")


def square_canvas(im):
    """Motiv beschneiden und mittig auf eine quadratische Flaeche legen."""
    box = im.getbbox()
    if box:
        im = im.crop(box)
    scale = (SIZE * (1 - 2 * MARGIN)) / max(im.size)
    im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.LANCZOS)
    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    canvas.paste(im, ((SIZE - im.width) // 2, (SIZE - im.height) // 2), im)
    return canvas


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for team, filename in SOURCES.items():
        im = Image.open(SRC / filename).convert("RGBA")
        if luminance(border_color(im.convert("RGB"))) < 128:
            # Grek ist weisse Strichzeichnung auf Schwarz. Invertiert ergibt das
            # schwarze Zeichnung auf Weiss — gleiche Logik wie die anderen drei.
            r, g, b, a = im.split()
            im = Image.merge("RGBA", (
                r.point(lambda v: 255 - v), g.point(lambda v: 255 - v),
                b.point(lambda v: 255 - v), a))
        if is_monochrome(im):
            freed = ink_from_luminance(im)
        else:
            freed = drop_specks(strip_background(im))
        result = square_canvas(freed)
        target = OUT / f"{team}.png"
        result.save(target, optimize=True)
        share = float((np.array(result)[:, :, 3] > 0).mean())
        mode = "Strich" if is_monochrome(im) else "Farbe"
        print(f"  {team:14} {mode:7} {target.stat().st_size // 1024:4} KB   "
              f"Motiv deckt {share:.0%} der Flaeche")


if __name__ == "__main__":
    main()
