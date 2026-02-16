import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || 'Eightblock';
  const description =
    searchParams.get('description') ||
    'Open-source platform for the Cardano community - education, collaboration, and knowledge sharing.';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          backgroundImage: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px',
            maxWidth: '1000px',
          }}
        >
          <h1
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: '#f8fafc',
              textAlign: 'center',
              marginBottom: 20,
              lineHeight: 1.1,
            }}
          >
            {title}
          </h1>
          <p
            style={{
              fontSize: 32,
              color: '#cbd5e1',
              textAlign: 'center',
              marginTop: 0,
              lineHeight: 1.4,
            }}
          >
            {description}
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: 40,
              gap: 12,
            }}
          >
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#fbbf24',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              Eightblock
            </div>
            <div
              style={{
                fontSize: 24,
                color: '#94a3b8',
              }}
            >
              •
            </div>
            <div
              style={{
                fontSize: 24,
                color: '#94a3b8',
              }}
            >
              Cardano Community Hub
            </div>
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 8,
            background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 50%, #fbbf24 100%)',
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
