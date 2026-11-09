import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Offer } from './types';

const DATA_DIR = path.join(process.cwd(), '.data');
const OFFERS_FILE = path.join(DATA_DIR, 'offers.json');

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(OFFERS_FILE);
  } catch {
    await fs.writeFile(OFFERS_FILE, '[]', 'utf8');
  }
}

export async function readOffers(): Promise<Offer[]> {
  await ensureStore();
  try {
    const raw = await fs.readFile(OFFERS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Offer[];
  } catch {
    return [];
  }
}

export async function writeOffers(offers: Offer[]): Promise<void> {
  await ensureStore();
  const tmp = `${OFFERS_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(offers, null, 2), 'utf8');
  await fs.rename(tmp, OFFERS_FILE);
}

export async function addOffer(offer: Offer): Promise<Offer> {
  const offers = await readOffers();
  offers.unshift(offer);
  await writeOffers(offers);
  return offer;
}

export async function updateOffer(
  id: string,
  update: (offer: Offer) => Offer
): Promise<Offer | null> {
  const offers = await readOffers();
  const index = offers.findIndex((offer) => offer.id === id);
  if (index === -1) return null;
  const next = update(offers[index]);
  offers[index] = next;
  await writeOffers(offers);
  return next;
}

export function isExpired(offer: Offer): boolean {
  return Boolean(offer.expiresAt && new Date(offer.expiresAt).getTime() < Date.now());
}

export function publicOffer(offer: Offer): Offer {
  return { ...offer };
}
