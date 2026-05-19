import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users, type User, type NewUser } from '@/db/schema';
import { hashPassword, verifyPassword } from '@/lib/password';
import { signAccessToken, signRefreshToken } from '@/lib/tokens';
import type { GoogleUserInfo } from '@/lib/google-oauth';
import type { RegisterInput, LoginInput } from './auth.schemas';

export class AuthError extends Error {
  constructor(
    public readonly code:
      | 'EMAIL_TAKEN'
      | 'INVALID_CREDENTIALS'
      | 'USER_NOT_FOUND'
      | 'PASSWORD_NOT_SET',
    message: string,
  ) {
    super(message);
  }
}

export interface AuthResult {
  user: Omit<User, 'passwordHash'>;
  accessToken: string;
  refreshToken: string;
}

function stripPassword(user: User): Omit<User, 'passwordHash'> {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

async function issueTokens(user: User): Promise<AuthResult> {
  const accessToken = await signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });
  const refreshToken = await signRefreshToken(user.id);

  return {
    user: stripPassword(user),
    accessToken,
    refreshToken,
  };
}

export async function registerWithPassword(input: RegisterInput): Promise<AuthResult> {
  const existing = await db.query.users.findFirst({
    where: eq(users.email, input.email),
  });

  if (existing) {
    throw new AuthError('EMAIL_TAKEN', 'A user with this email already exists');
  }

  const passwordHash = await hashPassword(input.password);

  const inserted: NewUser = {
    email: input.email,
    name: input.name,
    role: input.role,
    passwordHash,
  };

  const [created] = await db.insert(users).values(inserted).returning();
  if (!created) {
    throw new Error('Failed to create user');
  }

  return issueTokens(created);
}

export async function loginWithPassword(input: LoginInput): Promise<AuthResult> {
  const user = await db.query.users.findFirst({
    where: eq(users.email, input.email),
  });

  if (!user) {
    throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password');
  }

  if (!user.passwordHash) {
    throw new AuthError(
      'PASSWORD_NOT_SET',
      'This account uses Google sign-in. Please log in with Google.',
    );
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password');
  }

  return issueTokens(user);
}

export async function refreshSession(userId: string): Promise<AuthResult> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    throw new AuthError('USER_NOT_FOUND', 'User no longer exists');
  }

  return issueTokens(user);
}

export async function loginOrRegisterWithGoogle(profile: GoogleUserInfo): Promise<AuthResult> {
  const existingByGoogleId = await db.query.users.findFirst({
    where: eq(users.googleId, profile.id),
  });

  if (existingByGoogleId) {
    return issueTokens(existingByGoogleId);
  }

  const existingByEmail = await db.query.users.findFirst({
    where: eq(users.email, profile.email),
  });

  if (existingByEmail) {
    const [updated] = await db
      .update(users)
      .set({
        googleId: profile.id,
        avatarUrl: existingByEmail.avatarUrl ?? profile.picture ?? null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existingByEmail.id))
      .returning();

    if (!updated) throw new Error('Failed to link Google account');
    return issueTokens(updated);
  }

  const [created] = await db
    .insert(users)
    .values({
      email: profile.email,
      name: profile.name,
      googleId: profile.id,
      avatarUrl: profile.picture ?? null,
      role: 'participant',
    } satisfies NewUser)
    .returning();

  if (!created) throw new Error('Failed to create user via Google');
  return issueTokens(created);
}

export async function getUserById(userId: string): Promise<Omit<User, 'passwordHash'> | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  return user ? stripPassword(user) : null;
}
