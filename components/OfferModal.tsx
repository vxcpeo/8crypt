'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from './auth';
import { CARD_BY_MINT } from '@/lib/cards';
import { formatUsd } from '@/lib/format';
import type { Card, Offer } from '@/lib/types';
import { previewVault } from '@/lib/vault';

const EXPIRY_OPTIONS = [
  { label: 'No expiry', value: '0' },
  { label: '1 day', value: '1' },
  { label: '7 days', value: '7' },
  { label: '30 days', value: '30' },
];

export function OfferModal({
  card,
  onClose,
  onCreated,
}: {
  card: Card | null;
  onClose: () => void;
  onCreated: (offer: Offer) => void;
}) {
  const { address, openSignIn } = useAuth();
  const vault = useMemo(() => (address ? previewVault(address) : []), [address]);
  const [offeredMint, setOfferedMint] = useState('');
  const [direction, setDirection] = useState<'even' | 'add' | 'request'>('even');
  const [amount, setAmount] = useState('');
  const [expiry, setExpiry] = useState('0');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!card) return;
    setExpiry('0');
    setError('');
    if (vault.length > 0) {
      const first = vault[0];
      setOfferedMint(first.mint);
      const diff = card.insuredValue - first.insuredValue;
      if (diff > 0) {
        setDirection('add');
        setAmount(String(Math.round(diff)));
      } else if (diff < 0) {
        setDirection('request');
        setAmount(String(Math.round(Math.abs(diff))));
      } else {
        setDirection('even');
        setAmount('');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card, address]);

  useEffect(() => {
    if (!card) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [card, busy, onClose]);

  if (!card) return null;

  const offered = offeredMint ? CARD_BY_MINT.get(offeredMint) : undefined;
  const usdcAdded = direction === 'add' ? Number(amount) || 0 : 0;
  const usdcRequested = direction === 'request' ? Number(amount) || 0 : 0;
  const valueIn = (offered?.insuredValue ?? 0) + usdcAdded;
  const valueOut = card.insuredValue + usdcRequested;
  const delta = valueIn - valueOut;

  function pickCard(next: Card) {
    setOfferedMint(next.mint);
    const diff = card!.insuredValue - next.insuredValue;
    if (diff > 0) {
      setDirection('add');
      setAmount(String(Math.round(diff)));
    } else if (diff < 0) {
      setDirection('request');
      setAmount(String(Math.round(Math.abs(diff))));
    } else {
      setDirection('even');
      setAmount('');
    }
  }

  async function submit() {
    if (!address) {
      openSignIn();
      return;
    }
    if (!offeredMint) {
      setError('Pick one of your cards to give');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wantedMint: card!.mint,
          offeredMint,
          usdcAdded,
          usdcRequested,
          expiresInDays: Number(expiry) || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Could not lock the offer');
      onCreated(data.offer as Offer);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not lock the offer');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="tx-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div
        className="tx-modal tx-modal--offer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="offer-title"
      >
        <button
          className="tx-modal-close"
          onClick={onClose}
          aria-label="Close offer"
          type="button"
          disabled={busy}
        >
          ×
        </button>

        <div className="tx-offer-head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={card.image} alt={card.name} />
          <div>
            <p className="tx-eyebrow">Offer for this card</p>
            <h2 id="offer-title">{card.name}</h2>
            <p>
              {card.grade} · {formatUsd(card.insuredValue)} insured value
            </p>
          </div>
        </div>

        <div className="tx-modal-body">
          {address ? (
            <>
              <div>
                <div className="tx-field-label">
                  <span>Card you give</span>
                  <small>from your wallet · escrowed</small>
                </div>
                {vault.length ? (
                  <div className="tx-vault">
                    {vault.map((vaultCard) => (
                      <button
                        key={vaultCard.mint}
                        type="button"
                        className={`tx-vault-pick${vaultCard.mint === offeredMint ? ' tx-vault-pick--selected' : ''}`}
                        onClick={() => pickCard(vaultCard)}
                        title={vaultCard.name}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={vaultCard.image} alt="" />
                        <span>{vaultCard.grade.replace('PSA ', '').replace('CGC ', '')}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="tx-fine">
                    No Collector Crypt cards found in this wallet. This preview build assigns a
                    deterministic vault to every wallet on sign-in.
                  </p>
                )}
              </div>

              <div>
                <div className="tx-field-label">
                  <span>USDC to balance</span>
                  <small>only moves if both sides accept</small>
                </div>
                <div className="tx-seg">
                  <button
                    type="button"
                    className={direction === 'even' ? 'tx-seg-btn tx-seg-btn--active' : 'tx-seg-btn'}
                    onClick={() => {
                      setDirection('even');
                      setAmount('');
                    }}
                  >
                    Even swap
                  </button>
                  <button
                    type="button"
                    className={direction === 'add' ? 'tx-seg-btn tx-seg-btn--active' : 'tx-seg-btn'}
                    onClick={() => {
                      setDirection('add');
                      if (!amount) setAmount('1');
                    }}
                  >
                    I add USDC
                  </button>
                  <button
                    type="button"
                    className={
                      direction === 'request' ? 'tx-seg-btn tx-seg-btn--active' : 'tx-seg-btn'
                    }
                    onClick={() => {
                      setDirection('request');
                      if (!amount) setAmount('1');
                    }}
                  >
                    I ask for USDC
                  </button>
                </div>
                {direction !== 'even' ? (
                  <div className="tx-amount">
                    <input
                      inputMode="decimal"
                      placeholder="0"
                      value={amount}
                      onChange={(event) => {
                        const next = event.target.value;
                        if (/^\d*\.?\d{0,2}$/.test(next)) setAmount(next);
                      }}
                      aria-label="USDC amount"
                    />
                    <span className="tx-mono">USDC</span>
                  </div>
                ) : null}
              </div>

              <div>
                <div className="tx-field-label">
                  <span>Expiry</span>
                  <small>after this anyone can return the escrow</small>
                </div>
                <select
                  className="tx-select"
                  value={expiry}
                  onChange={(event) => setExpiry(event.target.value)}
                >
                  {EXPIRY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="tx-summary">
                <div>
                  <small>You give</small>
                  <b>
                    {offered?.grade ?? 'Card'} {usdcAdded ? `+ ${usdcAdded} USDC` : ''}
                  </b>
                </div>
                <span className="tx-offer-swap">⇄</span>
                <div>
                  <small>You receive</small>
                  <b>
                    {card.grade} {usdcRequested ? `+ ${usdcRequested} USDC` : ''}
                  </b>
                </div>
              </div>

              <p className="tx-fine">
                Card value: you give <b>{formatUsd(offered?.insuredValue ?? 0)}</b>, you receive{' '}
                <b>{formatUsd(card.insuredValue)}</b>.{' '}
                {usdcAdded || usdcRequested
                  ? usdcAdded
                    ? `You add ${usdcAdded} USDC, so the two sides balance at ${formatUsd(valueIn)}.`
                    : `You ask for ${usdcRequested} USDC, so the two sides balance at ${formatUsd(valueOut)}.`
                  : delta === 0
                    ? 'The card values are even.'
                    : delta > 0
                      ? `You are ${formatUsd(delta)} over by card value.`
                      : `You are ${formatUsd(Math.abs(delta))} under by card value.`}{' '}
                A <b>1 USDC fee</b> per side is held with the offer and only charged on completion.
              </p>

              {error ? (
                <div className="tx-error" role="alert">
                  {error}
                </div>
              ) : null}

              <div className="tx-modal-actions">
                <button type="button" className="tx-btn tx-btn--ghost tx-btn--sm" onClick={onClose} disabled={busy}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="tx-btn tx-btn--solid tx-btn--sm"
                  onClick={submit}
                  disabled={busy || !vault.length}
                >
                  {busy ? 'Locking offer…' : 'Lock offer'}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="tx-fine">
                Sign in with the Solana wallet that holds your card. The wallet signs a message to
                authenticate; the offer itself is escrowed by the swap program.
              </p>
              <div className="tx-modal-actions">
                <button type="button" className="tx-btn tx-btn--ghost tx-btn--sm" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="tx-btn tx-btn--solid tx-btn--sm"
                  onClick={openSignIn}
                >
                  Sign in to continue
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
