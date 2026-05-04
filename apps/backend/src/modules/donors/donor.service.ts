import mongoose from "mongoose";
import { BadRequestError, ConflictError, NotFoundError } from "../../common/errors/app-error";
import { AuthContext, branchScopedFilter, ensureBranchScope, isSuperAdmin } from "../../common/validators/auth-scope";
import { User } from "../auth/auth.model";
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
        throw new BadRequestError("Only super admin can bind donor to account");
      }

      const normalizedEmail = typeof payload.email === "string" ? payload.email.toLowerCase() : undefined;
      const normalizedPhone = typeof payload.phone === "string" ? payload.phone.trim() : undefined;
      if (!normalizedEmail && !normalizedPhone) {
        throw new BadRequestError("Donor must have at least one contact method: email or phone");
      }

      // Business trigger: when a donor profile is linked to an account, the
      // account must exist and be active; otherwise donations point to a dead user.
      if (payload.userId) {
        const user = await User.findById(payload.userId).lean();
        if (!user) {
          throw new NotFoundError("Linked user not found");
        }
        if (!user.isActive) {
          throw new BadRequestError("Cannot bind donor to an inactive user");
        }
      }

      const identityFilters = [
        normalizedEmail ? { email: normalizedEmail } : undefined,
        normalizedPhone ? { phone: normalizedPhone } : undefined
      ].filter(Boolean);
      const existing = await model.findOne({ $or: identityFilters });

      if (existing) {
        if (payload.userId && existing.userId && String(existing.userId) !== String(payload.userId)) {
          throw new ConflictError("Donor contact is already bound to another account");
        }
        Object.assign(existing, { ...payload, email: normalizedEmail, phone: normalizedPhone });
        await existing.save();
        return existing.toObject();
      }

      const created = await model.create({ ...payload, email: normalizedEmail, phone: normalizedPhone });
      return created.toObject();
    }
  };
}
