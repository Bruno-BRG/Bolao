export function isValidAdminToken(token: string) {
  const expected = process.env.ADMIN_SYNC_TOKEN;
  if (!expected) return false;
  return token.trim() === expected.trim();
}
