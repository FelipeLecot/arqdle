import crypto from 'node:crypto';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { config } from './config';
import type { GoogleIdentity, OAuthStateRow, OAuthAccountRow, UserRow } from './db-types';
import { query, withTransaction } from './db';
import { ApiError } from './errors';
import { mergeGuestIntoUser } from './merge';

const GOOGLE_AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];
const GOOGLE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/oauth2/v3/certs'),
);

export function isGoogleConfigured(): boolean {
  return config.google.enabled;
}

function hashState(state: string): string {
  return crypto.createHash('sha256').update(state).digest('hex');
}

export function safeRedirect(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    value.length > 500
  ) {
    return '/';
  }
  return value;
}

export function buildGoogleAuthorizationUrl(
  state: string,
  codeChallenge: string,
  nonce: string,
): string {
  const url = new URL(GOOGLE_AUTHORIZE_URL);
  url.search = new URLSearchParams({
    client_id: config.google.clientId,
    redirect_uri: config.google.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  }).toString();
  return url.toString();
}

export async function createOAuthState(
  userId: string,
  redirectTo: string,
): Promise<{ state: string; codeChallenge: string; nonce: string }> {
  const state = crypto.randomBytes(32).toString('base64url');
  const verifier = crypto.randomBytes(48).toString('base64url');
  const nonce = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');

  await query('DELETE FROM oauth_states WHERE expires_at < now()');
  await query(
    `INSERT INTO oauth_states
       (state_hash, code_verifier, nonce, user_id, redirect_to, expires_at)
     VALUES ($1, $2, $3, $4, $5, now() + interval '10 minutes')`,
    [hashState(state), verifier, nonce, userId, safeRedirect(redirectTo)],
  );

  return { state, codeChallenge: challenge, nonce };
}

export async function consumeOAuthState(state: string): Promise<OAuthStateRow | null> {
  const result = await query<OAuthStateRow>(
    'DELETE FROM oauth_states WHERE state_hash = $1 RETURNING *',
    [hashState(state)],
  );
  const row = result.rows[0];
  if (!row) return null;
  if (row.expires_at.getTime() <= Date.now()) return null;
  return row;
}

export async function exchangeGoogleCode(
  code: string,
  verifier: string,
  expectedNonce: string,
): Promise<GoogleIdentity> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.google.clientId,
      client_secret: config.google.clientSecret,
      redirect_uri: config.google.redirectUri,
      grant_type: 'authorization_code',
      code_verifier: verifier,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new ApiError(401, 'auth_failed', 'Google did not accept the sign-in code.');
  }

  const tokens = (await response.json()) as { id_token?: unknown };
  if (typeof tokens.id_token !== 'string') {
    throw new ApiError(401, 'auth_failed', 'Google did not return an identity token.');
  }

  let payload: Record<string, unknown>;
  try {
    const verified = await jwtVerify(tokens.id_token, GOOGLE_JWKS, {
      issuer: GOOGLE_ISSUERS,
      audience: config.google.clientId,
      clockTolerance: 30,
    });
    payload = verified.payload as Record<string, unknown>;
  } catch {
    throw new ApiError(401, 'auth_failed', 'The Google identity token is not valid.');
  }

  if (payload.nonce !== expectedNonce) {
    throw new ApiError(401, 'auth_failed', 'The Google sign-in response did not match.');
  }
  if (payload.email_verified !== true && payload.email_verified !== 'true') {
    throw new ApiError(401, 'auth_failed', 'The Google email address is not verified.');
  }
  if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') {
    throw new ApiError(401, 'auth_failed', 'Google did not return an email address.');
  }

  return {
    sub: payload.sub,
    email: payload.email.toLowerCase(),
    emailVerified: true,
    name: typeof payload.name === 'string' ? payload.name : undefined,
    picture: typeof payload.picture === 'string' ? payload.picture : undefined,
    locale: typeof payload.locale === 'string' ? payload.locale : undefined,
  };
}

async function findUserForUpdate(
  client: import('pg').PoolClient,
  id: string,
): Promise<UserRow | null> {
  const result = await client.query<UserRow>(
    'SELECT * FROM users WHERE id = $1 FOR UPDATE',
    [id],
  );
  return result.rows[0] ?? null;
}

/**
 * Find or create the Google profile, then merge guest progress into it.
 * OAuth tokens are never stored; only the stable Google subject is linked.
 */
export async function signInWithGoogleIdentity(
  identity: GoogleIdentity,
  guestId: string | null,
): Promise<UserRow> {
  if (!identity.emailVerified) {
    throw new ApiError(401, 'auth_failed', 'The Google email address is not verified.');
  }
  return withTransaction(async (client) => {
    // Serialize concurrent sign-ins for the same Google subject.
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1)::bigint)', [
      `google:${identity.sub}`,
    ]);
    const account = await client.query<OAuthAccountRow>(
      `SELECT * FROM oauth_accounts
        WHERE provider = 'google' AND provider_account_id = $1
        FOR UPDATE`,
      [identity.sub],
    );

    let target: UserRow | null = null;

    if (account.rows[0]) {
      target = await findUserForUpdate(client, account.rows[0].user_id);
    } else {
      const byEmail = await client.query<UserRow>(
        'SELECT * FROM users WHERE lower(email) = lower($1) FOR UPDATE',
        [identity.email],
      );
      target = byEmail.rows[0] ?? null;

      if (!target && guestId) {
        const guest = await findUserForUpdate(client, guestId);
        if (guest?.kind === 'guest') target = guest;
      }

      if (!target) {
        const created = await client.query<UserRow>(
          `INSERT INTO users
             (id, kind, email, email_verified, name, picture_url, locale)
           VALUES ($1, 'google', $2, true, $3, $4, $5)
           RETURNING *`,
          [
            crypto.randomUUID(),
            identity.email,
            identity.name ?? null,
            identity.picture ?? null,
            identity.locale ?? null,
          ],
        );
        target = created.rows[0];
      }

      await client.query(
        `INSERT INTO oauth_accounts
           (id, user_id, provider, provider_account_id, email)
         VALUES ($1, $2, 'google', $3, $4)
         ON CONFLICT (provider, provider_account_id) DO NOTHING`,
        [crypto.randomUUID(), target.id, identity.sub, identity.email],
      );
    }

    if (!target) {
      throw new Error('Could not resolve a user for Google sign-in.');
    }

    if (target.kind === 'guest') {
      const upgraded = await client.query<UserRow>(
        `UPDATE users
            SET kind = 'google',
                email = $2,
                email_verified = true,
                name = $3,
                picture_url = $4,
                locale = $5,
                updated_at = now()
          WHERE id = $1
          RETURNING *`,
        [
          target.id,
          identity.email,
          identity.name ?? null,
          identity.picture ?? null,
          identity.locale ?? null,
        ],
      );
      target = upgraded.rows[0];
    } else {
      const updated = await client.query<UserRow>(
        `UPDATE users
            SET email = $2,
                email_verified = true,
                name = COALESCE($3, name),
                picture_url = COALESCE($4, picture_url),
                locale = COALESCE($5, locale),
                updated_at = now()
          WHERE id = $1
          RETURNING *`,
        [
          target.id,
          identity.email,
          identity.name ?? null,
          identity.picture ?? null,
          identity.locale ?? null,
        ],
      );
      target = updated.rows[0];
    }

    if (guestId && guestId !== target.id) {
      await mergeGuestIntoUser(client, guestId, target.id);
    }

    const final = await client.query<UserRow>('SELECT * FROM users WHERE id = $1', [
      target.id,
    ]);
    return final.rows[0];
  });
}
