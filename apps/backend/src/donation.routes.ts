import { Router } from "express";
import { z } from "zod";
import { DonationModel } from "./donation.model";

const router = Router();

const createDonationSchema = z.object({
  donorName: z.string().min(2).max(100),
  donorEmail: z.string().email().max(200),
  amount: z.number().int().min(1000).max(500000000),
  campaignCode: z.string().min(2).max(50),
  note: z.string().max(1000).optional()
});

const statusSchema = z.object({
  status: z.enum(["pending", "verified", "rejected"])
});

router.get("/", async (_req, res) => {
  const rows = await DonationModel.find().sort({ createdAt: -1 }).limit(100).lean();
  res.json(rows);
});

router.post("/", async (req, res) => {
  const parsed = createDonationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const created = await DonationModel.create(parsed.data);
  return res.status(201).json(created);
});

router.patch("/:id/status", async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const updated = await DonationModel.findByIdAndUpdate(
    req.params.id,
    { status: parsed.data.status },
    { new: true }
  ).lean();

  if (!updated) {
    return res.status(404).json({ error: "Donation not found" });
  }

  return res.json(updated);
});

export default router;
