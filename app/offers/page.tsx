import type { Metadata } from 'next';
import { OffersBoard } from '@/components/OffersBoard';

export const metadata: Metadata = {
  title: 'Open offers',
  description:
    'Live offers on Tabuline: cards locked in escrow on Solana, waiting for the holder of the card they ask for.',
};

export default function OffersPage() {
  return <OffersBoard />;
}
