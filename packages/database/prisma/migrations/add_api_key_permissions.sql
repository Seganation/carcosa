-- Add permissions and lastUsedAt to ApiKey table
ALTER TABLE "ApiKey" 
ADD COLUMN "permissions" JSONB DEFAULT '["read", "write"]',
ADD COLUMN "lastUsedAt" TIMESTAMP;

-- Add indexes for better performance
CREATE INDEX "ApiKey_projectId_idx" ON "ApiKey"("projectId");
CREATE INDEX "ApiKey_keyHash_idx" ON "ApiKey"("keyHash");

-- Update existing API keys to have default permissions
UPDATE "ApiKey" 
SET "permissions" = '["read", "write"]' 
WHERE "permissions" IS NULL;
