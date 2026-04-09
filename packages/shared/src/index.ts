export type DonationStatus = "pending" | "verified" | "rejected";

export interface DonationDto {
  donorName: string;
  donorEmail: string;
  amount: number;
  campaignCode: string;
  note?: string;
  status: DonationStatus;
}
