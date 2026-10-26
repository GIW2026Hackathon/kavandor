export type DemoOfferStatus = 'pending' | 'accepted';

export const demoTomatoOffer = {
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

export function formatCurrency(amount: number) {
  return `KSh ${amount.toLocaleString('en-KE')}`;
}
