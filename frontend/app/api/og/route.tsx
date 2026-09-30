import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || 'Eightblock';
  const description =
    searchParams.get('description') ||
    'Notes on blockchain, smart contracts, and decentralized technology.';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#fafafa',
          padding: '60px 72px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 48 }}>
          <div
            style={{
              width: 40,
              height: 40,
              background: '#1b9dd9',
              borderRadius: 4,
            }}
          />
          <div
            style={{
              width: 24,
              height: 24,
              background: '#fcbd1b',
              borderRadius: 2,
              marginLeft: -20,
              marginTop: 16,
            }}
          />
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#070808',
              letterSpacing: '-0.02em',
            }}
          >
            Eightblock
          </span>
        </div>

        <h1
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: '#0a0a0a',
            lineHeight: 1.15,
            marginBottom: 20,
            maxWidth: 900,
          }}
        >
          {title.length > 80 ? title.slice(0, 77) + '…' : title}
        </h1>

        {description && (
          <p
            style={{
              fontSize: 24,
              color: '#737373',
              lineHeight: 1.5,
              maxWidth: 800,
            }}
          >
            {description.length > 120 ? description.slice(0, 117) + '…' : description}
          </p>
        )}

        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ width: 48, height: 3, background: '#1b9dd9', borderRadius: 2 }} />
          <div style={{ width: 24, height: 3, background: '#fcbd1b', borderRadius: 2 }} />
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
