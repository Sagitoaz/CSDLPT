import mongoose from "mongoose";
import { AuthContext, branchScopedFilter, ensureBranchScope } from "../../common/validators/auth-scope";
import { VolunteerModel } from "./volunteer.model";

export function createVolunteerService(model: any = VolunteerModel) {
  return {
    async list(auth: AuthContext) {
      return model.find(branchScopedFilter(auth)).sort({ createdAt: -1 }).lean();
    },

    async create(payload: Record<string, unknown>, auth: AuthContext) {
      ensureBranchScope(auth, String(payload.branchId));
      const created = await model.create(payload);
      return created.toObject();
    },

    async update(id: string, payload: Record<string, unknown>, auth: AuthContext) {
      const existing = await model.findById(id).lean();
      if (!existing) return null;
      ensureBranchScope(auth, existing.branchId);
      return model.findByIdAndUpdate(id, payload, { new: true, runValidators: true }).lean();
    }
  };
}
