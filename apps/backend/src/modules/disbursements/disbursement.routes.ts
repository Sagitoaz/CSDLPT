import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../common/http";
import { buildAuthContext } from "../../common/validators/auth-scope";
import { requireAuth } from "../auth/auth.middleware";
import { createDisbursementService } from "./disbursement.service";

const createSchema = z.object({
  branchId: z.string().trim().regex(/^[a-f\d]{24}$/i),
  campaignId: z.string().trim().regex(/^[a-f\d]{24}$/i),
  beneficiaryId: z.string().trim().regex(/^[a-f\d]{24}$/i),
  amount: z.coerce.number().min(1),
  purpose: z.string().trim().min(2).max(2000),
  method: z.string().trim().min(2).max(50)
});

const proofSchema = z.object({
  type: z.string().trim().min(1).max(50),
  url: z.string().trim().url().max(500),
  description: z.string().trim().max(500).optional(),
  uploadedAt: z.coerce.date().optional(),
  uploadedBy: z.string().trim().regex(/^[a-f\d]{24}$/i).optional()
});

export function createDisbursementRoutes(service = createDisbursementService()): Router {
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

  router.patch("/:id/status", asyncHandler(async (req, res) => {
    const status = z.enum(["PENDING", "APPROVED", "COMPLETED", "REJECTED"]).parse(req.body.status);
    const proofs = req.body.proofs ? z.array(proofSchema).parse(req.body.proofs) : undefined;
    const updated = await service.transition(req.params.id, status, buildAuthContext(req), proofs);
    if (!updated) return res.status(404).json({ error: "Disbursement not found" });
    res.json(updated);
  }));

  return router;
}
