import pg from "pg";
import dns from "dns";

const { Pool } = pg;

let pool;

export const getPostgresPool = () => {
  if (pool) return pool;

  // Prefer IPv4 on machines/networks with broken IPv6
  try {
    if (typeof dns.setDefaultResultOrder === "function") {
      dns.setDefaultResultOrder("ipv4first");
    }
  } catch {
    // ignore
  }

  const connectionString =
    process.env.SUPABASE_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL;

  if (!connectionString) {
    throw new Error(
      "Missing Postgres connection string. Set SUPABASE_DATABASE_URL (recommended) or DATABASE_URL.",
    );
  }

  const familyEnv = (process.env.PG_FAMILY || "").toString().trim();
  const family = familyEnv ? Number(familyEnv) : undefined;

  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: Number(process.env.PG_POOL_MAX || 10),
    ...(family === 4 || family === 6 ? { family } : {}),
  });

  pool.on("error", (err) => {
    console.warn("⚠️  Postgres pool error:", err?.message || err);
  });

  return pool;
};
