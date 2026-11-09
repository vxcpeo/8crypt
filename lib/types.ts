export type Card = {
  mint: string;
  name: string;
  image: string;
  grade: string;
  grader: string | null;
  set: string | null;
  year: string;
  category: string;
  insuredValue: number;
  owner: string;
  listed: boolean;
  index: number;
};

export type OfferStatus = 'open' | 'accepted' | 'cancelled';

export type Offer = {
  id: string;
  maker: string;
  wantedMint: string;
  offeredMint: string;
  usdcAdded: number;
  usdcRequested: number;
  fee: number;
  createdAt: string;
  expiresAt: string | null;
  status: OfferStatus;
  acceptedBy?: string;
  settledAt?: string;
  txSignature?: string;
};

export type SessionInfo = {
  address: string;
  issuedAt: number;
  expiresAt: number;
};
