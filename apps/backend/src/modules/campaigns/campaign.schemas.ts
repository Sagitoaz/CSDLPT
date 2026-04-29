import { z } from "zod";

const objectId = z.string().trim().regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");

const locationSchema = z.object({
  province: z.string().trim().min(1).max(100),
  district: z.string().trim().max(100).optional(),
  ward: z.string().trim().max(100).optional(),
  address: z.string().trim().max(500).optional()
});

const imageSchema = z.object({
  url: z.string().trim().url().max(500),
  caption: z.string().trim().max(200).optional()
});

const campaignType = z.enum([
  "FLOOD_RELIEF",
  "SCHOLARSHIP",
  "MEDICAL_SUPPORT",
  "FOOD_SUPPORT",
  "CHILD_SUPPORT",
  "DISASTER_RELIEF",
  "OTHER"
]);

const campaignStatus = z.enum(["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"]);

const baseSchema = z.object({
  branchId: objectId,
  code: z.string().trim().min(2).max(50),
  title: z.string().trim().min(2).max(160).optional(),
  name: z.string().trim().min(2).max(160).optional(),
  description: z.string().trim().max(3000).optional(),
  type: campaignType.optional(),
  status: campaignStatus.optional(),
  targetAmount: z.coerce.number().min(0).max(100000000000),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  location: locationSchema,
  organizerId: objectId.optional(),
  images: z.array(imageSchema).optional(),
  proofImages: z.array(imageSchema).optional(),
  metadata: z.record(z.unknown()).optional()
});

function resolveTitle(data: z.infer<typeof baseSchema>): string | undefined {
  return data.title ?? data.name;
}

export const createCampaignSchema = baseSchema
  .refine((value) => Boolean(resolveTitle(value)), {
    message: "title or name is required",
    path: ["title"]
  })
  .transform((value) => ({
    ...value,
    title: resolveTitle(value) as string,
    type: value.type ?? "OTHER",
    status: value.status ?? "DRAFT",
    images: value.images ?? [],
    proofImages: value.proofImages ?? []
  }))
  .refine((value) => !value.startDate || !value.endDate || value.endDate >= value.startDate, {
    message: "endDate must be after or equal to startDate",
    path: ["endDate"]
  });

export const updateCampaignSchema = baseSchema
  .omit({ code: true, branchId: true, targetAmount: true, location: true })
  .partial()
  .extend({
    location: locationSchema.partial().optional(),
    targetAmount: z.coerce.number().min(0).max(100000000000).optional(),
    title: z.string().trim().min(2).max(160).optional(),
    name: z.string().trim().min(2).max(160).optional()
  })
  .transform((value) => {
    if (value.name && !value.title) {
      return { ...value, title: value.name };
    }
    return value;
  })
  .refine((value) => Object.keys(value).length > 0, { message: "At least one field is required" });

export const campaignCodeParamsSchema = z.object({
  code: z.string().trim().min(2).max(50)
});

export const listCampaignQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    status: campaignStatus.optional(),
    branchId: objectId.optional(),
    search: z.string().trim().min(1).max(100).optional(),
    sortBy: z.enum(["createdAt", "targetAmount", "code"]).optional(),
    sortDir: z.enum(["asc", "desc"]).optional()
  })
  .transform((value) => ({
    page: value.page ?? 1,
    limit: value.limit ?? 10,
    status: value.status,
    branchId: value.branchId,
    search: value.search,
    sortBy: value.sortBy ?? "createdAt",
    sortDir: value.sortDir ?? "desc"
  }));

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
export type ListCampaignQuery = z.infer<typeof listCampaignQuerySchema>;
