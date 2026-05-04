import { BadRequestError, ConflictError, NotFoundError } from "../../common/errors/app-error";
import { ForbiddenError } from "../../common/errors/forbidden-error";
import { AuthContext, ensureBranchScope, isSuperAdmin } from "../../common/validators/auth-scope";
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
        throw new ForbiddenError("Only SUPER_ADMIN can create branch");
      }

      const code = String(payload.code ?? "").trim().toUpperCase();
      const existing = await model.findOne({ code }).lean();
      if (existing) {
        throw new ConflictError("Branch code already exists");
      }

      // Business trigger: regional branches can be attached to a parent, but
      // the parent must already exist and must not be locked.
      if (payload.parentId) {
        const parent = await model.findById(payload.parentId).lean();
        if (!parent) {
          throw new NotFoundError("Parent branch not found");
        }
        if (parent.status === "LOCKED") {
          throw new BadRequestError("Cannot attach branch to a locked parent branch");
        }
      }

      const created = await model.create({ ...payload, code });
      return created.toObject();
    }
  };
}
