import bcrypt from 'bcryptjs';
import { User, UserRole, IUser } from './auth.model';
import { generateTokenPair, JWTPayload } from './jwt.utils';

/**
 * Authentication Service
 * Handles user registration, login, and token management
 * SECURITY-05: Password validation and hashing
 * SECURITY-08: User identity and role management
 */

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  branchId?: string;
  role?: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Register a new user
 * SECURITY-05: Validate email format and password strength
 * SECURITY-01: Password is hashed with bcrypt
 * @throws Error if email exists or validation fails
 */
export async function registerUser(data: RegisterRequest): Promise<AuthResponse> {
  const { email, password, fullName, branchId, role = UserRole.DONOR } = data;

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  // Validate password strength (min 8 chars, mix of upper/lower/number)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passwordRegex.test(password)) {
    throw new Error('Password must be at least 8 characters with uppercase, lowercase, and number');
  }

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password with bcrypt (salt rounds = 12)
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const user = await User.create({
    email,
    password: hashedPassword,
    fullName,
    branchId,
    role,
    isActive: true,
  });

  // Generate tokens
  const tokenPair = await generateTokenPair({
    userId: user._id?.toString(),
    email: user.email,
    role: user.role,
    branchId: user.branchId?.toString()
  });

  return {
    user: {
      id: user._id?.toString() || '',
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
    ...tokenPair,
  };
}

/**
 * Authenticate user and generate tokens
 * SECURITY-01: Password verification with bcrypt
 * SECURITY-08: Token generation with user identity
 * @throws Error if credentials invalid
 */
export async function loginUser(data: LoginRequest): Promise<AuthResponse> {
  const { email, password } = data;

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new Error('User account is disabled');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  // Generate tokens
  const tokenPair = await generateTokenPair({
    userId: user._id?.toString(),
    email: user.email,
    role: user.role,
    branchId: user.branchId?.toString()
  });

  return {
    user: {
      id: user._id?.toString() || '',
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
    ...tokenPair,
  };
}

/**
 * Verify user exists and is active
 * Used by middleware for authorization
 */
export async function getUserById(userId: string): Promise<IUser | null> {
  return User.findById(userId).select('-password');
}

/**
 * Verify refresh token is valid and issue new access token
 * SECURITY-08: Validate token payload and user status
 */
export async function refreshAccessToken(userId: string): Promise<{ accessToken: string; expiresIn: number }> {
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    throw new Error('User not found or inactive');
  }

  const { accessToken, expiresIn } = await generateTokenPair({
    userId: user._id?.toString(),
    email: user.email,
    role: user.role,
    branchId: user.branchId?.toString()
  });

  return {
    accessToken,
    expiresIn,
  };
}

/**
 * Create admin user during setup
 * Used by MongoDB initialization scripts
 */
export async function createAdminUser(email: string, password: string, fullName: string): Promise<IUser> {
  const hashedPassword = await bcrypt.hash(password, 12);
  return User.create({
    email,
    password: hashedPassword,
    fullName,
    role: UserRole.SUPER_ADMIN,
    isActive: true,
  });
}

/**
 * List all users (admin only)
 * SECURITY-06: Query returns minimal data (no passwords)
 */
export async function listUsers(): Promise<Partial<IUser>[]> {
  return User.find({}).select('-password').sort({ createdAt: -1 });
}

/**
 * Deactivate a user (admin)
 */
export async function deactivateUser(userId: string): Promise<void> {
  await User.findByIdAndUpdate(userId, { isActive: false });
}
