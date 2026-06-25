#!/usr/bin/env node
/**
 * Gera um JWT service_role compativel com PostgREST / supabase-js.
 *
 * Uso:
 *   node scripts/generate-service-role-jwt.mjs
 *   JWT_SECRET=meu-segredo node scripts/generate-service-role-jwt.mjs
 */

import { createHmac } from "node:crypto";

const secret =
  process.env.JWT_SECRET ??
  "bolao-railway-jwt-secret-change-me-in-production-32chars";

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

function signJwt(payload) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signature = createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url");
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

const now = Math.floor(Date.now() / 1000);
const token = signJwt({
  role: "service_role",
  iss: "bolao",
  iat: now,
  exp: now + 60 * 60 * 24 * 365 * 10
});

console.log(token);
