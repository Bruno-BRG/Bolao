import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function createPostgrestFetch(postgrestUrl: string, serviceRoleKey: string) {
  const base = postgrestUrl.replace(/\/$/, "");

  return (input: RequestInfo | URL, init?: RequestInit) => {
    const href =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    const url = new URL(href);
    const path = url.pathname.replace(/^\/rest\/v1/, "") || "/";
    const target = `${base}${path}${url.search}`;

    const headers = new Headers(init?.headers);
    headers.set("apikey", serviceRoleKey);
    headers.set("Authorization", `Bearer ${serviceRoleKey}`);

    return fetch(target, { ...init, headers });
  };
}

export function getSupabaseAdmin(): SupabaseClient {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const postgrestUrl = process.env.POSTGREST_URL;
  const supabaseUrl = process.env.SUPABASE_URL;

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable.");
  }

  // Railway self-hosted: fala com PostgREST interno (nao Supabase cloud).
  if (postgrestUrl) {
    return createClient("http://postgrest.internal", serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        fetch: createPostgrestFetch(postgrestUrl, serviceRoleKey)
      }
    });
  }

  if (!supabaseUrl) {
    throw new Error(
      "Missing POSTGREST_URL (Railway) or SUPABASE_URL (Vercel/Supabase cloud)."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
