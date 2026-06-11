import { cache } from "react";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/constants";
import { findSessionUser } from "@/repositories/auth.repo";

export const getCurrentUser = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    return await findSessionUser(token);
  } catch {
    return null;
  }
});

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}
