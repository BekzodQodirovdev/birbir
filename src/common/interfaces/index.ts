export interface JwtPayload {
  sub: string;
  role: string;
}

export class TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface IUserShare {
  id: string;
  total_shares: number;
  total_comments: number;
  total_reports: number;
}

export interface IEngagementEvent {
  type: string;
  timestamp: Date;
  data: any;
}

export interface IPromotionHistoryRecord {
  type: string | null;
  start_date: Date | null;
  end_date: Date | null;
  price: number | null;
  duration_days: number | null;
  cancelled_at: Date;
}

export interface IPromotionHistoryRecordGet {
  product_id: string;
  product_name: string;
  type: string | null;
  start_date: Date | null;
  end_date: Date | null;
  price: number | null;
  duration_days: number | null;
  status: 'active' | 'cancelled' | 'expired';
  cancelled_at?: Date;
}
