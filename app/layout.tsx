import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/auth';

export const metadata: Metadata = {
  metadataBase: new URL('https://gemmora.xyz'),
  title: {
    default: 'Gemmora — swap graded Pokémon cards, no selling first',
    template: '%s — Gemmora',
  },
  description:
    'Gemmora lets Collector Crypt holders swap tokenized graded Pokémon cards directly on Solana: card for card, with optional USDC to balance, settled in one atomic transaction.',
  icons: {
    icon: [{ url: '/icon.png', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'Gemmora — swap graded Pokémon cards, no selling first',
    description:
      'Swap graded Pokémon cards card-for-card on Solana, with optional USDC to balance. One signature, one atomic transaction.',
    type: 'website',
    images: ['/icon.png'],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@Gemmora_xyz',
    creator: '@Gemmora_xyz',
    title: 'Gemmora — swap graded Pokémon cards, no selling first',
    description:
      'Swap graded Pokémon cards card-for-card on Solana, with optional USDC to balance. One signature, one atomic transaction.',
    images: ['/icon.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#06090d',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="gx-html">
      <body className="gx-body">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
