import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../common/http";
import { buildAuthContext } from "../../common/validators/auth-scope";
import { requireAuth } from "../auth/auth.middleware";
import { createActivityLogQueryService } from "./activity-log.query.service";

const querySchema = z.object({
  entityType: z.string().trim().max(100).optional(),
  entityId: z.string().trim().max(100).optional(),
  branchId: z.string().trim().regex(/^[a-f\d]{24}$/i).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional()
});

export function createActivityLogRoutes(service = createActivityLogQueryService()): Router {
  const router = Router();
  router.use(requireAuth);

  router.get("/", asyncHandler(async (req, res) => {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const rows = await service.list(buildAuthContext(req), parsed.data);
    res.json(rows);
  }));

  return router;
}
