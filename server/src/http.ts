import type { NextFunction, Request, Response } from 'express';
import { config } from './config';

export function requestOrigin(req: Request): string {
  if (config.siteUrl) return config.siteUrl;
  const forwarded = req.get('x-forwarded-proto')?.split(',')[0]?.trim();
  return `${forwarded || req.protocol}://${req.get('host') ?? 'localhost'}`;
}

/**
 * SameSite=Lax blocks most cross-site writes. This check adds a second guard
 * for browsers that send an Origin header on state-changing requests.
 */
export function sameOriginOnly(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    next();
    return;
  }
  const origin = req.get('origin');
  if (!origin) {
    next();
    return;
  }

  const allowed = new Set<string>([requestOrigin(req)]);
  if (config.siteUrl) allowed.add(config.siteUrl);

  let originValue: string;
  try {
    originValue = new URL(origin).origin;
  } catch {
    res.status(403).json({
      error: { code: 'forbidden_origin', message: 'The request origin is not allowed.' },
    });
    return;
  }

  const ok = [...allowed].some((candidate) => {
    try {
      return new URL(candidate).origin === originValue;
    } catch {
      return false;
    }
  });

  if (!ok) {
    res.status(403).json({
      error: { code: 'forbidden_origin', message: 'The request origin is not allowed.' },
    });
    return;
  }
  next();
}
