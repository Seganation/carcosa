/*
  Warnings:

  - You are about to drop the column `teamId` on the `Bucket` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[ownerTeamId,bucketName,provider]` on the table `Bucket` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ownerTeamId` to the `Bucket` table without a default value. This is not possible if the table is not empty.

*/
-- Step 1: Add ownerTeamId column as nullable first
ALTER TABLE "Bucket" ADD COLUMN "ownerTeamId" TEXT;

-- Step 2: Update existing buckets to use the current teamId as ownerTeamId
UPDATE "Bucket" SET "ownerTeamId" = "teamId" WHERE "ownerTeamId" IS NULL;

-- Step 3: Make ownerTeamId NOT NULL (should work now that all buckets have ownerTeamId)
ALTER TABLE "Bucket" ALTER COLUMN "ownerTeamId" SET NOT NULL;

-- Step 4: Drop the old foreign key and index
ALTER TABLE "Bucket" DROP CONSTRAINT "Bucket_teamId_fkey";
DROP INDEX "Bucket_teamId_bucketName_provider_key";

-- Step 5: Drop the old teamId column
ALTER TABLE "Bucket" DROP COLUMN "teamId";

-- CreateTable
CREATE TABLE "BucketTeamAccess" (
    "id" TEXT NOT NULL,
    "bucketId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "accessLevel" TEXT NOT NULL DEFAULT 'READ_WRITE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BucketTeamAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BucketTeamAccess_bucketId_idx" ON "BucketTeamAccess"("bucketId");

-- CreateIndex
CREATE INDEX "BucketTeamAccess_teamId_idx" ON "BucketTeamAccess"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "BucketTeamAccess_bucketId_teamId_key" ON "BucketTeamAccess"("bucketId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "Bucket_ownerTeamId_bucketName_provider_key" ON "Bucket"("ownerTeamId", "bucketName", "provider");

-- CreateIndex
CREATE INDEX "Project_bucketId_idx" ON "Project"("bucketId");

-- AddForeignKey
ALTER TABLE "Bucket" ADD CONSTRAINT "Bucket_ownerTeamId_fkey" FOREIGN KEY ("ownerTeamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BucketTeamAccess" ADD CONSTRAINT "BucketTeamAccess_bucketId_fkey" FOREIGN KEY ("bucketId") REFERENCES "Bucket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BucketTeamAccess" ADD CONSTRAINT "BucketTeamAccess_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
