import { getSupabase } from "../config/supabase.js";

const normalizeObjectId = (value) => (value || "").toString().trim();

/* ───── CREATE ───── */
export const createTransaction = async ({
  eventId,
  actorUserId,
  direction,
  kind,
  amountCents,
  currency,
  note,
  reason,
  metadata,
  requestId,
}) => {
  const sb = getSupabase();

  const { data, error } = await sb
    .from("finance_transactions")
    .insert({
      event_id: normalizeObjectId(eventId),
      actor_user_id: normalizeObjectId(actorUserId),
      direction,
      kind,
      amount_cents: Math.trunc(Number(amountCents)),
      currency: currency || "INR",
      note: note || null,
      reason: reason || null,
      metadata: metadata || {},
      request_id: requestId || null,
    })
    .select()
    .single();

  if (error) throw new Error(`createTransaction: ${error.message}`);
  return data;
};

/* ───── REVERSE ───── */
export const reverseTransaction = async ({
  referenceTransactionId,
  actorUserId,
  reason,
  requestId,
}) => {
  const sb = getSupabase();

  // Fetch original
  const { data: original, error: fetchErr } = await sb
    .from("finance_transactions")
    .select("*")
    .eq("id", referenceTransactionId)
    .single();

  if (fetchErr || !original) return null;

  const opposite = original.direction === "CREDIT" ? "DEBIT" : "CREDIT";

  const { data, error } = await sb
    .from("finance_transactions")
    .insert({
      event_id: original.event_id,
      actor_user_id: normalizeObjectId(actorUserId),
      direction: opposite,
      kind: "REVERSAL",
      amount_cents: original.amount_cents,
      currency: original.currency,
      note: `Reversal of ${original.id}`,
      reason: reason || "Reversal",
      metadata: { reversalOf: original.id },
      request_id: requestId || null,
      reference_transaction_id: original.id,
    })
    .select()
    .single();

  if (error) throw new Error(`reverseTransaction: ${error.message}`);
  return data;
};

/* ───── LIST ───── */
export const listTransactionsForEvent = async ({ eventId, limit = 50 }) => {
  const sb = getSupabase();

  const { data, error } = await sb
    .from("finance_transactions")
    .select("*")
    .eq("event_id", normalizeObjectId(eventId))
    .order("created_at", { ascending: false })
    .limit(Number(limit));

  if (error) throw new Error(`listTransactions: ${error.message}`);
  return data || [];
};

/* ───── BALANCE ───── */
export const getEventBalance = async ({ eventId, currency = "INR" }) => {
  const sb = getSupabase();
  const eid = normalizeObjectId(eventId);

  // Query the balance view
  const { data, error } = await sb
    .from("finance_event_balances")
    .select("*")
    .eq("event_id", eid)
    .eq("currency", currency)
    .maybeSingle();

  if (error) throw new Error(`getEventBalance: ${error.message}`);

  return data || {
    event_id: eid,
    currency,
    credits_cents: 0,
    debits_cents: 0,
    balance_cents: 0,
  };
};
