import { z } from "zod";

const objectId = z.string().trim().regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");
const paymentStatus = z.enum(["PENDING", "SUCCESS", "FAILED", "REFUNDED"]);

export const createDonationSchema = z.object({
  campaignId: objectId,
  donorId: objectId,
  amount: z.coerce.number().min(1).max(5000000000),
  paymentMethod: z.string().trim().min(2).max(40),
  paymentStatus: paymentStatus.optional(),
  message: z.string().trim().max(1000).optional(),
  transactionCode: z.string().trim().min(3).max(100),
  donatedAt: z.coerce.date().optional()
});

export const updateDonationSchema = z
  .object({
    message: z.string().trim().max(1000).optional(),
    paymentMethod: z.string().trim().min(2).max(40).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

export const updateDonationStatusSchema = z.object({
  paymentStatus: paymentStatus,
  note: z.string().trim().max(500).optional()
});

export const donationIdParamsSchema = z.object({
  id: objectId
});

export const listDonationQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    campaignId: objectId.optional(),
    donorId: objectId.optional(),
    paymentStatus: paymentStatus.optional(),
    branchId: objectId.optional(),
    sortBy: z.enum(["createdAt", "amount", "donatedAt"]).optional(),
    sortDir: z.enum(["asc", "desc"]).optional()
  })
  .transform((value) => ({
    page: value.page ?? 1,
    limit: value.limit ?? 10,
    campaignId: value.campaignId,
    donorId: value.donorId,
    paymentStatus: value.paymentStatus,
    branchId: value.branchId,
    sortBy: value.sortBy ?? "donatedAt",
    sortDir: value.sortDir ?? "desc"
  }));

export type CreateDonationInput = z.infer<typeof createDonationSchema>;
export type UpdateDonationInput = z.infer<typeof updateDonationSchema>;
export type UpdateDonationStatusInput = z.infer<typeof updateDonationStatusSchema>;
export type DonationListQuery = z.infer<typeof listDonationQuerySchema>;
