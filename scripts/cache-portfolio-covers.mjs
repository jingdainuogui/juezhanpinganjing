import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

const rootDir = path.resolve(import.meta.dirname, "..");
const outputDir = path.join(rootDir, "assets", "portfolio-covers");
const dataFiles = [
  path.join(rootDir, "data", "portfolio.js"),
  path.join(rootDir, "data", "douyin-import.js"),
];

function extensionFrom(response) {
  const type = response.headers.get("content-type") || "";
  if (type.includes("png")) return "png";
  if (type.includes("webp")) return "webp";
  return "jpg";
}

async function cacheCover(url) {
  const key = createHash("sha256").update(url).digest("hex").slice(0, 16);
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; portfolio-cover-cache/1.0)",
      "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

  const filename = `${key}.${extensionFrom(response)}`;
  await fs.writeFile(path.join(outputDir, filename), Buffer.from(await response.arrayBuffer()));
  return `assets/portfolio-covers/${filename}`;
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  const cached = new Map();

  for (const filePath of dataFiles) {
    let content = await fs.readFile(filePath, "utf8");
    const urls = [...content.matchAll(/["']?cover["']?\s*:\s*["'](https?:\/\/[^"']+)["']/g)].map((match) => match[1]);

    for (const url of [...new Set(urls)]) {
      if (!cached.has(url)) {
        try {
          cached.set(url, await cacheCover(url));
        } catch (error) {
          console.warn(`Skipped cover: ${error.message}`);
        }
      }
    }

    content = content.replace(/(["']?cover["']?\s*:\s*["'])(https?:\/\/[^"']+)(["'])/g, (match, start, url, end) => (
      cached.has(url) ? `${start}${cached.get(url)}${end}` : match
    ));
    await fs.writeFile(filePath, content, "utf8");
  }

  process.stdout.write(`Cached ${cached.size} portfolio covers.\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
