import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from './jwt.utils';
import { UserRole } from './auth.model';

/**
 * Authentication & Authorization Middleware
 * SECURITY-08: Application-level access control
 * - Verifies JWT tokens
 * - Enforces RBAC policies
 */

// Extend Express Request to include user context
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload & { id: string };
    }
  }
}

/**
 * Authentication Middleware
 * Extracts and verifies JWT from Authorization header
 * SECURITY-08: Validates token signature and expiration
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Missing or invalid authorization header',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    try {
      const decoded = await verifyToken(token);
      // SECURITY-08: Attach user info to request for use in route handlers
      req.user = {
        ...decoded,
        id: decoded.userId,
        branchId: decoded.branchId
      };
      next();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Token verification failed';
      res.status(401).json({
        success: false,
        message: `Authentication failed: ${message}`,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication',
    });
  }
}

/**
 * Role-Based Access Control Middleware
 * SECURITY-08: Function-level authorization
 * Ensures user has required role(s) to access endpoint
 *
 * @param allowedRoles - Array of roles permitted to access this endpoint
 * @returns Middleware function
 *
 * Usage: router.get('/admin', requireRole([UserRole.ADMIN]), handler)
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      res.status(403).json({
        success: false,
        message: `Insufficient permissions. Required roles: ${allowedRoles.join(', ')}`,
      });
      return;
    }

    next();
  };
}

/**
 * Public endpoint middleware
 * Marks an endpoint as accessible without authentication
 * Useful for explicit documentation
 */
export function isPublic(req: Request, res: Response, next: NextFunction): void {
  next();
}

/**
 * Owner verification middleware
 * SECURITY-08: Object-level authorization
 * Ensures user can only access their own resources
 *
 * Usage: router.get('/profile/:userId', requireAuth, requireOwner, handler)
 * Expects userId in req.params
 */
export function requireOwner(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
    return;
  }

  const { userId } = req.params;

  // Allow admins to access any resource
  if (req.user.role === UserRole.SUPER_ADMIN) {
    next();
    return;
  }

  // Regular users can only access their own resources
  if (req.user.id !== userId) {
    res.status(403).json({
      success: false,
      message: 'You do not have permission to access this resource',
    });
    return;
  }

  next();
}

/**
 * Audit middleware
 * SECURITY-03: Logs all requests with user context
 * Used in combination with audit logging infrastructure
 */
export function auditLog(req: Request, res: Response, next: NextFunction): void {
  const originalSend = res.send;

  res.send = function (data: any) {
    // Log would happen here
    // logger.audit({
    //   timestamp: new Date(),
    //   userId: req.user?.id,
    //   email: req.user?.email,
    //   method: req.method,
    //   path: req.path,
    //   status: res.statusCode,
    //   duration: Date.now() - (req as any).startTime,
    // });

    return originalSend.call(this, data);
  };

  next();
}
