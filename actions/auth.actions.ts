"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken } from "@/lib/crypto";
import { SESSION_COOKIE } from "@/lib/constants";
import {
  createSession,
  createUser,
  findUserByUsername,
  revokeSession
} from "@/repositories/auth.repo";
import { normalizeUsername } from "@/services/auth.service";

function validateCredentials(formData: FormData) {
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const password = String(formData.get("password") ?? "");

  if (!/^[a-z0-9_.-]{3,24}$/.test(username)) {
    throw new Error("Use um nome com 3 a 24 caracteres: letras, numeros, ., _ ou -.");
  }

  if (password.length < 6 || password.length > 72) {
    throw new Error("A senha precisa ter entre 6 e 72 caracteres.");
  }

  return { username, password };
}

async function setSessionCookie(userId: string) {
  const token = createSessionToken();
  await createSession(userId, token);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export async function registerAction(formData: FormData) {
  try {
    const { username, password } = validateCredentials(formData);
    const existing = await findUserByUsername(username);
    if (existing) throw new Error("Esse nome de usuario ja esta em uso.");

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await createUser(username, passwordHash);
    await setSessionCookie(user.id);
  } catch (error) {
    redirect(`/login?error=${encodeURIComponent((error as Error).message)}`);
  }

  redirect("/palpites");
}

export async function loginAction(formData: FormData) {
  try {
    const { username, password } = validateCredentials(formData);
    const user = await findUserByUsername(username);
    if (!user) throw new Error("Usuario ou senha invalidos.");

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new Error("Usuario ou senha invalidos.");

    await setSessionCookie(user.id);
  } catch (error) {
    redirect(`/login?error=${encodeURIComponent((error as Error).message)}`);
  }

  redirect("/palpites");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await revokeSession(token).catch(() => undefined);
  }
  cookieStore.delete(SESSION_COOKIE);
  redirect("/");
}
