import { Request, Response, NextFunction } from 'express';
import Tokens from 'csrf';

const tokens = new Tokens();
const CSRF_SECRET_COOKIE = 'csrfSecret';
const CSRF_TOKEN_HEADER = 'x-csrf-token';

export function generateCsrf(req: Request, res: Response, next: NextFunction) {
  let secret = req.cookies[CSRF_SECRET_COOKIE];
  if (!secret) {
    secret = tokens.secretSync();
    res.cookie(CSRF_SECRET_COOKIE, secret, { httpOnly: true, sameSite: 'strict' });
  }
  req.csrfToken = () => tokens.create(secret!);
  next();
}

export function verifyCsrf(req: Request, res: Response, next: NextFunction) {
  const secret = req.cookies[CSRF_SECRET_COOKIE];
  const token = req.headers[CSRF_TOKEN_HEADER] || req.body?.csrfToken || req.query?.csrfToken;
  if (!secret || !token || !tokens.verify(secret, token as string)) {
    return res.status(403).json({ message: 'Invalid CSRF token' });
  }
  next();
}

declare global {
  namespace Express {
    interface Request {
      csrfToken?: () => string;
    }
  }
}
