export type UserRole = 'farmer' | 'buyer' | 'facility_operator' | 'transport_provider' | 'operations_admin';

export interface AuthContext {
  userId: string;
  role: UserRole;
}
