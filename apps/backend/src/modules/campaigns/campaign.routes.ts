import { Router } from "express";
import { asyncHandler } from "../../common/http";
import {
  campaignCodeParamsSchema,
  createCampaignSchema,
  listCampaignQuerySchema,
  updateCampaignSchema
} from "./campaign.schemas";
import { CampaignService, createCampaignService } from "./campaign.service";

export function createCampaignRoutes(service: CampaignService = createCampaignService()): Router {
  const router = Router();

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const parsed = listCampaignQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }

      const result = await service.list(parsed.data);
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

      const campaign = await service.getByCode(parsedParams.data.code);
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

      const created = await service.create(parsed.data);
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

      const updated = await service.updateByCode(parsedParams.data.code, parsedBody.data);
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

      const removed = await service.removeByCode(parsedParams.data.code);
      if (!removed) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      return res.status(204).send();
    })
  );

  return router;
}

export default createCampaignRoutes;
