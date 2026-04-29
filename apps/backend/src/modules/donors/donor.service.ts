import mongoose from "mongoose";
import { AuthContext, branchScopedFilter, ensureBranchScope, isSuperAdmin } from "../../common/validators/auth-scope";
import { DonorModel } from "./donor.model";

export function createDonorService(model: any = DonorModel) {
  return {
    async list(query: Record<string, unknown>, auth: AuthContext) {
      const filter = branchScopedFilter(auth);
      if (query.search) {
        filter.$text = { $search: String(query.search) };
      }
      return model.find(filter).sort({ createdAt: -1 }).limit(Number(query.limit ?? 50)).lean();
    },

    async upsert(payload: Record<string, unknown>, auth: AuthContext) {
      if (payload.userId && !isSuperAdmin(auth)) {
        throw new Error("Only super admin can bind donor to account");
      }
      const normalizedEmail = typeof payload.email === "string" ? payload.email.toLowerCase() : undefined;
      const normalizedPhone = typeof payload.phone === "string" ? payload.phone.trim() : undefined;
      const existing = await model.findOne({
        $or: [{ email: normalizedEmail }, { phone: normalizedPhone }]
      });

      if (existing) {
        Object.assign(existing, { ...payload, email: normalizedEmail, phone: normalizedPhone });
        await existing.save();
        return existing.toObject();
      }

      const created = await model.create({ ...payload, email: normalizedEmail, phone: normalizedPhone });
      return created.toObject();
    }
  };
}
