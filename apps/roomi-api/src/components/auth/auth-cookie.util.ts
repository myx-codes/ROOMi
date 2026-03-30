import type { CookieOptions, Request } from 'express';
import { randomBytes } from 'crypto';

export const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? 'roomi_access_token';
export const CSRF_COOKIE_NAME = process.env.CSRF_COOKIE_NAME ?? 'roomi_csrf_token';
export const CSRF_HEADER_NAME = 'x-csrf-token';

const DEFAULT_AUTH_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

const readHeaderValue = (value: string | string[] | undefined): string | null => {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
};

const resolveSameSite = (): CookieOptions['sameSite'] => {
  const sameSiteRaw = (process.env.AUTH_COOKIE_SAME_SITE ?? 'lax').toLowerCase();
  if (sameSiteRaw === 'strict') return 'strict';
  if (sameSiteRaw === 'none') return 'none';
  return 'lax';
};

const isProd = process.env.NODE_ENV === 'production';

const resolveCookieDomain = (): string | undefined => {
  const domain = process.env.AUTH_COOKIE_DOMAIN;
  return domain && domain.trim().length > 0 ? domain : undefined;
};

const resolveCookiePath = (): string => process.env.AUTH_COOKIE_PATH ?? '/';

const resolveMaxAge = (): number => {
  const value = Number(process.env.AUTH_COOKIE_MAX_AGE_MS);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_AUTH_MAX_AGE_MS;
};

export const authCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: isProd,
  sameSite: resolveSameSite(),
  domain: resolveCookieDomain(),
  path: resolveCookiePath(),
  maxAge: resolveMaxAge(),
});

export const csrfCookieOptions = (): CookieOptions => ({
  httpOnly: false,
  secure: isProd,
  sameSite: resolveSameSite(),
  domain: resolveCookieDomain(),
  path: resolveCookiePath(),
  maxAge: resolveMaxAge(),
});

export const clearCookieOptions = (): CookieOptions => ({
  secure: isProd,
  sameSite: resolveSameSite(),
  domain: resolveCookieDomain(),
  path: resolveCookiePath(),
});

export const generateCsrfToken = (): string => randomBytes(24).toString('hex');

const extractBearerFromHeader = (authorization?: string): string | null => {
  if (!authorization) return null;
  const [scheme, token] = authorization.split(' ');
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== 'bearer') return null;
  return token;
};

export const getTokenFromRequest = (request: Request): { token: string | null; source: 'header' | 'cookie' | null } => {
  const headerToken = extractBearerFromHeader(readHeaderValue(request.headers.authorization) ?? undefined);
  if (headerToken) return { token: headerToken, source: 'header' };

  const cookieToken = request.cookies?.[AUTH_COOKIE_NAME] as string | undefined;
  if (cookieToken) return { token: cookieToken, source: 'cookie' };

  return { token: null, source: null };
};

export const isMutationOperation = (context: any): boolean => {
  const info = context?.getArgByIndex?.(3);
  return info?.operation?.operation === 'mutation';
};

export const hasValidCsrf = (request: Request): boolean => {
  const csrfFromCookie = request.cookies?.[CSRF_COOKIE_NAME];
  const headerValue = readHeaderValue(request.headers[CSRF_HEADER_NAME]) ?? readHeaderValue(request.headers['x-xsrf-token']);
  return Boolean(csrfFromCookie && headerValue && csrfFromCookie === headerValue);
};
