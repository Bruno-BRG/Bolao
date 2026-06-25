import { addDays } from "@/lib/date";
import { hashToken } from "@/lib/crypto";
import { query } from "@/lib/db";
import type { User } from "@/types/domain";

export async function findUserByUsername(username: string) {
  const { rows } = await query<{
    id: string;
    username: string;
    password_hash: string;
    created_at: string;
  }>(
    `SELECT id, username, password_hash, created_at
     FROM users
     WHERE username = $1
     LIMIT 1`,
    [username]
  );

  return rows[0] ?? null;
}

export async function findUserById(id: string): Promise<User | null> {
  const { rows } = await query<User>(
    `SELECT id, username, created_at
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [id]
  );

  return rows[0] ?? null;
}

export async function createUser(username: string, passwordHash: string) {
  const { rows } = await query<User>(
    `INSERT INTO users (username, password_hash)
     VALUES ($1, $2)
     RETURNING id, username, created_at`,
    [username, passwordHash]
  );

  return rows[0];
}

export async function createSession(userId: string, token: string) {
  await query(
    `INSERT INTO sessions (user_id, session_token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, hashToken(token), addDays(new Date(), 30).toISOString()]
  );
}

export async function findSessionUser(token: string) {
  const { rows } = await query<{ user_id: string }>(
    `SELECT user_id
     FROM sessions
     WHERE session_token_hash = $1
       AND revoked_at IS NULL
       AND expires_at > NOW()
     LIMIT 1`,
    [hashToken(token)]
  );

  const session = rows[0];
  if (!session) return null;
  return findUserById(session.user_id);
}

export async function updateUserPassword(username: string, passwordHash: string) {
  const { rows } = await query<{ id: string }>(
    `UPDATE users
     SET password_hash = $1, updated_at = NOW()
     WHERE username = $2
     RETURNING id`,
    [passwordHash, username]
  );

  return rows[0] ?? null;
}

export async function revokeSession(token: string) {
  await query(
    `UPDATE sessions
     SET revoked_at = NOW()
     WHERE session_token_hash = $1`,
    [hashToken(token)]
  );
}
