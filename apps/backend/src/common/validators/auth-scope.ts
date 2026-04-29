import { Types } from "mongoose";
import { ForbiddenError } from "../errors/forbidden-error";
import { UserRole } from "../../modules/auth/auth.model";

export interface AuthContext {
  userId: string;
  role: UserRole;
  branchId?: string;
}

export function buildAuthContext(req: Express.Request): AuthContext {
  const user = req.user;
  if (!user?.userId || !user?.role) {
    throw new ForbiddenError("Authentication required");
  }

  return {
    userId: user.userId,
    role: user.role as UserRole,
    branchId: user.branchId
  };
}

export function isSuperAdmin(ctx: AuthContext): boolean {
  return ctx.role === UserRole.SUPER_ADMIN;
}

export function ensureBranchScope(ctx: AuthContext, branchId: string | Types.ObjectId): void {
  if (isSuperAdmin(ctx)) {
    return;
  }

  if (!ctx.branchId || ctx.branchId !== String(branchId)) {
    throw new ForbiddenError("You do not have access to this branch");
  }
}

export function branchScopedFilter(ctx: AuthContext): Record<string, unknown> {
  if (isSuperAdmin(ctx)) {
    return {};
  }

  if (!ctx.branchId) {
    throw new ForbiddenError("Branch scope is required");
  }

  return { branchId: new Types.ObjectId(ctx.branchId) };
}
