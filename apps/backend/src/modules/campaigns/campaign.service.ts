import { CampaignModel } from "./campaign.model";
import { CreateCampaignInput, ListCampaignQuery, UpdateCampaignInput } from "./campaign.schemas";
import { PaginatedResult } from "../donations/donation.service";

export interface CampaignSummary {
  total: number;
  active: number;
  inactive: number;
}

export interface CampaignService {
  list(query: ListCampaignQuery): Promise<PaginatedResult<Record<string, unknown>>>;
  getByCode(code: string): Promise<Record<string, unknown> | null>;
  create(input: CreateCampaignInput): Promise<Record<string, unknown>>;
  updateByCode(code: string, input: UpdateCampaignInput): Promise<Record<string, unknown> | null>;
  removeByCode(code: string): Promise<boolean>;
  getSummary(): Promise<CampaignSummary>;
}

function escapeRegex(pattern: string): string {
  return pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildCampaignFilter(query: ListCampaignQuery): Record<string, unknown> {
  const filter: Record<string, unknown> = {};

  if (typeof query.isActive === "boolean") {
    filter.isActive = query.isActive;
  }

  if (query.search) {
    const regex = { $regex: escapeRegex(query.search), $options: "i" };
    filter.$or = [{ code: regex }, { name: regex }];
  }

  return filter;
}

export function createCampaignService(model: any = CampaignModel): CampaignService {
  return {
    async list(query) {
      const filter = buildCampaignFilter(query);
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

    async getByCode(code) {
      return model.findOne({ code }).lean();
    },

    async create(input) {
      const created = await model.create(input);
      return created.toObject ? created.toObject() : created;
    },

    async updateByCode(code, input) {
      return model.findOneAndUpdate({ code }, input, { new: true, runValidators: true }).lean();
    },

    async removeByCode(code) {
      const deleted = await model.findOneAndDelete({ code }).lean();
      return Boolean(deleted);
    },

    async getSummary() {
      const [total, active] = await Promise.all([
        model.countDocuments({}),
        model.countDocuments({ isActive: true })
      ]);

      return {
        total: Number(total),
        active: Number(active),
        inactive: Number(total) - Number(active)
      };
    }
  };
}
