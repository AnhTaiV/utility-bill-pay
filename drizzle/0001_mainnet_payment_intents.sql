ALTER TABLE "bills" ADD COLUMN IF NOT EXISTS "sender_address" text;
ALTER TABLE "bills" ADD COLUMN IF NOT EXISTS "recipient_address" text;
ALTER TABLE "bills" ADD COLUMN IF NOT EXISTS "idempotency_key" text;
ALTER TABLE "bills" ADD COLUMN IF NOT EXISTS "unsigned_xdr" text;
ALTER TABLE "bills" ADD COLUMN IF NOT EXISTS "unsigned_tx_digest" text;
ALTER TABLE "bills" ADD COLUMN IF NOT EXISTS "access_token_hash" text;
CREATE UNIQUE INDEX IF NOT EXISTS "bills_idempotency_key_idx" ON "bills" ("idempotency_key");
