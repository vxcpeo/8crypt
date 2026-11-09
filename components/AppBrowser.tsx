'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CARDS, CARD_BY_MINT } from '@/lib/cards';
import { shortAddress } from '@/lib/format';
import type { Card, Offer } from '@/lib/types';
import { previewVault } from '@/lib/vault';
import { SignInButton, useAuth } from './auth';
import { OfferModal } from './OfferModal';
import { OfferRow } from './OfferRow';
import { BrandBar, IndexNav, SplitLayout } from './Tidal';

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
    <div className="tx-card">
      <button type="button" className="tx-card-main" onClick={() => onSelect(card)}>
        <span className="tx-card-index" aria-hidden="true">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="tx-card-thumb">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={card.name} loading="lazy" src={card.image} />
        </span>
        <span className="tx-card-copy">
          <span className="tx-card-name">{card.name}</span>
          <span className="tx-card-meta">
            <span>{card.grade}</span>
            <span>${card.insuredValue.toLocaleString('en-US')}</span>
          </span>
        </span>
      </button>
      <Link className="tx-card-link" href={`/card/${card.mint}`}>
        Details &amp; offers
      </Link>
    </div>
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
    <SplitLayout
      variant="product"
      narrative={
        <>
          <BrandBar label="Home">
            <SignInButton className="tx-btn tx-btn--solid tx-btn--sm" />
          </BrandBar>
          <IndexNav variant="product" active="/app" />
          <div className="tx-thesis">
            <p className="tx-eyebrow">Collector Crypt · Solana</p>
            <h1 className="tx-display tx-display--doc">Swap cards.</h1>
            <p className="tx-lede">
              Find the card you want, offer one of yours, add or ask for USDC. One signature,
              settled on-chain.
            </p>
            <SignInButton className="tx-btn tx-btn--solid tx-btn--sm" />
          </div>
          <div className="tx-tabs" role="tablist" aria-label="Swap views">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                className={`tx-tab${tab === item.id ? ' tx-tab--active' : ''}`}
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
        </>
      }
    >
      {tab === 'browse' ? (
        <section className="tx-band tx-band--first">
          <form
            className="tx-search"
            onSubmit={(event) => {
              event.preventDefault();
              setQuery(searchInput);
            }}
          >
            <input
              className="tx-input"
              aria-label="Search cards"
              placeholder="Search Charizard, PSA 10, Base Set… or paste a card address"
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
                setQuery(event.target.value);
              }}
            />
            <button className="tx-btn tx-btn--ghost tx-btn--sm" type="submit">
              Search
            </button>
          </form>
          <p className="tx-hint">Pick the card you want, then offer one of yours for it.</p>
          <div className="tx-catalog">
            {filtered.map((card, index) => (
              <CardCell key={card.mint} card={card} index={index} onSelect={setSelected} />
            ))}
          </div>
          {!filtered.length ? (
            <div className="tx-empty">
              <h3>No cards match that search.</h3>
              <p>Try a card name, a grade such as PSA 10, a set, or clear the search.</p>
              <button
                className="tx-btn tx-btn--ghost tx-btn--sm"
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setQuery('');
                }}
              >
                Clear search
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === 'my-cards' ? (
        <section className="tx-band tx-band--first">
          {!address ? (
            <div className="tx-empty">
              <h3>Sign in to load your cards.</h3>
              <p>
                Your Collector Crypt cards are read from the wallet you sign with. No account, no
                email.
              </p>
              <button className="tx-btn tx-btn--solid tx-btn--sm" type="button" onClick={openSignIn}>
                Sign in with a wallet
              </button>
            </div>
          ) : (
            <>
              <p className="tx-tab-note">
                {shortAddress(address)} · {vault.length} cards in your wallet · ready to offer
              </p>
              <div className="tx-catalog">
                {vault.map((card, index) => (
                  <CardCell key={card.mint} card={card} index={index} onSelect={setSelected} />
                ))}
              </div>
            </>
          )}
        </section>
      ) : null}

      {tab === 'received' ? (
        <section className="tx-band tx-band--first">
          {!address ? (
            <div className="tx-empty">
              <h3>Sign in to see offers for your cards.</h3>
              <p>Offers addressed to any card in your wallet land here.</p>
              <button className="tx-btn tx-btn--solid tx-btn--sm" type="button" onClick={openSignIn}>
                Sign in
              </button>
            </div>
          ) : received.length ? (
            <div className="tx-offer-list">
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
            <div className="tx-empty">
              <h3>No offers for your cards yet.</h3>
              <p>
                When a collector wants one of your cards they will lock their card and USDC in
                escrow. You will see the offer here.
              </p>
              <Link className="tx-btn tx-btn--ghost tx-btn--sm" href="/offers">
                Browse open offers
              </Link>
            </div>
          )}
        </section>
      ) : null}

      {tab === 'sent' ? (
        <section className="tx-band tx-band--first">
          {!address ? (
            <div className="tx-empty">
              <h3>Sign in to see the offers you sent.</h3>
              <p>Everything you lock in escrow stays visible here until it settles or is cancelled.</p>
              <button className="tx-btn tx-btn--solid tx-btn--sm" type="button" onClick={openSignIn}>
                Sign in
              </button>
            </div>
          ) : sent.length ? (
            <div className="tx-offer-list">
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
            <div className="tx-empty">
              <h3>You have not sent an offer yet.</h3>
              <p>Pick a card in Browse, choose one of yours and lock the offer.</p>
              <button
                className="tx-btn tx-btn--ghost tx-btn--sm"
                type="button"
                onClick={() => setTab('browse')}
              >
                Browse cards
              </button>
            </div>
          )}
        </section>
      ) : null}

      <OfferModal card={selected} onClose={() => setSelected(null)} onCreated={handleCreated} />

      {toast ? (
        <div className={`tx-toast${toast.error ? ' tx-toast--error' : ''}`} role="status">
          <span className="tx-dot" />
          {toast.text}
        </div>
      ) : null}
    </SplitLayout>
  );
}
