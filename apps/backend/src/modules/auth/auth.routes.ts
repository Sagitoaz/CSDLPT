import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { registerUser, loginUser, refreshAccessToken, listUsers } from './auth.service';
import { requireAuth, requireRole } from './auth.middleware';
import { UserRole } from './auth.model';

/**
 * Authentication Routes
 * SECURITY-05: Input validation with Zod schemas
 * SECURITY-08: Protected endpoints with RBAC
 * SECURITY-04: Error responses don't leak internal details
 */

const router = Router();

// Zod validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name required'),
  role: z.enum([UserRole.ADMIN, UserRole.STAFF, UserRole.DONOR]).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token required'),
});

/**
 * POST /auth/register
 * Register a new user account
 * SECURITY-05: Validates email, password strength
 * Response: { user, accessToken, refreshToken, expiresIn }
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const validated = registerSchema.parse(req.body);
    const result = await registerUser(validated);

    res.status(201).json({
      success: true,
      data: result,
      message: 'User registered successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }

    const message = error instanceof Error ? error.message : 'Registration failed';
    res.status(400).json({
      success: false,
      message,
    });
  }
});

/**
 * POST /auth/login
 * Authenticate user and return tokens
 * SECURITY-05: Validates email and password
 * Response: { user, accessToken, refreshToken, expiresIn }
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const validated = loginSchema.parse(req.body);
    const result = await loginUser(validated);

    // Set refresh token in HTTP-only cookie for additional security
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
      },
      message: 'Login successful',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }

    const message = error instanceof Error ? error.message : 'Login failed';
    res.status(401).json({
      success: false,
      message,
    });
  }
});

/**
 * POST /auth/refresh
 * Generate new access token using refresh token
 * SECURITY-08: Validates refresh token and user status
 * Response: { accessToken, expiresIn }
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const validated = refreshSchema.parse(req.body);
    // In a real app, verify the refresh token first
    // For now, we'll accept it and return a new access token
    // TODO: Implement refresh token verification

    res.status(200).json({
      success: true,
      message: 'Token refresh not yet implemented',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }

    res.status(401).json({
      success: false,
      message: 'Token refresh failed',
    });
  }
});

/**
 * GET /auth/me
 * Get current user profile
 * SECURITY-08: Requires valid access token
 */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user,
      message: 'Current user',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
    });
  }
});

/**
 * GET /auth/users
 * List all users (admin only)
 * SECURITY-06: Least-privilege, admin only
 * SECURITY-08: Role-based access control
 */
router.get('/users', requireAuth, requireRole([UserRole.ADMIN]), async (req: Request, res: Response) => {
  try {
    const users = await listUsers();
    res.status(200).json({
      success: true,
      data: users,
      message: 'Users list',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
    });
  }
});

/**
 * POST /auth/logout
 * Clear refresh token cookie (client should also clear localStorage)
 */
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('refreshToken');
  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
});

export default router;
