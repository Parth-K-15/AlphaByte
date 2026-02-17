# AlphaByte — System Design & Architecture Roadmap (Judge-Ready)

This document lists the **highest-impact production-grade features** to implement (and the best order) so AlphaByte feels like a real system: secure, scalable, reliable, and auditable.

## Goals (What judges should believe)
- The system survives spikes (e.g., many attendance scans at once).
- The system is correct under retries/duplicates (idempotency + uniqueness).
- Sensitive user data remains private even if a DB leak happens.
- Financial/critical actions are traceable and tamper-evident (auditability).
- The architecture has a realistic scaling path (without unnecessary infra).

## Recommended Implementation Order (Do this sequence)

### 0) Baseline Hygiene (quick wins)
**Why:** reduces risk while you add infra-like features.
- Ensure all endpoints have **input validation** and consistent error format.
- Add **request IDs** (attach to logs + responses).
- Add **timeouts** for external calls (AI/OCR) and a safe fallback.

**Done when:** you can trace one request end-to-end using a requestId.

---

### 1) Redis Rate Limiting (fast, visible, high value)
**Why:** protects the platform from abuse and traffic spikes.

**Implement:** Redis-backed rate limiting with a clear policy matrix:
- Auth endpoints (`/login`, `/register`, `/forgot-password`): strict per IP + per user.
- Attendance scan endpoints: moderate per user + per IP.
- AI endpoints: strict per user (controls cost and protects stability).

**Algorithm:** choose one and stick to it (document why):
- Token bucket = burst-friendly
- Sliding window = fairer over time

**Done when:**
- You can demonstrate 429 responses with `Retry-After`.
- Limits are configurable via env variables.

**Judge demo idea:** show burst traffic to AI/scan endpoints being throttled safely.

---

### 2) Attendance Idempotency + DB-Level Uniqueness (correctness under retries)
**Why:** scanning is a classic real-world “duplicate request” problem.

**Implement:**
- Accept `Idempotency-Key` header (or generate from scan payload).
- Store an idempotency record: `(key, action, eventId, participantId, responseHash, status, createdAt)`.
- Return the same result for the same key (do not create duplicates).
- Add DB-level uniqueness:
  - attendance uniqueness: `(eventId, participantId)`

**Done when:**
- Replaying the exact same scan 10 times produces 1 attendance record.
- Concurrency test: 20 parallel scans still create 1 record.

**Judge demo idea:** simulate flaky network retries; show “exactly-once outcome”.

---

### 3) Certificate Issuance Idempotency + Uniqueness
**Why:** certificates are a high-value, user-facing artifact. Duplicates are unacceptable.

**Implement:**
- Same idempotency mechanism (separate action name, e.g. `CERT_ISSUE`).
- DB-level uniqueness:
  - certificate uniqueness: `(eventId, participantId)`

**Done when:**
- Multiple triggers (manual + automatic) still produce exactly one certificate.

**Judge demo idea:** show certificate generation triggered twice but only one file/record exists.

---

### 4) PII Privacy: Field-Level Encryption + PII Access Audit Logs
**Why:** privacy is a serious “trust” feature and very judge-friendly.

**Implement (minimal, strong):**
- Encrypt only high-risk fields at rest (AES-256-GCM):
  - phone, address, DOB, any ID number (if stored)
- Keep searchable/login-critical fields (like email) plaintext.
- Role-based decryption:
  - participant can decrypt their own PII
  - admin/support can decrypt with reason
  - organizer sees masked values by default
- **PII access audit logs** whenever privileged roles decrypt/view PII:
  - who, whose data, what field(s), when, requestId, reason

**Done when:**
- DB shows ciphertext for PII fields.
- Audit log entries appear when admin views PII.
- Logs are redacted (no tokens, no raw PII in logs).

**Judge demo idea:** show encrypted data in DB + show audit log for PII access.

---

### 5) Finance: Immutable Ledger + Audit Trail (best “serious system” feature)
**Why:** finance is the strongest domain for ACID, correctness, and auditability.

**Preferred storage:** Supabase Postgres as system-of-record for finance.

**Implement:**
- Append-only `transactions` (never update amounts; add reversing/adjustment entries instead).
- Separate `approvals` / `overrides` with strict permissions.
- Audit logs for all finance-sensitive actions:
  - who, what, before/after, reason, requestId
- Constraints:
  - amounts > 0
  - enumerated statuses
  - foreign keys to event/user

**Done when:**
- You can reconstruct balances from ledger history.
- Manual changes create audit entries.

**Judge demo idea:** show a reversal transaction instead of editing a record; explain traceability.

---

## Optional “Stand Out Even More” (only if time remains)

### A) Background Jobs (workers) for heavy tasks
Use a Redis-backed queue (e.g., BullMQ) to offload:
- certificate generation
- OCR processing
- AI enrichment tasks

### B) Outbox Pattern (reliability for events + cache invalidation)
If you introduce Postgres for finance, implement an outbox table:
- write business row + outbox event in the same transaction
- worker publishes events / invalidates cache

This gives you a credible roadmap to Kafka later without committing to Kafka now.

### C) Observability (metrics that prove your design)
Track:
- cache hit rate
- p95 latency per route
- rate-limit 429 counts
- job queue depth / failures

Even minimal metrics make demos much stronger.

---

## Database Strategy (Pragmatic)

### Keep MongoDB for
- chatbot history
- OCR raw outputs
- AI artifacts
- flexible logs

### Move to Supabase Postgres (incremental)
- finance (first)
- permissions/RBAC (optional)
- certificate issuance records (optional)
- attendance records (optional, if concurrency is high)

---

## Suggested Judge Presentation Narrative (2–3 minutes)
1. **Rate limiting** protects the platform under abuse/spikes.
2. **Idempotency + uniqueness** guarantees correct outcomes under retries.
3. **Field-level encryption + access audits** proves privacy-by-design.
4. **Immutable finance ledger** proves auditability and ACID correctness.

---

## Acceptance Checklist (Quick)
- [ ] Rate limits configured + returns 429 + `Retry-After`
- [ ] Attendance scan is idempotent + uniqueness enforced
- [ ] Certificate issuance is idempotent + uniqueness enforced
- [ ] PII fields encrypted at rest + access audit logs exist
- [ ] Finance ledger append-only + audit logs + constraints
