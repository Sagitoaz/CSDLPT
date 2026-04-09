import express from "express";
import { asyncHandler, registerErrorHandler } from "../common/http";
import { applySecurity } from "../infrastructure/http/security";
import { createCampaignRoutes } from "../modules/campaigns/campaign.routes";
import { createCampaignService, CampaignService } from "../modules/campaigns/campaign.service";
import { createDonationRoutes } from "../modules/donations/donation.routes";
import { createDonationService, DonationService } from "../modules/donations/donation.service";
import { createStatsRoutes } from "../modules/stats/stats.routes";
import { createStatsService, StatsService } from "../modules/stats/stats.service";

export interface AppServices {
  donationService?: DonationService;
  campaignService?: CampaignService;
  statsService?: StatsService;
}

export function createApp(services: AppServices = {}): express.Express {
  const donationService = services.donationService ?? createDonationService();
  const campaignService = services.campaignService ?? createCampaignService();
  const statsService =
    services.statsService ?? createStatsService({ donationService, campaignService });

  const app = express();
  applySecurity(app);

  app.get(
    "/health",
    asyncHandler(async (_req, res) => {
      res.json({ ok: true, service: "charity-backend" });
    })
  );

  app.use("/api/donations", createDonationRoutes(donationService));
  app.use("/api/campaigns", createCampaignRoutes(campaignService));
  app.use("/api/stats", createStatsRoutes(statsService));

  registerErrorHandler(app);
  return app;
}
