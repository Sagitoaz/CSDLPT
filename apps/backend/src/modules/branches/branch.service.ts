import { AuthContext, branchScopedFilter, ensureBranchScope, isSuperAdmin } from "../../common/validators/auth-scope";
import { BranchModel } from "./branch.model";

export function createBranchService(model: any = BranchModel) {
  return {
    async list() {
      return model.find({}).sort({ createdAt: -1 }).lean();
    },

    async getById(id: string, auth: AuthContext) {
      const branch = await model.findById(id).lean();
      if (!branch) return null;
      ensureBranchScope(auth, branch._id);
      return branch;
    },

    async create(payload: Record<string, unknown>, auth: AuthContext) {
      if (!isSuperAdmin(auth)) {
        throw new Error("Only SUPER_ADMIN can create branch");
      }
      const created = await model.create(payload);
      return created.toObject();
    }
  };
}
