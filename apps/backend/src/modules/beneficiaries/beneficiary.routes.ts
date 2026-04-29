import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../common/http";
import { buildAuthContext } from "../../common/validators/auth-scope";
import { requireAuth } from "../auth/auth.middleware";
import { createBeneficiaryService } from "./beneficiary.service";

const createSchema = z.object({
  branchId: z.string().trim().regex(/^[a-f\d]{24}$/i),
  campaignId: z.string().trim().regex(/^[a-f\d]{24}$/i),
  name: z.string().trim().min(2).max(160),
  type: z.enum(["INDIVIDUAL", "FAMILY", "ORGANIZATION", "COMMUNITY"]),
  phone: z.string().trim().max(20).optional(),
  location: z.object({
    province: z.string().trim().min(1).max(100),
    district: z.string().trim().max(100).optional(),
    ward: z.string().trim().max(100).optional(),
    address: z.string().trim().max(500).optional()
  }),
  situationDescription: z.string().trim().max(2000).optional()
});

export function createBeneficiaryRoutes(service = createBeneficiaryService()): Router {
  const router = Router();
  router.use(requireAuth);

  router.get("/", asyncHandler(async (req, res) => {
    const rows = await service.list(buildAuthContext(req), req.query.campaignId as string | undefined);
    res.json(rows);
  }));

  router.post("/", asyncHandler(async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const created = await service.create(parsed.data, buildAuthContext(req));
    res.status(201).json(created);
  }));

  router.patch("/:id/verification", asyncHandler(async (req, res) => {
    const status = z.enum(["PENDING", "VERIFIED", "REJECTED"]).parse(req.body.verificationStatus);
    const updated = await service.verify(req.params.id, status, buildAuthContext(req));
    if (!updated) return res.status(404).json({ error: "Beneficiary not found" });
    res.json(updated);
  }));

  return router;
}
