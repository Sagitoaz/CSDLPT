import express from "express";
import { asyncHandler, registerErrorHandler } from "../common/http";
import { applySecurity } from "../infrastructure/http/security";
import { createCampaignRoutes } from "../modules/campaigns/campaign.routes";
import { createCampaignService, CampaignService } from "../modules/campaigns/campaign.service";
import { createDonationRoutes } from "../modules/donations/donation.routes";
import { createDonationService, DonationService } from "../modules/donations/donation.service";
import { createStatsRoutes } from "../modules/stats/stats.routes";
import { createStatsService, StatsService } from "../modules/stats/stats.service";
import { createDonorRoutes } from "../modules/donors/donor.routes";
import { createBeneficiaryRoutes } from "../modules/beneficiaries/beneficiary.routes";
import { createDisbursementRoutes } from "../modules/disbursements/disbursement.routes";
import { createVolunteerRoutes } from "../modules/volunteers/volunteer.routes";
import { createActivityLogRoutes } from "../modules/activity-logs/activity-log.routes";
import { createBranchRoutes } from "../modules/branches/branch.routes";
import authRoutes from "../modules/auth";
import healthRoutes from "../modules/health/health.routes";
import { auditLogMiddleware } from "../modules/audit/audit-logger";

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
  app.use(auditLogMiddleware);

  // Health check routes (public)
  app.use("/health", healthRoutes);

  app.get(
    "/health",
    asyncHandler(async (_req, res) => {
      res.json({ ok: true, service: "charity-backend" });
    })
  );

  // Authentication routes (public)
  app.use("/api/auth", authRoutes);

  // Business logic routes
  app.use("/api/donations", createDonationRoutes(donationService));
  app.use("/api/campaigns", createCampaignRoutes(campaignService));
  app.use("/api/stats", createStatsRoutes(statsService));
  app.use("/api/donors", createDonorRoutes());
  app.use("/api/beneficiaries", createBeneficiaryRoutes());
  app.use("/api/disbursements", createDisbursementRoutes());
  app.use("/api/volunteers", createVolunteerRoutes());
  app.use("/api/activity-logs", createActivityLogRoutes());
  app.use("/api/branches", createBranchRoutes());

  registerErrorHandler(app);
  return app;
}
