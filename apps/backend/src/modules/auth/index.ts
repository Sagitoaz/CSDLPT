import { Router } from 'express';
import authRoutes from './auth.routes';

/**
 * Auth module router
 * Combines all auth-related routes
 */
const router = Router();

router.use('/', authRoutes);

export default router;
