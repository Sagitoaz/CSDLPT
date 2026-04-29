import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../common/http";
import { buildAuthContext } from "../../common/validators/auth-scope";
import { requireAuth } from "../auth/auth.middleware";
import { createVolunteerService } from "./volunteer.service";

const createSchema = z.object({
  branchId: z.string().trim().regex(/^[a-f\d]{24}$/i),
  fullName: z.string().trim().min(2).max(140),
  phone: z.string().trim().max(20).optional(),
  email: z.string().trim().email().max(200).optional(),
  skills: z.array(z.string().trim().min(1).max(50)).default([]),
  joinedCampaignIds: z.array(z.string().trim().regex(/^[a-f\d]{24}$/i)).default([]),
  status: z.enum(["ACTIVE", "INACTIVE", "BLACKLISTED"]).optional()
});

export function createVolunteerRoutes(service = createVolunteerService()): Router {
  const router = Router();
  router.use(requireAuth);

  router.get("/", asyncHandler(async (req, res) => {
    const rows = await service.list(buildAuthContext(req));
    res.json(rows);
  }));

  router.post("/", asyncHandler(async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const created = await service.create(parsed.data, buildAuthContext(req));
    res.status(201).json(created);
  }));

  router.put("/:id", asyncHandler(async (req, res) => {
    const parsed = createSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const updated = await service.update(req.params.id, parsed.data, buildAuthContext(req));
    if (!updated) return res.status(404).json({ error: "Volunteer not found" });
    res.json(updated);
  }));

  return router;
}
