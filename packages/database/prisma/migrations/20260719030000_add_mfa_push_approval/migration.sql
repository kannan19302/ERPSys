-- MFA push-approval: devices subscribed to Web Push, and per-login-attempt challenge state.
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "endpoint" TEXT NOT NULL,
  "p256dh" TEXT NOT NULL,
  "auth" TEXT NOT NULL,
  "label" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");
CREATE INDEX IF NOT EXISTS "push_subscriptions_tenant_id_user_id_idx" ON "push_subscriptions"("tenant_id", "user_id");

CREATE TABLE IF NOT EXISTS "mfa_push_challenges" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "mfa_push_challenges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "mfa_push_challenges_token_key" ON "mfa_push_challenges"("token");
CREATE INDEX IF NOT EXISTS "mfa_push_challenges_tenant_id_user_id_idx" ON "mfa_push_challenges"("tenant_id", "user_id");
