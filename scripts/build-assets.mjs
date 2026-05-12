import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const rootDir = path.resolve(import.meta.dirname, "..");
const galleryDir = path.join(rootDir, "ss");
const thumbDir = path.join(galleryDir, "thumbs");
const galleryManifestPath = path.join(rootDir, "data", "gallery.js");
const backgroundInputPath = path.join(rootDir, "bj.png");
const backgroundOutputPath = path.join(rootDir, "assets", "bj-optimized.webp");

const THUMB_WIDTH = 400;
const THUMB_QUALITY = 76;
const BACKGROUND_WIDTH = 1920;
const BACKGROUND_QUALITY = 82;

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function buildGalleryThumbs() {
  await ensureDir(thumbDir);

  const entries = await fs.readdir(galleryDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => /\.(jpe?g|png|webp)$/i.test(name))
    .sort((a, b) => a.localeCompare(b, "en"));

  const manifest = [];

  for (const name of files) {
    const sourcePath = path.join(galleryDir, name);
    const parsed = path.parse(name);
    const thumbFileName = `${parsed.name}.webp`;
    const thumbPath = path.join(thumbDir, thumbFileName);

    const image = sharp(sourcePath, { failOn: "none" }).rotate();
    const metadata = await image.metadata();

    await image
      .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
      .webp({ quality: THUMB_QUALITY })
      .toFile(thumbPath);

    manifest.push({
      full: `ss/${name}`,
      thumb: `ss/thumbs/${thumbFileName}`,
      width: metadata.width ?? null,
      height: metadata.height ?? null,
    });
  }

  const content = `window.SHIKIGAMI_IMAGES = ${JSON.stringify(manifest)};\n`;
  await fs.writeFile(galleryManifestPath, content, "utf8");

  return manifest.length;
}

async function buildBackgroundImage() {
  await sharp(backgroundInputPath, { failOn: "none" })
    .resize({ width: BACKGROUND_WIDTH, withoutEnlargement: true })
    .webp({ quality: BACKGROUND_QUALITY })
    .toFile(backgroundOutputPath);
}

async function main() {
  const count = await buildGalleryThumbs();
  await buildBackgroundImage();
  process.stdout.write(`Built ${count} gallery thumbnails and optimized background.\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
