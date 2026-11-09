import type { Metadata } from 'next';
import { AppBrowser } from '@/components/AppBrowser';

export const metadata: Metadata = {
  title: 'Swap',
  description:
    'Offer one of your Collector Crypt cards for the card you want, with optional USDC. Settled on Solana in one transaction.',
};

export default function AppPage() {
  return <AppBrowser />;
}
