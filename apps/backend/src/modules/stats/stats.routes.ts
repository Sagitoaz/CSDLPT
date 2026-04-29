import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../common/http";
import { buildAuthContext } from "../../common/validators/auth-scope";
import { requireAuth } from "../auth/auth.middleware";
import { createStatsService, StatsService } from "./stats.service";

const campaignCodeParamsSchema = z.object({
  code: z.string().trim().min(2).max(50)
});

export function createStatsRoutes(service: StatsService = createStatsService()): Router {
  const router = Router();
  router.use(requireAuth);

  router.get(
    "/overview",
    asyncHandler(async (req, res) => {
      const stats = await service.getOverview(buildAuthContext(req));
      return res.json(stats);
    })
  );

  router.get(
    "/campaigns/:code",
    asyncHandler(async (req, res) => {
      const parsedParams = campaignCodeParamsSchema.safeParse(req.params);
      if (!parsedParams.success) {
        return res.status(400).json({ error: parsedParams.error.flatten() });
      }

      const stats = await service.getCampaignStats(parsedParams.data.code, buildAuthContext(req));
      if (!stats) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      return res.json(stats);
    })
  );

  return router;
}

export default createStatsRoutes;
