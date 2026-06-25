#!/usr/bin/env node
/**
 * Migra dados Supabase -> Railway via REST API + pg (sem psql/docker).
 *
 * PowerShell:
 *   $env:SUPABASE_URL='https://nyaruggyjouhbklaxofp.supabase.co'
 *   $env:SUPABASE_SERVICE_ROLE_KEY='sua-service-role-key'
 *   $env:RAILWAY_DB_PASSWORD='sua-senha-railway'
 *   node scripts/migrate-supabase-to-railway.mjs
 */

import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const TABLES = [
  "tournaments",
  "teams_cache",
  "users",
  "matches_cache",
  "groups_cache",
  "sessions",
  "user_predictions",
  "ranking_snapshots",
  "sync_logs"
];

const PAGE_SIZE = 500;

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Defina ${name}`);
  return value;
}

function createSupabase() {
  return createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function createRailway() {
  return new pg.Client({
    host: process.env.RAILWAY_DB_HOST ?? "reseau.proxy.rlwy.net",
    port: Number(process.env.RAILWAY_DB_PORT ?? 56819),
    user: process.env.RAILWAY_DB_USER ?? "postgres",
    password: requireEnv("RAILWAY_DB_PASSWORD"),
    database: process.env.RAILWAY_DB_NAME ?? "railway",
    ssl: { rejectUnauthorized: false }
  });
}

async function fetchAll(supabase, table) {
  const rows = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(`${table} read: ${error.message}`);
    if (!data?.length) break;

    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
    process.stdout.write(`  ${table}: ${rows.length} lidas...\r`);
  }

  return rows;
}

async function truncateRailway(dest) {
  console.log("Limpando tabelas no Railway...");
  await dest.query(`
    TRUNCATE
      sessions,
      user_predictions,
      ranking_snapshots,
      sync_logs,
      matches_cache,
      groups_cache,
      teams_cache,
      users,
      tournaments
    RESTART IDENTITY CASCADE
  `);
}

async function insertRows(dest, table, rows) {
  if (!rows.length) {
    console.log(`  ${table}: 0 linhas`);
    return;
  }

  const columns = Object.keys(rows[0]);
  const colList = columns.map((c) => `"${c}"`).join(", ");

  for (const row of rows) {
    const values = columns.map((_, i) => `$${i + 1}`);
    const params = columns.map((col) => {
      const value = row[col];
      if (value !== null && typeof value === "object") {
        return JSON.stringify(value);
      }
      return value;
    });
    await dest.query(
      `INSERT INTO ${table} (${colList}) VALUES (${values.join(", ")})`,
      params
    );
  }

  console.log(`  ${table}: ${rows.length} linhas copiadas`);
}

async function main() {
  const supabase = createSupabase();
  const dest = createRailway();
  await dest.connect();
  await dest.query("select 1");
  console.log("Railway: conectado");

  await truncateRailway(dest);

  console.log("\nExportando do Supabase e importando...");
  for (const table of TABLES) {
    const rows = await fetchAll(supabase, table);
    await insertRows(dest, table, rows);
  }

  console.log("\nContagens finais no Railway:");
  for (const table of TABLES) {
    const { rows } = await dest.query(`SELECT count(*)::int AS n FROM ${table}`);
    console.log(`  ${table}: ${rows[0].n}`);
  }

  await dest.end();
  console.log("\nMigracao concluida.");
}

main().catch((error) => {
  console.error("\nErro:", error.message);
  process.exit(1);
});
