import { Router } from "express";
import { asyncHandler } from "../../common/http";
import {
  createDonationSchema,
  donationIdParamsSchema,
  listDonationQuerySchema,
  updateDonationSchema,
  updateDonationStatusSchema
} from "./donation.schemas";
import { createDonationService, DonationService } from "./donation.service";

export function createDonationRoutes(service: DonationService = createDonationService()): Router {
  const router = Router();

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const parsed = listDonationQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }

      const result = await service.list(parsed.data);
      return res.json(result);
    })
  );

  router.get(
    "/:id",
    asyncHandler(async (req, res) => {
      const parsedParams = donationIdParamsSchema.safeParse(req.params);
      if (!parsedParams.success) {
        return res.status(400).json({ error: parsedParams.error.flatten() });
      }

      const donation = await service.getById(parsedParams.data.id);
      if (!donation) {
        return res.status(404).json({ error: "Donation not found" });
      }

      return res.json(donation);
    })
  );

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const parsed = createDonationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }

      const created = await service.create(parsed.data);
      return res.status(201).json(created);
    })
  );

  router.put(
    "/:id",
    asyncHandler(async (req, res) => {
      const parsedParams = donationIdParamsSchema.safeParse(req.params);
      if (!parsedParams.success) {
        return res.status(400).json({ error: parsedParams.error.flatten() });
      }

      const parsedBody = updateDonationSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({ error: parsedBody.error.flatten() });
      }

      const updated = await service.update(parsedParams.data.id, parsedBody.data);
      if (!updated) {
        return res.status(404).json({ error: "Donation not found" });
      }

      return res.json(updated);
    })
  );

  router.patch(
    "/:id/status",
    asyncHandler(async (req, res) => {
      const parsedParams = donationIdParamsSchema.safeParse(req.params);
      if (!parsedParams.success) {
        return res.status(400).json({ error: parsedParams.error.flatten() });
      }

      const parsedBody = updateDonationStatusSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({ error: parsedBody.error.flatten() });
      }

      const updated = await service.updateStatus(parsedParams.data.id, parsedBody.data.status);
      if (!updated) {
        return res.status(404).json({ error: "Donation not found" });
      }

      return res.json(updated);
    })
  );

  router.delete(
    "/:id",
    asyncHandler(async (req, res) => {
      const parsedParams = donationIdParamsSchema.safeParse(req.params);
      if (!parsedParams.success) {
        return res.status(400).json({ error: parsedParams.error.flatten() });
      }

      const removed = await service.remove(parsedParams.data.id);
      if (!removed) {
        return res.status(404).json({ error: "Donation not found" });
      }

      return res.status(204).send();
    })
  );

  return router;
}

export default createDonationRoutes;
