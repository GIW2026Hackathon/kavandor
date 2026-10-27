export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'expired';

export interface WholesaleOffer {
  id: string;
  buyer: string;
  amount: number;
  quantity: number;
  unit: string;
  unitPrice: number;
  transportCost: number;
  handlingFees: number;
  expiresAt: string;
}

export const activeWholesaleOffer: WholesaleOffer = {
  id: 'offer-freshlink-001',
  buyer: 'FreshLink Kisii',
  amount: 4000,
  quantity: 220,
  unit: 'kg',
  unitPrice: 18.18,
  transportCost: 300,
  handlingFees: 200,
  expiresAt: '27 Oct 2026, 16:00',
};
