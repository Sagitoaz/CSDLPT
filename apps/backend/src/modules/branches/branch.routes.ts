import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../common/http";
import { buildAuthContext } from "../../common/validators/auth-scope";
import { requireAuth } from "../auth/auth.middleware";
import { createBranchService } from "./branch.service";

const createSchema = z.object({
  name: z.string().trim().min(2).max(160),
  code: z.string().trim().min(2).max(50),
  type: z.enum(["HEADQUARTER", "BRANCH", "REGIONAL_CENTER"]).optional(),
  parentId: z.string().trim().regex(/^[a-f\d]{24}$/i).optional(),
  province: z.string().trim().min(1).max(100),
  district: z.string().trim().max(100).optional(),
  ward: z.string().trim().max(100).optional(),
  address: z.string().trim().max(500).optional(),
  phone: z.string().trim().max(20).optional(),
  email: z.string().trim().email().max(200).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "LOCKED"]).optional()
});

export function createBranchRoutes(service = createBranchService()): Router {
  const router = Router();
  router.use(requireAuth);

  router.get("/", asyncHandler(async (_req, res) => {
    const rows = await service.list();
    res.json(rows);
  }));

  router.get("/:id", asyncHandler(async (req, res) => {
    const row = await service.getById(req.params.id, buildAuthContext(req));
    if (!row) return res.status(404).json({ error: "Branch not found" });
    res.json(row);
  }));

  router.post("/", asyncHandler(async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const created = await service.create(parsed.data, buildAuthContext(req));
    res.status(201).json(created);
  }));

  return router;
}
