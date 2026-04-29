/**
 * JWT Utilities for token generation and verification
 * Uses jsonwebtoken library for symmetric signing
 */

import { SignOptions, VerifyOptions } from 'jsonwebtoken';

// Types for JWT payloads
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  branchId?: string;
  type: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * JWT configuration - must match environment variables
 * SECURITY-01: Tokens are signed with a secret key
 * SECURITY-08: Tokens include user identity and role
 */
export const JWT_CONFIG = {
  accessTokenExpiry: parseInt(process.env.JWT_ACCESS_EXPIRY || '900', 10), // 15 minutes
  refreshTokenExpiry: parseInt(process.env.JWT_REFRESH_EXPIRY || '604800', 10), // 7 days
  secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
};

/**
 * Verify JWT secret is configured
 * SECURITY: Secret must be strong and unique per environment
 */
export function validateJWTConfig(): void {
  if (JWT_CONFIG.secret === 'your-secret-key-change-in-production') {
    console.warn(
      '[SECURITY WARNING] JWT_SECRET not configured! Using default insecure secret. ' +
        'Set JWT_SECRET environment variable before deployment.'
    );
  }
}

/**
 * Options for access token signing
 */
export const accessTokenOptions: SignOptions = {
  expiresIn: JWT_CONFIG.accessTokenExpiry,
  algorithm: 'HS256',
};

/**
 * Options for refresh token signing
 */
export const refreshTokenOptions: SignOptions = {
  expiresIn: JWT_CONFIG.refreshTokenExpiry,
  algorithm: 'HS256',
};

/**
 * Options for token verification
 */
export const tokenVerifyOptions: VerifyOptions = {
  algorithms: ['HS256'],
};

/**
 * Generate a JWT token with payload
 * @param payload - Claims to include in token
 * @param options - Signing options (expiresIn, etc)
 * @returns Encoded JWT token
 * SECURITY-08: Payload includes user identity for authorization checks
 */
export async function generateToken(
  payload: Partial<JWTPayload>,
  options: SignOptions = accessTokenOptions
): Promise<string> {
  // Lazy import to avoid loading jwt if not needed
  const jwt = await import('jsonwebtoken');
  return new Promise((resolve, reject) => {
    jwt.sign(payload, JWT_CONFIG.secret, options, (err, token) => {
      if (err) reject(err);
      else resolve(token as string);
    });
  });
}

/**
 * Verify a JWT token and return decoded payload
 * @param token - JWT to verify
 * @returns Decoded payload if valid
 * @throws Error if token is invalid, expired, or tampered
 * SECURITY-08: Returns decoded token for authorization decisions
 */
export async function verifyToken(token: string): Promise<JWTPayload> {
  const jwt = await import('jsonwebtoken');
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_CONFIG.secret, tokenVerifyOptions, (err, decoded) => {
      if (err) reject(err);
      else resolve(decoded as JWTPayload);
    });
  });
}

/**
 * Decode a token WITHOUT verifying signature
 * Use only for debugging/logging, never for security decisions
 * @param token - JWT to decode
 * @returns Decoded payload
 */
export async function decodeToken(token: string): Promise<JWTPayload | null> {
  const jwt = await import('jsonwebtoken');
  return jwt.decode(token) as JWTPayload | null;
}

/**
 * Generate both access and refresh tokens
 * @param payload - User claims
 * @returns Token pair with expiry
 * SECURITY-08: Separate access/refresh tokens for better security
 */
export async function generateTokenPair(payload: Partial<JWTPayload>): Promise<TokenPair> {
  const accessPayload = { ...payload, type: 'access' as const };
  const refreshPayload = { ...payload, type: 'refresh' as const };

  const [accessToken, refreshToken] = await Promise.all([
    generateToken(accessPayload, accessTokenOptions),
    generateToken(refreshPayload, refreshTokenOptions),
  ]);

  return {
    accessToken,
    refreshToken,
    expiresIn: JWT_CONFIG.accessTokenExpiry,
  };
}
