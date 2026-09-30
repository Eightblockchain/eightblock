import { readFile } from 'fs/promises';
import path from 'path';
import { ImageResponse } from 'next/og';
import { siteConfig } from '@/lib/site-config';
import { OG_SIZE, clamp, type OgCardContent } from '@/lib/page-metadata';

const BLUE = '#1b9dd9';
const GOLD = '#fcbd1b';
const INK = '#0a0a0a';

export const defaultOgCard: OgCardContent = {
  eyebrow: siteConfig.hero.eyebrow,
  title: `${siteConfig.hero.titleLead} ${siteConfig.hero.titleTrail}`,
  description: siteConfig.description,
  topics: siteConfig.networks,
};

// Satori renders <style> blocks unreliably, so the classes in logo.svg become inline fills.
export async function loadLogo() {
  const svg = await readFile(path.join(process.cwd(), 'public/logo.svg'), 'utf8');
  const inline = svg
    .replace(/<\?xml[^>]*>/, '')
    .replace(/<defs>[\s\S]*?<\/defs>/, '')
    .replaceAll('class="cls-1"', 'fill="#070808"')
    .replaceAll('class="cls-2"', `fill="${BLUE}"`)
    .replaceAll('class="cls-3"', `fill="${GOLD}"`);
  return `data:image/svg+xml;base64,${Buffer.from(inline).toString('base64')}`;
}

const font = (file: string) => readFile(path.join(process.cwd(), 'assets/og', file));

let assets: ReturnType<typeof loadAssets> | undefined;

async function loadAssets() {
  const [logo, display, body, bodyMedium] = await Promise.all([
    loadLogo(),
    font('space-grotesk-latin-700-normal.woff'),
    font('inter-latin-400-normal.woff'),
    font('inter-latin-500-normal.woff'),
  ]);
  return { logo, display, body, bodyMedium };
}

export async function renderOgCard({ title, description, eyebrow, topics = [] }: OgCardContent) {
  assets ??= loadAssets().catch((error) => {
    assets = undefined;
    throw error;
  });
  const { logo, display, body, bodyMedium } = await assets;

  const heading = clamp(title, 90);
  const titleSize = heading.length <= 45 ? 72 : heading.length <= 70 ? 60 : 52;
  const chips = topics.slice(0, 5);
  const host = new URL(siteConfig.url).host;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          fontFamily: 'Inter',
          position: 'relative',
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '56px 72px 48px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
            <img src={logo} width={54} height={64} />
            <span
              style={{
                fontFamily: 'Space Grotesk',
                fontSize: 36,
                color: INK,
                letterSpacing: '-0.02em',
              }}
            >
              {siteConfig.name}
            </span>
          </div>

          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            {eyebrow && (
              <div
                style={{
                  display: 'flex',
                  fontFamily: 'Inter Medium',
                  fontSize: 22,
                  color: BLUE,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: 18,
                }}
              >
                {clamp(eyebrow, 50)}
              </div>
            )}
            <div
              style={{
                display: 'flex',
                fontFamily: 'Space Grotesk',
                fontSize: titleSize,
                lineHeight: 1.08,
                color: INK,
                letterSpacing: '-0.03em',
                maxWidth: 1040,
              }}
            >
              {heading}
            </div>
            {description && (
              <div
                style={{
                  display: 'flex',
                  fontSize: 28,
                  lineHeight: 1.4,
                  color: '#525252',
                  marginTop: 22,
                  maxWidth: 1000,
                }}
              >
                {clamp(description, 170)}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 12 }}>
              {chips.map((topic) => (
                <div
                  key={topic}
                  style={{
                    display: 'flex',
                    fontFamily: 'Inter Medium',
                    fontSize: 20,
                    color: '#262626',
                    border: '2px solid #e5e5e5',
                    borderRadius: 999,
                    padding: '8px 18px',
                  }}
                >
                  {clamp(topic, 24)}
                </div>
              ))}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontFamily: 'Inter Medium',
                fontSize: 24,
                color: INK,
              }}
            >
              <div style={{ width: 12, height: 12, backgroundColor: GOLD, borderRadius: 2 }} />
              {host}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', height: 12 }}>
          <div style={{ flex: 3, backgroundColor: BLUE }} />
          <div style={{ flex: 1, backgroundColor: GOLD }} />
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: 'Space Grotesk', data: display, weight: 700, style: 'normal' },
        { name: 'Inter', data: body, weight: 400, style: 'normal' },
        { name: 'Inter Medium', data: bodyMedium, weight: 500, style: 'normal' },
      ],
    }
  );
}
