-- CreateTable
CREATE TABLE "churches" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "churches_pkey" PRIMARY KEY ("id")
);

-- Seed the two known churches. Sao Paulo is inserted first so it
-- deterministically gets id 1, used below as the backfill target for
-- every row that existed before multi-tenancy was introduced.
INSERT INTO "churches" ("name") VALUES ('São Paulo'), ('Osasco');

-- AlterTable (nullable for now - existing rows have no church yet)
ALTER TABLE "banners" ADD COLUMN     "churchId" INTEGER;

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "churchId" INTEGER;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "churchId" INTEGER;

-- AlterTable
ALTER TABLE "text_contents" ADD COLUMN     "churchId" INTEGER;

-- AlterTable
ALTER TABLE "trainings" ADD COLUMN     "churchId" INTEGER;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "churchId" INTEGER;

-- AlterTable
ALTER TABLE "videos" ADD COLUMN     "churchId" INTEGER;

-- Backfill: every row that existed before multi-tenancy belongs to Sao Paulo (id 1).
UPDATE "banners" SET "churchId" = 1 WHERE "churchId" IS NULL;
UPDATE "categories" SET "churchId" = 1 WHERE "churchId" IS NULL;
UPDATE "events" SET "churchId" = 1 WHERE "churchId" IS NULL;
UPDATE "text_contents" SET "churchId" = 1 WHERE "churchId" IS NULL;
UPDATE "trainings" SET "churchId" = 1 WHERE "churchId" IS NULL;
UPDATE "users" SET "churchId" = 1 WHERE "churchId" IS NULL;
UPDATE "videos" SET "churchId" = 1 WHERE "churchId" IS NULL;

-- Contract: now that every row has a church, enforce NOT NULL.
ALTER TABLE "banners" ALTER COLUMN "churchId" SET NOT NULL;
ALTER TABLE "categories" ALTER COLUMN "churchId" SET NOT NULL;
ALTER TABLE "events" ALTER COLUMN "churchId" SET NOT NULL;
ALTER TABLE "text_contents" ALTER COLUMN "churchId" SET NOT NULL;
ALTER TABLE "trainings" ALTER COLUMN "churchId" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "churchId" SET NOT NULL;
ALTER TABLE "videos" ALTER COLUMN "churchId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "banners_churchId_idx" ON "banners"("churchId");

-- CreateIndex
CREATE INDEX "categories_churchId_idx" ON "categories"("churchId");

-- CreateIndex
CREATE INDEX "events_churchId_idx" ON "events"("churchId");

-- CreateIndex
CREATE INDEX "text_contents_churchId_idx" ON "text_contents"("churchId");

-- CreateIndex
CREATE INDEX "trainings_churchId_idx" ON "trainings"("churchId");

-- CreateIndex
CREATE INDEX "users_churchId_idx" ON "users"("churchId");

-- CreateIndex
CREATE INDEX "videos_churchId_idx" ON "videos"("churchId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "churches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "churches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "churches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "text_contents" ADD CONSTRAINT "text_contents_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "churches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainings" ADD CONSTRAINT "trainings_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "churches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "churches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banners" ADD CONSTRAINT "banners_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "churches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
