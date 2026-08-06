-- Track E — Durable checkpoint for blockchain event listener
-- Persists the last-processed block number per (channel, chaincode)
-- so the listener resumes from the correct position on restart.

-- CreateTable
CREATE TABLE "blockchain_sync_checkpoints" (
    "id" TEXT NOT NULL,
    "channel_name" TEXT NOT NULL,
    "chaincode_name" TEXT NOT NULL,
    "last_block_number" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blockchain_sync_checkpoints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blockchain_sync_checkpoints_channel_name_chaincode_name_key" ON "blockchain_sync_checkpoints"("channel_name", "chaincode_name");
