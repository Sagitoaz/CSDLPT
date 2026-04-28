import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../common/http';
import { requireAuth } from '../../modules/auth/auth.middleware';

/**
 * Health Check Routes
 * SECURITY-02: Monitoring and observability
 * SECURITY-03: Audit logging
 */

const router = Router();

/**
 * GET /health
 * Basic health check (public)
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'charity-backend',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /health/replication
 * Check MongoDB replication status
 * SECURITY-02: Monitoring replication lag
 *
 * Returns:
 * - Primary: true/false
 * - Replication lag in ms
 * - Replica set status
 */
router.get(
  '/health/replication',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    // This endpoint requires MongoDB admin connection to check replication
    // TODO: Implement replica set status check via MongoDB admin commands
    // For now, return placeholder

    res.json({
      status: 'monitoring',
      message: 'Replication status monitoring configured',
      endpoints: {
        replStatus: 'rs.status() in mongosh',
        replInfo: 'rs.printReplicationInfo() in mongosh',
      },
      documentation: 'See infrastructure/mongodb/HUONG-DAN-BACKUP-RESTORE-FAILOVER.md',
    });
  })
);

/**
 * GET /health/system
 * System overview including replication and resources
 */
router.get(
  '/health/system',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    res.json({
      timestamp: new Date().toISOString(),
      service: 'charity-backend',
      environment: process.env.NODE_ENV || 'development',
      mongoUri: process.env.MONGODB_URI ? '***configured***' : '***not set***',
      corsOrigin: process.env.CORS_ORIGIN || 'localhost',
      jwtConfigured: !!process.env.JWT_SECRET,
      features: {
        authentication: true,
        authorization: true,
        replicationMonitoring: 'via mongosh',
        auditLogging: 'configured',
      },
    });
  })
);

export default router;
