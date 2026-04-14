import { z } from "zod";

const campaignSchemaBase = z.object({
  code: z.string().trim().min(2).max(50),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional(),
  targetAmount: z.coerce.number().min(0).max(100000000000),
  isActive: z.coerce.boolean().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional()
});

function hasValidDateRange(value: { startDate?: Date; endDate?: Date }): boolean {
  if (!value.startDate || !value.endDate) {
    return true;
  }

  return value.endDate.getTime() >= value.startDate.getTime();
}

export const createCampaignSchema = campaignSchemaBase.refine(hasValidDateRange, {
  message: "endDate must be after or equal to startDate",
  path: ["endDate"]
});

export const updateCampaignSchema = campaignSchemaBase
  .omit({ code: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  })
  .refine(hasValidDateRange, {
    message: "endDate must be after or equal to startDate",
    path: ["endDate"]
  });

export const campaignCodeParamsSchema = z.object({
  code: z.string().trim().min(2).max(50)
});

export const listCampaignQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    isActive: z.enum(["true", "false"]).optional(),
    search: z.string().trim().min(1).max(100).optional(),
    sortBy: z.enum(["createdAt", "targetAmount", "code"]).optional(),
    sortDir: z.enum(["asc", "desc"]).optional()
  })
  .transform((value) => ({
    page: value.page ?? 1,
    limit: value.limit ?? 10,
    isActive:
      value.isActive === undefined ? undefined : value.isActive === "true",
    search: value.search,
    sortBy: value.sortBy ?? "createdAt",
    sortDir: value.sortDir ?? "desc"
  }));

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
export type ListCampaignQuery = z.infer<typeof listCampaignQuerySchema>;
