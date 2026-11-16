import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { config } from './config';
import type { SessionRow, UserRow } from './db-types';
import { query, withTransaction } from './db';

const TOKEN_BYTES = 32;

export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function newSessionToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString('base64url');
}

export function readCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const trimmed = part.trim();
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    if (trimmed.slice(0, index) !== name) continue;
    try {
      return decodeURIComponent(trimmed.slice(index + 1));
    } catch {
      return null;
    }
  }
  return null;
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(config.session.cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.session.secureCookies,
    maxAge: config.session.ttlDays * 24 * 60 * 60 * 1000,
    path: '/',
    ...(config.session.cookieDomain ? { domain: config.session.cookieDomain } : {}),
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(config.session.cookieName, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.session.secureCookies,
    path: '/',
    ...(config.session.cookieDomain ? { domain: config.session.cookieDomain } : {}),
  });
}

export async function createSession(
  userId: string,
): Promise<{ token: string; session: SessionRow }> {
  const token = newSessionToken();
  const tokenHash = hashSessionToken(token);
  const result = await query<SessionRow>(
    `INSERT INTO sessions (id, user_id, token_hash, expires_at)
     VALUES ($1, $2, $3, now() + make_interval(days => $4))
     RETURNING *`,
    [crypto.randomUUID(), userId, tokenHash, config.session.ttlDays],
  );
  return { token, session: result.rows[0] };
}

export async function createGuestSession(): Promise<{ user: UserRow; token: string }> {
  const token = newSessionToken();
  const tokenHash = hashSessionToken(token);
  const user = await withTransaction(async (client) => {
    const createdAt = await client.query<UserRow>(
      "INSERT INTO users (id, kind) VALUES ($1, 'guest') RETURNING *",
      [crypto.randomUUID()],
    );
    await client.query(
      `INSERT INTO sessions (id, user_id, token_hash, expires_at)
       VALUES ($1, $2, $3, now() + make_interval(days => $4))`,
      [crypto.randomUUID(), createdAt.rows[0].id, tokenHash, config.session.ttlDays],
    );
    return createdAt.rows[0];
  });
  return { user, token };
}

interface SessionJoinRow extends UserRow {
  session_id: string;
  session_token_hash: string;
  session_created_at: Date;
  session_last_seen_at: Date;
  session_expires_at: Date;
}

export async function findSession(
  token: string,
): Promise<{ user: UserRow; session: SessionRow } | null> {
  const result = await query<SessionJoinRow>(
    `SELECT u.*,
            s.id AS session_id,
            s.token_hash AS session_token_hash,
            s.created_at AS session_created_at,
            s.last_seen_at AS session_last_seen_at,
            s.expires_at AS session_expires_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [hashSessionToken(token)],
  );
  const row = result.rows[0];
  if (!row) return null;

  const {
    session_id: sessionId,
    session_token_hash: sessionTokenHash,
    session_created_at: sessionCreatedAt,
    session_last_seen_at: sessionLastSeenAt,
    session_expires_at: sessionExpiresAt,
    ...user
  } = row;

  return {
    user: user as UserRow,
    session: {
      id: sessionId,
      user_id: user.id,
      token_hash: sessionTokenHash,
      created_at: sessionCreatedAt,
      last_seen_at: sessionLastSeenAt,
      expires_at: sessionExpiresAt,
    },
  };
}

async function touchSession(sessionId: string, userId: string): Promise<void> {
  await query(
    `UPDATE sessions
        SET last_seen_at = now(),
            expires_at = CASE
              WHEN expires_at < now() + interval '7 days'
                THEN now() + make_interval(days => $2)
              ELSE expires_at
            END
      WHERE id = $1`,
    [sessionId, config.session.ttlDays],
  );
  await query('UPDATE users SET last_seen_at = now() WHERE id = $1', [userId]);
}

export async function attachSession(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = readCookie(req.headers.cookie, config.session.cookieName);
    if (!token) {
      next();
      return;
    }
    const found = await findSession(token);
    if (!found) {
      next();
      return;
    }
    req.user = found.user;
    req.sessionRow = found.session;
    req.sessionToken = token;

    if (Date.now() - found.session.last_seen_at.getTime() > 60 * 60 * 1000) {
      void touchSession(found.session.id, found.user.id).catch((error) => {
        console.warn('[session] could not update last seen', (error as Error).message);
      });
    }

    next();
  } catch (error) {
    next(error);
  }
}

export async function ensureUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (req.user) {
    next();
    return;
  }
  try {
    const { user, token } = await createGuestSession();
    setSessionCookie(res, token);
    const found = await findSession(token);
    req.user = user;
    req.sessionRow = found?.session;
    req.sessionToken = token;
    next();
  } catch (error) {
    next(error);
  }
}

export async function deleteSessionByToken(token: string): Promise<void> {
  await query('DELETE FROM sessions WHERE token_hash = $1', [hashSessionToken(token)]);
}

export async function deleteSessionsForUser(userId: string): Promise<void> {
  await query('DELETE FROM sessions WHERE user_id = $1', [userId]);
}

export async function rotateSessionForUser(
  res: Response,
  userId: string,
): Promise<void> {
  const { token } = await createSession(userId);
  setSessionCookie(res, token);
}
