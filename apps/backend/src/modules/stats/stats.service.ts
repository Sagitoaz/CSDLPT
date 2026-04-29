import { CampaignService, createCampaignService } from "../campaigns/campaign.service";
import {
  createDonationService,
  DonationOverviewStats,
  DonationService
} from "../donations/donation.service";
import { AuthContext } from "../../common/validators/auth-scope";

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
  getOverview(auth: AuthContext): Promise<OverviewStats>;
  getCampaignStats(code: string, auth: AuthContext): Promise<CampaignStats | null>;
}

export function createStatsService(deps?: {
  donationService?: DonationService;
  campaignService?: CampaignService;
}): StatsService {
  const donationService = deps?.donationService ?? createDonationService();
  const campaignService = deps?.campaignService ?? createCampaignService();

  return {
    async getOverview(auth) {
      const [donations, campaigns] = await Promise.all([
        donationService.aggregateOverview({}, auth),
        campaignService.getSummary(auth)
      ]);

      return {
        donations,
        campaigns,
        generatedAt: new Date().toISOString()
      };
    },

    async getCampaignStats(code, auth) {
      const campaign = await campaignService.getByCode(code, auth);
      if (!campaign) {
        return null;
      }

      const donations = await donationService.aggregateOverview(
        { "campaignSnapshot.code": code },
        auth
      );

      return {
        campaign,
        donations,
        generatedAt: new Date().toISOString()
      };
    }
  };
}
