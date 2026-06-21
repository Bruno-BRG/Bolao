import { addDays } from "@/lib/date";
import { hashToken } from "@/lib/crypto";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import type { User } from "@/types/domain";

export async function findUserByUsername(username: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .select("id, username, password_hash, created_at")
    .eq("username", username)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function findUserById(id: string): Promise<User | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .select("id, username, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createUser(username: string, passwordHash: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .insert({ username, password_hash: passwordHash })
    .select("id, username, created_at")
    .single();

  if (error) throw error;
  return data as User;
}

export async function createSession(userId: string, token: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("sessions").insert({
    user_id: userId,
    session_token_hash: hashToken(token),
    expires_at: addDays(new Date(), 30).toISOString()
  });

  if (error) throw error;
}

export async function findSessionUser(token: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("sessions")
    .select("user_id")
    .eq("session_token_hash", hashToken(token))
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return findUserById(data.user_id);
}

export async function updateUserPassword(username: string, passwordHash: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
    .eq("username", username)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function revokeSession(token: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("session_token_hash", hashToken(token));

  if (error) throw error;
}
