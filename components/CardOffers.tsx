'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Offer } from '@/lib/types';
import { useAuth } from './auth';
import { OfferRow } from './OfferRow';

export function CardOffers({
  mint,
  initialOffers,
}: {
  mint: string;
  initialOffers: Offer[];
}) {
  const { address, openSignIn } = useAuth();
  const [offers, setOffers] = useState(initialOffers);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  async function accept(offer: Offer) {
    if (!address) {
      openSignIn();
      return;
    }
    setBusyId(offer.id);
    try {
      const response = await fetch(`/api/offers/${offer.id}/accept`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Could not settle the swap');
      setOffers((current) =>
        current.map((item) => (item.id === offer.id ? (data.offer as Offer) : item))
      );
      setToast('Swap settled. Both cards and USDC moved together.');
    } catch (caught) {
      setToast(caught instanceof Error ? caught.message : 'Could not settle the swap');
    } finally {
      setBusyId(null);
    }
  }

  async function cancel(offer: Offer) {
    if (!address) {
      openSignIn();
      return;
    }
    setBusyId(offer.id);
    try {
      const response = await fetch(`/api/offers/${offer.id}/cancel`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Could not cancel the offer');
      setOffers((current) =>
        current.map((item) => (item.id === offer.id ? (data.offer as Offer) : item))
      );
      setToast('Offer cancelled. The escrow goes back to the maker.');
    } catch (caught) {
      setToast(caught instanceof Error ? caught.message : 'Could not cancel the offer');
    } finally {
      setBusyId(null);
    }
  }

  if (offers.length) {
    return (
      <div className="gx-cardoffers">
        <div className="gx-offerlist">
          {offers.map((offer) => (
            <OfferRow
              key={offer.id}
              offer={offer}
              mode="open"
              address={address}
              busy={busyId === offer.id}
              onAccept={accept}
              onCancel={cancel}
            />
          ))}
        </div>
        {toast ? (
          <div className="gx-toast" role="status">
            <span className="gx-dot" aria-hidden="true" />
            {toast}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="gx-empty">
      <span className="gx-empty-art" aria-hidden="true" />
      <div>
        <h3>No offer yet. Be the first.</h3>
        <p>
          Lock one of your cards for this one, add USDC if yours is worth less. If the holder says
          no, cancel and get everything back.
        </p>
        <Link className="gx-btn gx-btn--primary gx-btn--sm" href={`/app?want=${mint}`}>
          Make an offer <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
