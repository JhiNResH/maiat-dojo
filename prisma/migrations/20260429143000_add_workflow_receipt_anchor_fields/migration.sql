ALTER TABLE "WorkflowRunReceipt" ADD COLUMN "anchorStatus" TEXT NOT NULL DEFAULT 'not_started';
ALTER TABLE "WorkflowRunReceipt" ADD COLUMN "onchainRequestId" TEXT;
ALTER TABLE "WorkflowRunReceipt" ADD COLUMN "swapTxHash" TEXT;
ALTER TABLE "WorkflowRunReceipt" ADD COLUMN "settleTxHash" TEXT;
ALTER TABLE "WorkflowRunReceipt" ADD COLUMN "anchorError" TEXT;
