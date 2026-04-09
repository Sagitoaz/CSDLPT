import { z } from "zod";

const donationStatus = z.enum(["pending", "verified", "rejected"]);

export const createDonationSchema = z.object({
  donorName: z.string().trim().min(2).max(100),
  donorEmail: z.string().trim().email().max(200),
  amount: z.coerce.number().int().min(1000).max(500000000),
  campaignCode: z.string().trim().min(2).max(50),
  note: z.string().trim().max(1000).optional()
});

export const updateDonationSchema = createDonationSchema
  .partial()
  .extend({ status: donationStatus.optional() })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

export const updateDonationStatusSchema = z.object({
  status: donationStatus
});

export const donationIdParamsSchema = z.object({
  id: z.string().trim().min(1)
});

export const listDonationQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    campaignCode: z.string().trim().min(1).max(50).optional(),
    status: donationStatus.optional(),
    donorEmail: z.string().trim().email().max(200).optional(),
    search: z.string().trim().min(1).max(100).optional(),
    sortBy: z.enum(["createdAt", "amount"]).optional(),
    sortDir: z.enum(["asc", "desc"]).optional()
  })
  .transform((value) => ({
    page: value.page ?? 1,
    limit: value.limit ?? 10,
    campaignCode: value.campaignCode,
    status: value.status,
    donorEmail: value.donorEmail,
    search: value.search,
    sortBy: value.sortBy ?? "createdAt",
    sortDir: value.sortDir ?? "desc"
  }));

export type CreateDonationInput = z.infer<typeof createDonationSchema>;
export type UpdateDonationInput = z.infer<typeof updateDonationSchema>;
export type UpdateDonationStatusInput = z.infer<typeof updateDonationStatusSchema>;
export type DonationListQuery = z.infer<typeof listDonationQuerySchema>;
