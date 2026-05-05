export type DonationStatus = "pending" | "verified" | "rejected";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface Campaign {
  _id: string;
  code: string;
  name: string;
  description?: string;
  targetAmount: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Donation {
  _id: string;
  donorName: string;
  donorEmail: string;
  amount: number;
  campaignCode: string;
  note?: string;
  status: DonationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DonationStatusStats {
  status: DonationStatus;
  count: number;
  totalAmount: number;
}

export interface OverviewStats {
  donations: {
    totalDonations: number;
    totalAmount: number;
    byStatus: DonationStatusStats[];
  };
  campaigns: {
    total: number;
    active: number;
    inactive: number;
  };
  generatedAt: string;
}
