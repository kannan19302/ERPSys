import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function csrfMiddleware(req: Request, res: Response, next: NextFunction) {
  let token = req.cookies?.[CSRF_COOKIE];

  if (!token) {
    token = generateCsrfToken();
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
  }

  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  // Skip CSRF for login/register — no cookie exists yet
  const path = req.path || req.url;
  if (path.includes('/auth/login') || path.includes('/auth/register')) {
    return next();
  }

  // Skip CSRF for public endpoints (web forms, RFQ bids)
  if (path.includes('/public/')) {
    return next();
  }

  const headerToken = req.headers[CSRF_HEADER] as string | undefined;
  if (!headerToken || headerToken !== token) {
    return res.status(403).json({ message: 'Invalid or missing CSRF token' });
  }

  next();
}
