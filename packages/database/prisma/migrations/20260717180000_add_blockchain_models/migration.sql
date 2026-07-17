-- CreateEnum
CREATE TYPE "BlockchainTxStatus" AS ENUM ('PENDING', 'SUBMITTED', 'CONFIRMED', 'FAILED', 'RETRYING');

-- CreateEnum
CREATE TYPE "VerificationResult" AS ENUM ('VERIFIED', 'TAMPERED', 'NOT_FOUND', 'NETWORK_ERROR');

-- CreateTable
CREATE TABLE "blockchain_transactions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "channel_name" TEXT NOT NULL,
    "chaincode_name" TEXT NOT NULL,
    "data_hash" TEXT NOT NULL,
    "status" "BlockchainTxStatus" NOT NULL DEFAULT 'PENDING',
    "transaction_id" TEXT,
    "block_number" TEXT,
    "confirmed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blockchain_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blockchain_verifications" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "result" "VerificationResult" NOT NULL,
    "local_hash" TEXT,
    "on_chain_hash" TEXT,
    "verified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blockchain_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "blockchain_transactions_tenant_id_idx" ON "blockchain_transactions"("tenant_id");

-- CreateIndex
CREATE INDEX "blockchain_transactions_tenant_id_entity_type_entity_id_idx" ON "blockchain_transactions"("tenant_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "blockchain_transactions_tenant_id_status_idx" ON "blockchain_transactions"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "blockchain_transactions_transaction_id_idx" ON "blockchain_transactions"("transaction_id");

-- CreateIndex
CREATE INDEX "blockchain_verifications_tenant_id_idx" ON "blockchain_verifications"("tenant_id");

-- CreateIndex
CREATE INDEX "blockchain_verifications_tenant_id_entity_type_entity_id_idx" ON "blockchain_verifications"("tenant_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "blockchain_verifications_tenant_id_result_idx" ON "blockchain_verifications"("tenant_id", "result");

-- AddForeignKey
ALTER TABLE "blockchain_transactions" ADD CONSTRAINT "blockchain_transactions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blockchain_verifications" ADD CONSTRAINT "blockchain_verifications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
