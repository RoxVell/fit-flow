import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "public/icons/icon.svg");
const OUT_DIR = join(ROOT, "public/icons");

const SIZES = [192, 512] as const;

const svg = await readFile(SRC);

for (const size of SIZES) {
  const png = await sharp(svg, { density: 384 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toBuffer();
  const out = join(OUT_DIR, `icon-${size}.png`);
  await writeFile(out, png);
  console.log(`wrote ${out} (${png.length} bytes)`);
}
