/*
  Warnings:

  - You are about to drop the column `ownerId` on the `Bucket` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[teamId,bucketName,provider]` on the table `Bucket` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `teamId` to the `Bucket` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Add teamId column as nullable first
ALTER TABLE "Bucket" ADD COLUMN "teamId" TEXT;

-- Step 2: Update existing buckets to use the user's default team
-- For each bucket owner, find their team and update the bucket
UPDATE "Bucket" 
SET "teamId" = (
  SELECT tm."teamId" 
  FROM "TeamMember" tm 
  WHERE tm."userId" = "Bucket"."ownerId" 
  LIMIT 1
)
WHERE "teamId" IS NULL;

-- Step 3: Make teamId NOT NULL (should work now that all buckets have teamId)
ALTER TABLE "Bucket" ALTER COLUMN "teamId" SET NOT NULL;

-- Step 4: Drop the old foreign key and index
ALTER TABLE "Bucket" DROP CONSTRAINT "Bucket_ownerId_fkey";
DROP INDEX "Bucket_ownerId_bucketName_provider_key";

-- Step 5: Drop the ownerId column
ALTER TABLE "Bucket" DROP COLUMN "ownerId";

-- Step 6: Create new unique index and foreign key
CREATE UNIQUE INDEX "Bucket_teamId_bucketName_provider_key" ON "Bucket"("teamId", "bucketName", "provider");
ALTER TABLE "Bucket" ADD CONSTRAINT "Bucket_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
