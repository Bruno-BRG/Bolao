#!/usr/bin/env node
/**
 * Importa JSON exportado (array de linhas) para o Postgres Railway.
 * Uso: node scripts/import-json-to-railway.mjs tournaments .migration-data/tournaments.json
 */

import { readFileSync } from "node:fs";
import pg from "pg";

const table = process.argv[2];
const file = process.argv[3];

if (!table || !file) {
  console.error("Uso: node scripts/import-json-to-railway.mjs <tabela> <arquivo.json>");
  process.exit(1);
}

const password = process.env.RAILWAY_DB_PASSWORD;
if (!password) {
  console.error("Defina RAILWAY_DB_PASSWORD");
  process.exit(1);
}

const client = new pg.Client({
  host: process.env.RAILWAY_DB_HOST ?? "reseau.proxy.rlwy.net",
  port: Number(process.env.RAILWAY_DB_PORT ?? 56819),
  user: process.env.RAILWAY_DB_USER ?? "postgres",
  password,
  database: process.env.RAILWAY_DB_NAME ?? "railway",
  ssl: { rejectUnauthorized: false }
});

const rows = JSON.parse(readFileSync(file, "utf8"));
if (!Array.isArray(rows) || rows.length === 0) {
  console.log(`${table}: 0 linhas`);
  process.exit(0);
}

await client.connect();

const columns = Object.keys(rows[0]);
const colList = columns.map((c) => `"${c}"`).join(", ");

for (const row of rows) {
  const values = columns.map((_, i) => `$${i + 1}`);
  const params = columns.map((col) => row[col]);
  await client.query(
    `INSERT INTO ${table} (${colList}) VALUES (${values.join(", ")})`,
    params
  );
}

console.log(`${table}: ${rows.length} linhas importadas`);
await client.end();
