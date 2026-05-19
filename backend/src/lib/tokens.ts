import { sign, verify } from 'hono/jwt';
import type { JWTPayload } from 'hono/utils/jwt/types';
import { env } from '@/config/env';

const JWT_ALG = 'HS256' as const;

export interface AccessTokenPayload extends JWTPayload {
  sub: string;
  email: string;
  role: 'participant' | 'organizer' | 'admin';
  type: 'access';
}

export interface RefreshTokenPayload extends JWTPayload {
  sub: string;
  type: 'refresh';
}

function ttlToSeconds(ttl: string): number {
  const match = ttl.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid TTL format: ${ttl}`);
  const [, valueStr, unit] = match;
  const value = Number(valueStr);
  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 60 * 60 * 24;
    default:
      throw new Error(`Invalid TTL unit: ${unit}`);
  }
}

export const ACCESS_TTL_SECONDS = ttlToSeconds(env.JWT_ACCESS_TTL);
export const REFRESH_TTL_SECONDS = ttlToSeconds(env.JWT_REFRESH_TTL);

export async function signAccessToken(
  payload: Omit<AccessTokenPayload, 'type' | 'exp' | 'iat'>,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return sign(
    {
      ...payload,
      type: 'access',
      iat: now,
      exp: now + ACCESS_TTL_SECONDS,
    },
    env.JWT_SECRET,
    JWT_ALG,
  );
}

export async function signRefreshToken(userId: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return sign(
    {
      sub: userId,
      type: 'refresh',
      iat: now,
      exp: now + REFRESH_TTL_SECONDS,
    },
    env.JWT_SECRET,
    JWT_ALG,
  );
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const payload = (await verify(token, env.JWT_SECRET, JWT_ALG)) as AccessTokenPayload;
  if (payload.type !== 'access') {
    throw new Error('Invalid token type');
  }
  return payload;
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  const payload = (await verify(token, env.JWT_SECRET, JWT_ALG)) as RefreshTokenPayload;
  if (payload.type !== 'refresh') {
    throw new Error('Invalid token type');
  }
  return payload;
}
