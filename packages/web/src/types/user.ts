/**
 * Defines the possible access levels for users in the application
 * @readonly
 */
export type UserType = "guest" | "free" | "premium";

/**
 * Defines the structure of a user document in Firestore
 */
export interface User {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: UserType;
  joinDate: string;
}

/**
 * Defines the structure of a deal in the deals collection
 */
export interface Deal {
  counsels: string[];
  sector: string;
  method: string;
  issuer: string;
  lead_managers: string[];
  co_managers: string[];
  date: string;
  series_name_obligor: string;
  state: string;
  total_par: number;
  underwriter_fee?: {
    total: number | null;
    scrape_success: boolean;
  };
}

/**
 * Defines the structure of aggregated data for the rank table
 */
export interface RankTableRow {
  rank: number;
  leadLeftManager: string;
  aggregatePar: number;
  avgUnderwriterFeeAmount: number | null;
  avgUnderwriterFeePercentage: number | null;
  deals: Deal[];
  visibilityInfo?: {
    avgUnderwriterFeeAmount?: "need_free" | "need_premium";
    avgUnderwriterFeePercentage?: "need_free" | "need_premium";
    fullDealList?: "need_premium";
  };
} 