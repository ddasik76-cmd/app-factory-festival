import { readFile, mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
const root = new URL('../../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('src/data/projectThumbnails.json', root), 'utf8'));
const entries = Object.entries(manifest).filter(([, value]) => value.status === 'ready');
const layers = [];
for (let i = 0; i < entries.length; i++) {
  const [id, value] = entries[i];
  const bytes = await readFile(new URL(`public/project-thumbnails/${value.file}`, root));
  const metadata = await sharp(bytes).metadata();
  if (metadata.width !== 1280 || metadata.height !== 720) throw new Error(`Unexpected size: ${id}`);
  layers.push({ input: await sharp(bytes).resize(320, 180).png().toBuffer(), left: i % 4 * 320, top: Math.floor(i / 4) * 200 + 20 });
  layers.push({
    input: Buffer.from(`<svg width="320" height="20"><text x="6" y="15" font-size="13">${i + 1} ${id.slice(0, 16)}</text></svg>`),
    left: i % 4 * 320, top: Math.floor(i / 4) * 200,
  });
}
await mkdir(new URL('test-results/', root), { recursive: true });
await sharp({ create: { width: 1280, height: Math.ceil(entries.length / 4) * 200, channels: 3, background: '#ffffff' } })
  .composite(layers).png().toFile(fileURLToPath(new URL('test-results/thumbnail-sheet.png', root)));
console.log(`Verified ${entries.length} images at 1280×720.`);
