'use client';

import Link from 'next/link';
import { CARD_BY_MINT } from '@/lib/cards';
import { formatUsdc, shortAddress, timeAgo } from '@/lib/format';
import type { Offer } from '@/lib/types';

export function OfferRow({
  offer,
  mode,
  address,
  busy,
  onAccept,
  onCancel,
}: {
  offer: Offer;
  mode: 'sent' | 'received' | 'open' | 'completed';
  address: string | null;
  busy: boolean;
  onAccept?: (offer: Offer) => void;
  onCancel?: (offer: Offer) => void;
}) {
  const offered = CARD_BY_MINT.get(offer.offeredMint);
  const wanted = CARD_BY_MINT.get(offer.wantedMint);
  if (!offered || !wanted) return null;

  const isMaker = address === offer.maker;
  const canAccept = Boolean(address) && !isMaker && mode !== 'sent' && offer.status === 'open';
  const canCancel = Boolean(address) && isMaker && offer.status === 'open';

  return (
    <article className="tx-offer">
      <Link href={`/card/${offered.mint}`} className="tx-offer-side">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={offered.image} alt={offered.name} />
        <div>
          <b>{offered.name}</b>
          <small>{offered.grade}</small>
          <small>${offered.insuredValue.toLocaleString('en-US')}</small>
        </div>
      </Link>
      <div className="tx-offer-swap" aria-hidden="true">
        ⇄
      </div>
      <Link href={`/card/${wanted.mint}`} className="tx-offer-side tx-offer-side--right">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={wanted.image} alt={wanted.name} />
        <div>
          <b>{wanted.name}</b>
          <small>{wanted.grade}</small>
          <small>${wanted.insuredValue.toLocaleString('en-US')}</small>
        </div>
      </Link>

      <div className="tx-offer-bottom">
        <div className="tx-offer-meta">
          <span className={`tx-pill${offer.status === 'open' ? '' : ' tx-pill--muted'}`}>
            {offer.status === 'open' ? 'Open' : offer.status === 'accepted' ? 'Settled' : 'Cancelled'}
          </span>
          <span>by {shortAddress(offer.maker)}</span>
          <span>·</span>
          <span>{timeAgo(offer.createdAt)}</span>
          {offer.usdcAdded > 0 ? (
            <>
              <span>·</span>
              <span>+{formatUsdc(offer.usdcAdded)} to owner</span>
            </>
          ) : null}
          {offer.usdcRequested > 0 ? (
            <>
              <span>·</span>
              <span>asks {formatUsdc(offer.usdcRequested)}</span>
            </>
          ) : null}
          <span>·</span>
          <span>1 USDC fee / side</span>
          {offer.expiresAt ? (
            <>
              <span>·</span>
              <span>expires {new Date(offer.expiresAt).toLocaleDateString()}</span>
            </>
          ) : null}
        </div>
        <div className="tx-offer-actions">
          {offer.status === 'open' ? (
            <>
              {canAccept && onAccept ? (
                <button
                  type="button"
                  className="tx-mini tx-mini--solid"
                  disabled={busy}
                  onClick={() => onAccept(offer)}
                >
                  {busy ? 'Settling…' : 'Accept swap'} <span aria-hidden="true">→</span>
                </button>
              ) : null}
              {canCancel && onCancel ? (
                <button
                  type="button"
                  className="tx-mini"
                  disabled={busy}
                  onClick={() => onCancel(offer)}
                >
                  {busy ? 'Cancelling…' : 'Cancel offer'}
                </button>
              ) : null}
              {!address ? (
                <span className="tx-offer-meta">Connect a wallet to answer</span>
              ) : null}
            </>
          ) : (
            <Link href={`/card/${wanted.mint}`} className="tx-mini">
              View card
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
