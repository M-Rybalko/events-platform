import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { randomBytes } from 'node:crypto';
import { env } from '@/config/env';
import { requireAuth, type AuthVariables } from '@/middleware/auth.middleware';
import { REFRESH_TTL_SECONDS, verifyRefreshToken } from '@/lib/tokens';
import {
  buildGoogleAuthUrl,
  exchangeCodeForToken,
  fetchGoogleUser,
  isGoogleOAuthConfigured,
} from '@/lib/google-oauth';
import { registerSchema, loginSchema } from './auth.schemas';
import {
  AuthError,
  registerWithPassword,
  loginWithPassword,
  refreshSession,
  loginOrRegisterWithGoogle,
  getUserById,
} from './auth.service';

const REFRESH_COOKIE = 'refresh_token';
const OAUTH_STATE_COOKIE = 'oauth_state';

function setRefreshCookie(c: Parameters<typeof setCookie>[0], token: string) {
  setCookie(c, REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/',
    maxAge: REFRESH_TTL_SECONDS,
  });
}

function authErrorStatus(err: AuthError): 400 | 401 | 404 | 409 {
  switch (err.code) {
    case 'EMAIL_TAKEN':
      return 409;
    case 'INVALID_CREDENTIALS':
    case 'PASSWORD_NOT_SET':
      return 401;
    case 'USER_NOT_FOUND':
      return 404;
  }
}

export const authRoutes = new Hono<{ Variables: AuthVariables }>();

authRoutes.post('/register', zValidator('json', registerSchema), async (c) => {
  const input = c.req.valid('json');
  try {
    const { user, accessToken, refreshToken } = await registerWithPassword(input);
    setRefreshCookie(c, refreshToken);
    return c.json({ user, accessToken }, 201);
  } catch (err) {
    if (err instanceof AuthError) {
      return c.json({ error: err.message, code: err.code }, authErrorStatus(err));
    }
    throw err;
  }
});

authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  const input = c.req.valid('json');
  try {
    const { user, accessToken, refreshToken } = await loginWithPassword(input);
    setRefreshCookie(c, refreshToken);
    return c.json({ user, accessToken });
  } catch (err) {
    if (err instanceof AuthError) {
      return c.json({ error: err.message, code: err.code }, authErrorStatus(err));
    }
    throw err;
  }
});

authRoutes.post('/refresh', async (c) => {
  const token = getCookie(c, REFRESH_COOKIE);
  if (!token) {
    return c.json({ error: 'Missing refresh token' }, 401);
  }

  try {
    const payload = await verifyRefreshToken(token);
    const { user, accessToken, refreshToken } = await refreshSession(payload.sub);
    setRefreshCookie(c, refreshToken);
    return c.json({ user, accessToken });
  } catch (err) {
    if (err instanceof AuthError) {
      return c.json({ error: err.message, code: err.code }, authErrorStatus(err));
    }
    return c.json({ error: 'Invalid or expired refresh token' }, 401);
  }
});

authRoutes.post('/logout', async (c) => {
  deleteCookie(c, REFRESH_COOKIE, { path: '/' });
  return c.json({ ok: true });
});

authRoutes.get('/me', requireAuth, async (c) => {
  const claims = c.get('user');
  const user = await getUserById(claims.sub);
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  return c.json({ user });
});

authRoutes.get('/google', (c) => {
  if (!isGoogleOAuthConfigured()) {
    return c.json({ error: 'Google OAuth is not configured on this server' }, 503);
  }

  const state = randomBytes(16).toString('hex');
  setCookie(c, OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/',
    maxAge: 10 * 60,
  });

  return c.redirect(buildGoogleAuthUrl(state));
});

authRoutes.get('/google/callback', async (c) => {
  if (!isGoogleOAuthConfigured()) {
    return c.json({ error: 'Google OAuth is not configured on this server' }, 503);
  }

  const code = c.req.query('code');
  const state = c.req.query('state');
  const savedState = getCookie(c, OAUTH_STATE_COOKIE);

  deleteCookie(c, OAUTH_STATE_COOKIE, { path: '/' });

  if (!code) {
    return c.redirect(`${env.FRONTEND_ORIGIN}/login?error=missing_code`);
  }
  if (!state || !savedState || state !== savedState) {
    return c.redirect(`${env.FRONTEND_ORIGIN}/login?error=state_mismatch`);
  }

  try {
    const googleAccessToken = await exchangeCodeForToken(code);
    const profile = await fetchGoogleUser(googleAccessToken);

    if (!profile.verified_email) {
      return c.redirect(`${env.FRONTEND_ORIGIN}/login?error=email_not_verified`);
    }

    const { accessToken, refreshToken } = await loginOrRegisterWithGoogle(profile);
    setRefreshCookie(c, refreshToken);

    return c.redirect(`${env.FRONTEND_ORIGIN}/oauth/callback?token=${accessToken}`);
  } catch (err) {
    console.error('Google OAuth callback failed:', err);
    return c.redirect(`${env.FRONTEND_ORIGIN}/login?error=oauth_failed`);
  }
});
