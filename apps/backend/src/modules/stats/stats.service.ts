import { CampaignService, createCampaignService } from "../campaigns/campaign.service";
import {
  createDonationService,
  DonationOverviewStats,
  DonationService
} from "../donations/donation.service";

export interface OverviewStats {
  donations: DonationOverviewStats;
  campaigns: {
    total: number;
    active: number;
    inactive: number;
  };
  generatedAt: string;
}

export interface CampaignStats {
  campaign: Record<string, unknown>;
  donations: DonationOverviewStats;
  generatedAt: string;
}

export interface StatsService {
  getOverview(): Promise<OverviewStats>;
  getCampaignStats(code: string): Promise<CampaignStats | null>;
}

export function createStatsService(deps?: {
  donationService?: DonationService;
  campaignService?: CampaignService;
}): StatsService {
  const donationService = deps?.donationService ?? createDonationService();
  const campaignService = deps?.campaignService ?? createCampaignService();

  return {
    async getOverview() {
      const [donations, campaigns] = await Promise.all([
        donationService.aggregateOverview(),
        campaignService.getSummary()
      ]);

      return {
        donations,
        campaigns,
        generatedAt: new Date().toISOString()
      };
    },

    async getCampaignStats(code) {
      const campaign = await campaignService.getByCode(code);
      if (!campaign) {
        return null;
      }

      const donations = await donationService.aggregateOverview({ campaignCode: code });

      return {
        campaign,
        donations,
        generatedAt: new Date().toISOString()
      };
    }
  };
}
