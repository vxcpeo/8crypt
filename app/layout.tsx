import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/auth';

export const metadata: Metadata = {
  metadataBase: new URL('https://tabuline.top'),
  title: {
    default: 'Tabuline — swap graded Pokémon cards, no selling first',
    template: '%s — Tabuline',
  },
  description:
    'Tabuline lets Collector Crypt holders swap tokenized graded Pokémon cards directly on Solana: card for card, with optional USDC to balance, settled in one atomic transaction.',
  icons: {
    icon: [{ url: '/icon.png', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'Tabuline — swap graded Pokémon cards, no selling first',
    description:
      'Swap graded Pokémon cards card-for-card on Solana, with optional USDC to balance. One signature, one atomic transaction.',
    type: 'website',
    images: ['/icon.png'],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@tabuline_top',
    creator: '@tabuline_top',
    title: 'Tabuline — swap graded Pokémon cards, no selling first',
    description:
      'Swap graded Pokémon cards card-for-card on Solana, with optional USDC to balance. One signature, one atomic transaction.',
    images: ['/icon.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f5faff',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="tx-html">
      <body className="tx-body">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
