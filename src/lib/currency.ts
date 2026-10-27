export function formatCurrency(amount: number): string {
  return `KSh ${amount.toLocaleString('en-KE')}`;
}
