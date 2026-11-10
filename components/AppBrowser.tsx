'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CARDS, CARD_BY_MINT } from '@/lib/cards';
import { shortAddress } from '@/lib/format';
import type { Card, Offer } from '@/lib/types';
import { previewVault } from '@/lib/vault';
import { SignInButton, useAuth } from './auth';
import { CommandLine, Console, IndexPane, StatusBar, StatusFoot, Work } from './Console';
import { OfferModal } from './OfferModal';
import { OfferRow } from './OfferRow';

type Tab = 'browse' | 'my-cards' | 'received' | 'sent';

const TABS: { id: Tab; label: string }[] = [
  { id: 'browse', label: 'Browse' },
  { id: 'my-cards', label: 'My cards' },
  { id: 'received', label: 'Received' },
  { id: 'sent', label: 'Sent' },
];

function CardCell({
  card,
  index,
  onSelect,
}: {
  card: Card;
  index: number;
  onSelect: (card: Card) => void;
}) {
  return (
    <li className="gx-cardrow">
      <span className="gx-row-num" aria-hidden="true">
        {String(index + 1).padStart(2, '0')}
      </span>
      <button type="button" className="gx-cardrow-main" onClick={() => onSelect(card)}>
        <span className="gx-thumb">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={card.name} loading="lazy" src={card.image} />
        </span>
        <span className="gx-cardrow-copy">
          <span className="gx-cardrow-name">{card.name}</span>
          <span className="gx-cardrow-meta">
            <span>{card.grade}</span>
            <span>${card.insuredValue.toLocaleString('en-US')}</span>
          </span>
        </span>
      </button>
      <Link className="gx-cardrow-link" href={`/card/${card.mint}`}>
        Details &amp; offers
      </Link>
    </li>
  );
}

export function AppBrowser() {
  const { address, openSignIn } = useAuth();
  const [tab, setTab] = useState<Tab>('browse');
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Card | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);

  const vault = useMemo(() => (address ? previewVault(address) : []), [address]);
  const vaultMints = useMemo(() => new Set(vault.map((card) => card.mint)), [vault]);

  const loadOffers = useCallback(async () => {
    try {
      const response = await fetch('/api/offers', { cache: 'no-store' });
      const data = await response.json();
      if (Array.isArray(data?.offers)) setOffers(data.offers);
    } catch {
      // keep the last known list
    }
  }, []);

  useEffect(() => {
    loadOffers();
  }, [loadOffers, address]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const want = params.get('want');
    if (!want) return;
    const card = CARD_BY_MINT.get(want);
    if (card) setSelected(card);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(timer);
  }, [toast]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CARDS;
    return CARDS.filter((card) =>
      [card.name, card.grade, card.set ?? '', card.year, card.category]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [query]);

  const received = offers.filter(
    (offer) => offer.status === 'open' && vaultMints.has(offer.wantedMint)
  );
  const sent = offers.filter((offer) => offer.maker === address);

  const handleCreated = (offer: Offer) => {
    setOffers((current) => [offer, ...current]);
    setSelected(null);
    setToast({ text: 'Offer locked. It is live in the offer book.' });
  };

  const handleAccept = async (offer: Offer) => {
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
  };

  const handleCancel = async (offer: Offer) => {
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
      setToast({ text: 'Offer cancelled. The escrow goes back to your wallet.' });
    } catch (caught) {
      setToast({
        text: caught instanceof Error ? caught.message : 'Could not cancel the offer',
        error: true,
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Console>
      <StatusBar
        variant="product"
        active="/app"
        label="Home"
        action={<SignInButton className="gx-btn gx-btn--primary gx-btn--xs" />}
      />
      <CommandLine
        label={
          <>
            <span className="gx-dot" aria-hidden="true" />
            Collector Crypt · Solana
          </>
        }
        title={<>Swap cards.</>}
        lede={
          <>
            Find the card you want, offer one of yours, add or ask for USDC. One signature,
            settled on-chain.
          </>
        }
        actions={<SignInButton className="gx-btn gx-btn--primary gx-btn--sm" />}
      />

      <Work layout="two">
        <IndexPane>
          <div className="gx-views" role="tablist" aria-label="Swap views">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                className={`gx-view${tab === item.id ? ' gx-view--active' : ''}`}
                onClick={() => setTab(item.id)}
              >
                {item.label}
                {item.id === 'received' && address && received.length > 0
                  ? ` (${received.length})`
                  : ''}
                {item.id === 'sent' && address && sent.length > 0 ? ` (${sent.length})` : ''}
              </button>
            ))}
          </div>
        </IndexPane>

        <main className="gx-pane gx-pane--data" id="content">
          {tab === 'browse' ? (
            <section>
              <form
                className="gx-search"
                onSubmit={(event) => {
                  event.preventDefault();
                  setQuery(searchInput);
                }}
              >
                <input
                  className="gx-input"
                  aria-label="Search cards"
                  placeholder="Search Charizard, PSA 10, Base Set… or paste a card address"
                  value={searchInput}
                  onChange={(event) => {
                    setSearchInput(event.target.value);
                    setQuery(event.target.value);
                  }}
                />
                <button className="gx-btn gx-btn--ghost gx-btn--sm" type="submit">
                  Search
                </button>
              </form>
              <p className="gx-hint">Pick the card you want, then offer one of yours for it.</p>
              <ul className="gx-catalog">
                {filtered.map((card, index) => (
                  <CardCell key={card.mint} card={card} index={index} onSelect={setSelected} />
                ))}
              </ul>
              {!filtered.length ? (
                <div className="gx-empty">
                  <span className="gx-empty-art" aria-hidden="true" />
                  <div>
                    <h3>No cards match that search.</h3>
                    <p>Try a card name, a grade such as PSA 10, a set, or clear the search.</p>
                    <button
                      className="gx-btn gx-btn--ghost gx-btn--sm"
                      type="button"
                      onClick={() => {
                        setSearchInput('');
                        setQuery('');
                      }}
                    >
                      Clear search
                    </button>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {tab === 'my-cards' ? (
            <section>
              {!address ? (
                <div className="gx-empty">
                  <span className="gx-empty-art" aria-hidden="true" />
                  <div>
                    <h3>Sign in to load your cards.</h3>
                    <p>
                      Your Collector Crypt cards are read from the wallet you sign with. No
                      account, no email.
                    </p>
                    <button
                      className="gx-btn gx-btn--primary gx-btn--sm"
                      type="button"
                      onClick={openSignIn}
                    >
                      Sign in with a wallet
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="gx-tabnote">
                    {shortAddress(address)} · {vault.length} cards in your wallet · ready to offer
                  </p>
                  <ul className="gx-catalog">
                    {vault.map((card, index) => (
                      <CardCell key={card.mint} card={card} index={index} onSelect={setSelected} />
                    ))}
                  </ul>
                </>
              )}
            </section>
          ) : null}

          {tab === 'received' ? (
            <section>
              {!address ? (
                <div className="gx-empty">
                  <span className="gx-empty-art" aria-hidden="true" />
                  <div>
                    <h3>Sign in to see offers for your cards.</h3>
                    <p>Offers addressed to any card in your wallet land here.</p>
                    <button
                      className="gx-btn gx-btn--primary gx-btn--sm"
                      type="button"
                      onClick={openSignIn}
                    >
                      Sign in
                    </button>
                  </div>
                </div>
              ) : received.length ? (
                <div className="gx-offerlist">
                  {received.map((offer) => (
                    <OfferRow
                      key={offer.id}
                      offer={offer}
                      mode="received"
                      address={address}
                      busy={busyId === offer.id}
                      onAccept={handleAccept}
                    />
                  ))}
                </div>
              ) : (
                <div className="gx-empty">
                  <span className="gx-empty-art" aria-hidden="true" />
                  <div>
                    <h3>No offers for your cards yet.</h3>
                    <p>
                      When a collector wants one of your cards they will lock their card and USDC
                      in escrow. You will see the offer here.
                    </p>
                    <Link className="gx-btn gx-btn--ghost gx-btn--sm" href="/offers">
                      Browse open offers
                    </Link>
                  </div>
                </div>
              )}
            </section>
          ) : null}

          {tab === 'sent' ? (
            <section>
              {!address ? (
                <div className="gx-empty">
                  <span className="gx-empty-art" aria-hidden="true" />
                  <div>
                    <h3>Sign in to see the offers you sent.</h3>
                    <p>
                      Everything you lock in escrow stays visible here until it settles or is
                      cancelled.
                    </p>
                    <button
                      className="gx-btn gx-btn--primary gx-btn--sm"
                      type="button"
                      onClick={openSignIn}
                    >
                      Sign in
                    </button>
                  </div>
                </div>
              ) : sent.length ? (
                <div className="gx-offerlist">
                  {sent.map((offer) => (
                    <OfferRow
                      key={offer.id}
                      offer={offer}
                      mode="sent"
                      address={address}
                      busy={busyId === offer.id}
                      onCancel={handleCancel}
                    />
                  ))}
                </div>
              ) : (
                <div className="gx-empty">
                  <span className="gx-empty-art" aria-hidden="true" />
                  <div>
                    <h3>You have not sent an offer yet.</h3>
                    <p>Pick a card in Browse, choose one of yours and lock the offer.</p>
                    <button
                      className="gx-btn gx-btn--ghost gx-btn--sm"
                      type="button"
                      onClick={() => setTab('browse')}
                    >
                      Browse cards
                    </button>
                  </div>
                </div>
              )}
            </section>
          ) : null}

          <OfferModal card={selected} onClose={() => setSelected(null)} onCreated={handleCreated} />

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
