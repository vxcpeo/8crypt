'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { Offer } from '@/lib/types';
import { SignInButton, useAuth } from './auth';
import { CommandLine, Console, IndexPane, StatusBar, StatusFoot, Work } from './Console';
import { OfferRow } from './OfferRow';

function EmptyBox({
  title,
  body,
  cta,
  href,
}: {
  title: string;
  body: string;
  cta?: string;
  href?: string;
}) {
  return (
    <div className="gx-empty">
      <span className="gx-empty-art" aria-hidden="true" />
      <div>
        <h3>{title}</h3>
        <p>{body}</p>
        {cta && href ? (
          <Link className="gx-btn gx-btn--primary gx-btn--sm" href={href}>
            {cta} <span aria-hidden="true">→</span>
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function OffersBoard() {
  const { address, openSignIn } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/offers', { cache: 'no-store' });
      const data = await response.json();
      if (Array.isArray(data?.offers)) setOffers(data.offers);
    } catch {
      // keep whatever is on screen
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, address]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(timer);
  }, [toast]);

  const openOffers = offers.filter((offer) => offer.status === 'open');
  const completed = offers.filter((offer) => offer.status === 'accepted');

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
      setToast({ text: 'Swap settled. Both cards and USDC moved together.' });
    } catch (caught) {
      setToast({
        text: caught instanceof Error ? caught.message : 'Could not settle the swap',
        error: true,
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Console>
      <StatusBar
        variant="product"
        active="/offers"
        label="Home"
        action={<SignInButton className="gx-btn gx-btn--primary gx-btn--xs" />}
      />
      <CommandLine
        title={
          <>
            Open <em>offers.</em>
          </>
        }
        lede={
          <>
            Every card below is locked in escrow right now, waiting for the holder of the card it
            asks for.
          </>
        }
      />

      <Work layout="two">
        <IndexPane>
          <p className="gx-eyebrow gx-eyebrow--index">
            <span className="gx-dot" aria-hidden="true" />
            Read live from the program
          </p>
          <div className="gx-ticks" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </IndexPane>

        <main className="gx-pane gx-pane--data" id="content">
          <section className="gx-band">
            <div className="gx-bandhead">
              <span className="gx-bandnum" aria-hidden="true" />
              <span className="gx-rule" aria-hidden="true" />
            </div>
            {openOffers.length ? (
              <div className="gx-offerlist">
                {openOffers.map((offer) => (
                  <OfferRow
                    key={offer.id}
                    offer={offer}
                    mode="open"
                    address={address}
                    busy={busyId === offer.id}
                    onAccept={accept}
                  />
                ))}
              </div>
            ) : (
              <EmptyBox
                title="No open offer yet."
                body="Pick any Collector Crypt card, lock one of yours for it and it shows up here for everyone."
                cta="Make the first offer"
                href="/app"
              />
            )}
          </section>

          <section className="gx-band">
            <div className="gx-bandhead">
              <span className="gx-bandnum" aria-hidden="true" />
              <span className="gx-rule" aria-hidden="true" />
              <h2 className="gx-h2">
                Open <em>to swap.</em>
              </h2>
              <p className="gx-copy">Cards their holders listed as available for offers.</p>
            </div>
            <EmptyBox
              title="Nothing listed yet."
              body="In the app, open My cards and mark a card as open to swap: collectors will see it here and send offers."
              cta="List a card"
              href="/app"
            />
          </section>

          <section className="gx-band">
            <div className="gx-bandhead">
              <span className="gx-bandnum" aria-hidden="true" />
              <span className="gx-rule" aria-hidden="true" />
              <h2 className="gx-h2">
                Completed <em>swaps.</em>
              </h2>
            </div>
            {completed.length ? (
              <div className="gx-offerlist">
                {completed.map((offer) => (
                  <OfferRow
                    key={offer.id}
                    offer={offer}
                    mode="completed"
                    address={address}
                    busy={false}
                  />
                ))}
              </div>
            ) : (
              <EmptyBox
                title="No swap yet."
                body="Every completed swap shows here with both cards and its Solana transaction."
              />
            )}
          </section>

          {toast ? (
            <div className={`gx-toast${toast.error ? ' gx-toast--error' : ''}`} role="status">
              <span className="gx-dot" aria-hidden="true" />
              {toast.text}
            </div>
          ) : null}
        </main>
      </Work>

      <StatusFoot />
    </Console>
  );
}
