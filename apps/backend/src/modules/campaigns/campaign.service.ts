import mongoose from "mongoose";
import { CampaignModel } from "./campaign.model";
import { CreateCampaignInput, ListCampaignQuery, UpdateCampaignInput } from "./campaign.schemas";
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
      ensureBranchScope(auth, input.branchId);
      const created = await model.create({
        ...input,
        createdBy: new mongoose.Types.ObjectId(auth.userId),
        currentAmount: 0,
        disbursedAmount: 0
      });

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

      const updated = await model.findOneAndUpdate({ code }, input, { new: true, runValidators: true }).lean();
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
