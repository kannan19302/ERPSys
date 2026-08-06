-- Link bank_accounts to the GL chart of accounts (accounts) so bank/cash
-- balances can be computed from posted journal entries (GL is the source
-- of truth) instead of a hardcoded/manually-editable field.

-- CreateIndex
CREATE INDEX IF NOT EXISTS "bank_accounts_account_id_idx" ON "bank_accounts"("account_id");

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
