import mongoose from "mongoose";
import { CampaignModel } from "./campaign.model";
import { CreateCampaignInput, ListCampaignQuery, UpdateCampaignInput } from "./campaign.schemas";
import { BadRequestError } from "../../common/errors/app-error";
import { requireActiveBranch } from "../../common/validators/business-rules";
import { PaginatedResult } from "../donations/donation.service";
import { AuthContext, branchScopedFilter, ensureBranchScope, isSuperAdmin } from "../../common/validators/auth-scope";
import { writeActivityLog } from "../activity-logs/activity-log.service";

export interface CampaignSummary {
  total: number;
  active: number;
  inactive: number;
}

export interface CampaignService {
  list(query: ListCampaignQuery, auth: AuthContext): Promise<PaginatedResult<Record<string, unknown>>>;
  getByCode(code: string, auth: AuthContext): Promise<Record<string, unknown> | null>;
  create(input: CreateCampaignInput, auth: AuthContext): Promise<Record<string, unknown>>;
  updateByCode(code: string, input: UpdateCampaignInput, auth: AuthContext): Promise<Record<string, unknown> | null>;
  removeByCode(code: string, auth: AuthContext): Promise<boolean>;
  getSummary(auth: AuthContext): Promise<CampaignSummary>;
}

function escapeRegex(pattern: string): string {
  return pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildCampaignFilter(query: ListCampaignQuery, auth: AuthContext): Record<string, unknown> {
  const filter: Record<string, unknown> = {
    ...branchScopedFilter(auth)
  };

  if (query.status) {
    filter.status = query.status;
  }

  if (query.branchId && isSuperAdmin(auth)) {
    filter.branchId = new mongoose.Types.ObjectId(query.branchId);
  }

  if (query.search) {
    const regex = { $regex: escapeRegex(query.search), $options: "i" };
    filter.$or = [{ code: regex }, { title: regex }];
  }

  return filter;
}

async function validateCampaignCreate(input: CreateCampaignInput, auth: AuthContext): Promise<Record<string, any>> {
  ensureBranchScope(auth, input.branchId);

  // Business trigger: a campaign is a branch-owned aggregate root, so the
  // branch must exist and be ACTIVE before MongoDB is allowed to create it.
  const branch = await requireActiveBranch(input.branchId);

  // Technical enum validation lives in Zod/Mongoose. This service-level rule
  // blocks states that are valid strings but invalid as an initial workflow.
  if (input.status === "COMPLETED" || input.status === "CANCELLED") {
    throw new BadRequestError("New campaign cannot start as COMPLETED or CANCELLED");
  }

  return branch;
}

function normalizeCampaignCreateInput(input: CreateCampaignInput, branch: Record<string, any>, auth: AuthContext) {
  const startDate = input.startDate ?? new Date();
  const endDate = input.endDate ?? startDate;

  // Model-required denormalized fields are derived here so the API can stay
  // compact while the database document remains complete for reports.
  return {
    ...input,
    branchId: branch._id,
    createdBy: new mongoose.Types.ObjectId(auth.userId),
    currentAmount: 0,
    disbursedAmount: 0,
    startDate,
    endDate,
    timeRange: { startDate, endDate },
    goals: {
      targetMoneyAmount: input.targetAmount,
      targetItemSummary: "",
      targetVolunteerCount: 0
    },
    summaryStats: {
      totalMoneyReceived: 0,
      totalEstimatedItemValue: 0,
      totalVolunteerHours: 0,
      totalMoneyDistributed: 0,
      totalEstimatedAidValue: 0,
      beneficiaryCount: 0
    },
    requiredResources: [],
    documents: [],
    metadata: {
      ...(input.metadata ?? {}),
      branchCode: branch.code
    }
  };
}

function validateCampaignUpdate(existing: Record<string, any>, input: UpdateCampaignInput): void {
  if (existing.status === "CANCELLED") {
    throw new BadRequestError("Cancelled campaign cannot be modified");
  }
  if (existing.status === "COMPLETED" && input.status && input.status !== "COMPLETED") {
    throw new BadRequestError("Completed campaign cannot be reopened");
  }
  if (input.status === "DRAFT" && existing.status !== "DRAFT") {
    throw new BadRequestError("Only draft campaigns can stay or return to DRAFT");
  }

  const nextStartDate = input.startDate ?? existing.startDate ?? existing.timeRange?.startDate;
  const nextEndDate = input.endDate ?? existing.endDate ?? existing.timeRange?.endDate;
  if (nextStartDate && nextEndDate && new Date(nextEndDate) < new Date(nextStartDate)) {
    throw new BadRequestError("Campaign endDate must be after or equal to startDate");
  }
  if (input.targetAmount !== undefined && Number(input.targetAmount) < Number(existing.currentAmount ?? 0)) {
    throw new BadRequestError("Target amount cannot be lower than current received amount");
  }
}

export function createCampaignService(model: any = CampaignModel): CampaignService {
  return {
    async list(query, auth) {
      const filter = buildCampaignFilter(query, auth);
      const skip = (query.page - 1) * query.limit;
      const sortDirection = query.sortDir === "asc" ? 1 : -1;
      const sort = { [query.sortBy]: sortDirection };

      const [rows, total] = await Promise.all([
        model.find(filter).sort(sort).skip(skip).limit(query.limit).lean(),
        model.countDocuments(filter)
      ]);

      return {
        data: rows,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: Number(total),
          totalPages: total === 0 ? 0 : Math.ceil(Number(total) / query.limit)
        }
      };
    },

    async getByCode(code, auth) {
      const campaign = await model.findOne({ code }).lean();
      if (!campaign) {
        return null;
      }
      ensureBranchScope(auth, campaign.branchId);
      return campaign;
    },

    async create(input, auth) {
      const branch = await validateCampaignCreate(input, auth);
      const created = await model.create(normalizeCampaignCreateInput(input, branch, auth));

      await writeActivityLog(
        {
          branchId: String(created.branchId),
          action: "CAMPAIGN_CREATED",
          entityType: "campaign",
          entityId: String(created._id),
          description: `Campaign ${created.code} created`,
          after: created.toObject()
        },
        { actorId: auth.userId, actorRole: auth.role, actorBranchId: auth.branchId }
      );

      return created.toObject ? created.toObject() : created;
    },

    async updateByCode(code, input, auth) {
      const existing = await model.findOne({ code }).lean();
      if (!existing) {
        return null;
      }
      ensureBranchScope(auth, existing.branchId);
      validateCampaignUpdate(existing, input);

      const updateDoc: Record<string, unknown> = { ...input };
      if (input.startDate || input.endDate) {
        const startDate = input.startDate ?? existing.startDate ?? existing.timeRange?.startDate;
        const endDate = input.endDate ?? existing.endDate ?? existing.timeRange?.endDate;
        updateDoc.timeRange = { startDate, endDate };
      }

      const updated = await model.findOneAndUpdate({ code }, updateDoc, { new: true, runValidators: true }).lean();
      if (updated) {
        await writeActivityLog(
          {
            branchId: String(updated.branchId),
            action: "CAMPAIGN_UPDATED",
            entityType: "campaign",
            entityId: String(updated._id),
            description: `Campaign ${updated.code} updated`,
            before: existing,
            after: updated
          },
          { actorId: auth.userId, actorRole: auth.role, actorBranchId: auth.branchId }
        );
      }

      return updated;
    },

    async removeByCode(code, auth) {
      const existing = await model.findOne({ code }).lean();
      if (!existing) {
        return false;
      }
      ensureBranchScope(auth, existing.branchId);

      const deleted = await model.findOneAndDelete({ code }).lean();
      if (deleted) {
        await writeActivityLog(
          {
            branchId: String(deleted.branchId),
            action: "CAMPAIGN_DELETED",
            entityType: "campaign",
            entityId: String(deleted._id),
            before: deleted
          },
          { actorId: auth.userId, actorRole: auth.role, actorBranchId: auth.branchId }
        );
      }

      return Boolean(deleted);
    },

    async getSummary(auth) {
      const filter = branchScopedFilter(auth);
      const [total, active] = await Promise.all([
        model.countDocuments(filter),
        model.countDocuments({ ...filter, status: "ACTIVE" })
      ]);

      return {
        total: Number(total),
        active: Number(active),
        inactive: Number(total) - Number(active)
      };
    }
  };
}
