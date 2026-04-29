import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../common/http";
import { buildAuthContext } from "../../common/validators/auth-scope";
import { requireAuth } from "../auth/auth.middleware";
import { createDonorService } from "./donor.service";

const upsertSchema = z.object({
  userId: z.string().trim().regex(/^[a-f\d]{24}$/i).optional(),
  fullName: z.string().trim().min(2).max(140),
  phone: z.string().trim().max(20).optional(),
  email: z.string().trim().email().max(200).optional(),
  address: z.string().trim().max(500).optional(),
  donorType: z.enum(["INDIVIDUAL", "ORGANIZATION"]).optional()
});

export function createDonorRoutes(service = createDonorService()): Router {
  const router = Router();
  router.use(requireAuth);

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const rows = await service.list(req.query, buildAuthContext(req));
      res.json(rows);
    })
  );

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const parsed = upsertSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      const row = await service.upsert(parsed.data, buildAuthContext(req));
      res.status(201).json(row);
    })
  );

  return router;
}
