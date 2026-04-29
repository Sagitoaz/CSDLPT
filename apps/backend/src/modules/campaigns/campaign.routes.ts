import { Router } from "express";
import { asyncHandler } from "../../common/http";
import { buildAuthContext } from "../../common/validators/auth-scope";
import { requireAuth } from "../auth/auth.middleware";
import {
  campaignCodeParamsSchema,
  createCampaignSchema,
  listCampaignQuerySchema,
  updateCampaignSchema
} from "./campaign.schemas";
import { CampaignService, createCampaignService } from "./campaign.service";

export function createCampaignRoutes(service: CampaignService = createCampaignService()): Router {
  const router = Router();
  router.use(requireAuth);

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const parsed = listCampaignQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }

      const result = await service.list(parsed.data, buildAuthContext(req));
      return res.json(result);
    })
  );

  router.get(
    "/:code",
    asyncHandler(async (req, res) => {
      const parsedParams = campaignCodeParamsSchema.safeParse(req.params);
      if (!parsedParams.success) {
        return res.status(400).json({ error: parsedParams.error.flatten() });
      }

      const campaign = await service.getByCode(parsedParams.data.code, buildAuthContext(req));
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      return res.json(campaign);
    })
  );

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const parsed = createCampaignSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }

      const created = await service.create(parsed.data, buildAuthContext(req));
      return res.status(201).json(created);
    })
  );

  router.put(
    "/:code",
    asyncHandler(async (req, res) => {
      const parsedParams = campaignCodeParamsSchema.safeParse(req.params);
      if (!parsedParams.success) {
        return res.status(400).json({ error: parsedParams.error.flatten() });
      }

      const parsedBody = updateCampaignSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({ error: parsedBody.error.flatten() });
      }

      const updated = await service.updateByCode(
        parsedParams.data.code,
        parsedBody.data,
        buildAuthContext(req)
      );
      if (!updated) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      return res.json(updated);
    })
  );

  router.delete(
    "/:code",
    asyncHandler(async (req, res) => {
      const parsedParams = campaignCodeParamsSchema.safeParse(req.params);
      if (!parsedParams.success) {
        return res.status(400).json({ error: parsedParams.error.flatten() });
      }

      const removed = await service.removeByCode(parsedParams.data.code, buildAuthContext(req));
      if (!removed) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      return res.status(204).send();
    })
  );

  return router;
}

export default createCampaignRoutes;
