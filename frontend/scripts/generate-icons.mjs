// Renders public/logo.svg into app/favicon.ico and the web app manifest icons in public/.
// Run from frontend/ after changing the logo: node scripts/generate-icons.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { createElement as h } from 'react';
import { ImageResponse } from 'next/dist/compiled/@vercel/og/index.node.js';

const LOGO_RATIO = 256.91 / 305.62;

const svg = (await readFile('public/logo.svg', 'utf8'))
  .replace(/<\?xml[^>]*>/, '')
  .replace(/<defs>[\s\S]*?<\/defs>/, '')
  .replaceAll('class="cls-1"', 'fill="#070808"')
  .replaceAll('class="cls-2"', 'fill="#1b9dd9"')
  .replaceAll('class="cls-3"', 'fill="#fcbd1b"');
const logo = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

/** `fill` is the share of the square the logo's height takes; `background` null = transparent. */
async function png(size, { fill = 0.92, background = null } = {}) {
  const height = Math.round(size * fill);
  const element = h(
    'div',
    {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...(background ? { backgroundColor: background } : {}),
      },
    },
    h('img', { src: logo, height, width: Math.round(height * LOGO_RATIO) })
  );
  const response = new ImageResponse(element, { width: size, height: size });
  return Buffer.from(await response.arrayBuffer());
}

/** ICO container holding PNG images, which every current browser reads. */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + images.length * 16;
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...images.map(({ data }) => data)]);
}

const favicon = await Promise.all(
  [16, 32, 48].map(async (size) => ({ size, data: await png(size) }))
);
await writeFile('app/favicon.ico', ico(favicon));
await writeFile('public/icon-192.png', await png(192));
await writeFile('public/icon-512.png', await png(512));
// Maskable icons are cropped to a circle by some launchers, so the logo stays inside the safe zone.
await writeFile(
  'public/icon-maskable-512.png',
  await png(512, { fill: 0.6, background: '#ffffff' })
);
console.log('Wrote app/favicon.ico, public/icon-192.png, icon-512.png, icon-maskable-512.png');
