-- Add origin tracking fields to Expense
ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "originExpenseId" TEXT;
ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "originMonth" INTEGER;
ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "originYear" INTEGER;

CREATE INDEX IF NOT EXISTS "Expense_originExpenseId_idx" ON "Expense"("originExpenseId");
