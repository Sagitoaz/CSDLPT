import { DonationStatus, OverviewStats, Donation } from "../types";

export function getStatusTotals(overview: OverviewStats): Record<DonationStatus, number> {
  const map: Record<DonationStatus, number> = {
    pending: 0,
    verified: 0,
    rejected: 0
  };

  for (const row of overview.donations.byStatus) {
    map[row.status] = row.count;
  }

  return map;
}

export function getCampaignRaised(donations: Donation[]): Record<string, number> {
  const raised: Record<string, number> = {};
  for (const donation of donations) {
    raised[donation.campaignCode] = (raised[donation.campaignCode] || 0) + donation.amount;
  }
  return raised;
}
