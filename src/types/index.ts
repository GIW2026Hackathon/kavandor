export type UserRole = 'farmer' | 'buyer' | 'facility_operator' | 'transport_provider' | 'operations_admin';

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INVALID_TRANSITION'
  | 'CAPACITY_EXCEEDED'
  | 'AI_UNAVAILABLE';

export type HarvestUnit = 'kg' | 'crate' | 'bucket' | 'box';
export type HarvestStatus = 'draft' | 'submitted' | 'assessed' | 'listed' | 'sold' | 'cancelled';
export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'expired';
export type ReservationStatus = 'pending' | 'confirmed' | 'released' | 'completed';
export type TransportStatus = 'scheduled' | 'in_transit' | 'delivered' | 'cancelled';
export type RecommendationType = 'immediate_sale' | 'storage' | 'drying' | 'aggregation';

export interface HarvestInput {
  crop: string;
  quantity: number;
  unit: HarvestUnit;
  harvestDate: string;
  location: string;
  handlingNotes?: string;
  photoUrl?: string;
}

export interface AssessmentObservation {
  label: string;
  detail: string;
  severity: 'low' | 'medium' | 'high';
}

export interface Recommendation {
  type: RecommendationType;
  label: string;
  description: string;
  estimatedNet: number;
  assumptions: string[];
  feasible: boolean;
}

export interface HarvestAssessment {
  crop: string;
  confidence: number;
  observations: AssessmentObservation[];
  defects: string[];
  limitations: string[];
  recommendations: Recommendation[];
  provider: string;
  createdAt: string;
}

export interface ApiErrorResponse {
  error: {
    code: ApiErrorCode;
    message: string;
  };
}
