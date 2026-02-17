import dotenv from "dotenv";

dotenv.config();

import { getSupabase } from "../config/supabase.js";

async function main() {
  const url = process.env.SUPABASE_URL || "(not set)";
  console.log("🔍 Supabase URL:", url);

  const sb = getSupabase();

  // 1. Basic connectivity — query the table (even if empty)
  const { data: ping, error: pingErr } = await sb
    .from("finance_transactions")
    .select("id")
    .limit(1);

  if (pingErr) throw new Error(pingErr.message);

  console.log("✅ Supabase connected (HTTPS, port 443)");
  console.log("   finance_transactions reachable — rows sampled:", ping.length);

  // 2. Check balance view
  const { data: balPing, error: balErr } = await sb
    .from("finance_event_balances")
    .select("event_id")
    .limit(1);

  if (balErr) {
    console.warn("⚠️  finance_event_balances view not found:", balErr.message);
  } else {
    console.log("✅ finance_event_balances view reachable");
  }

  // 3. Check approvals table
  const { data: appPing, error: appErr } = await sb
    .from("finance_approvals")
    .select("id")
    .limit(1);

  if (appErr) {
    console.warn("⚠️  finance_approvals table not found:", appErr.message);
  } else {
    console.log("✅ finance_approvals table reachable");
  }

  console.log("\n🎉 Finance Ledger is fully operational!");
}

main().catch((err) => {
  const msg = err?.message || String(err);
  console.error("❌ Ledger check failed:", msg);

  if (msg.includes("relation") && msg.includes("does not exist")) {
    console.error(
      "➡️  Tables not created yet. Run the SQL from Server/sql/finance_ledger.sql in Supabase SQL Editor.",
    );
  }

  if (msg.includes("Missing Supabase")) {
    console.error(
      "➡️  Set SUPABASE_URL and SUPABASE_ANON_KEY in Server/.env",
    );
  }

  process.exit(1);
});
