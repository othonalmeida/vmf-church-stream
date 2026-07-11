-- Expand: add the new pt/en/es columns as nullable first, so existing rows
-- don't break. Backfilled below, then made NOT NULL where required.

-- AlterTable: events
ALTER TABLE "events"
  ADD COLUMN "titlePt" TEXT,
  ADD COLUMN "titleEn" TEXT,
  ADD COLUMN "titleEs" TEXT,
  ADD COLUMN "descriptionPt" TEXT,
  ADD COLUMN "descriptionEn" TEXT,
  ADD COLUMN "descriptionEs" TEXT;

-- AlterTable: text_contents
ALTER TABLE "text_contents"
  ADD COLUMN "titlePt" TEXT,
  ADD COLUMN "titleEn" TEXT,
  ADD COLUMN "titleEs" TEXT,
  ADD COLUMN "descriptionPt" TEXT,
  ADD COLUMN "descriptionEn" TEXT,
  ADD COLUMN "descriptionEs" TEXT,
  ADD COLUMN "contentHtmlPt" TEXT,
  ADD COLUMN "contentHtmlEn" TEXT,
  ADD COLUMN "contentHtmlEs" TEXT;

-- AlterTable: trainings
ALTER TABLE "trainings"
  ADD COLUMN "titlePt" TEXT,
  ADD COLUMN "titleEn" TEXT,
  ADD COLUMN "titleEs" TEXT,
  ADD COLUMN "descriptionPt" TEXT,
  ADD COLUMN "descriptionEn" TEXT,
  ADD COLUMN "descriptionEs" TEXT;

-- AlterTable: videos
ALTER TABLE "videos"
  ADD COLUMN "titlePt" TEXT,
  ADD COLUMN "titleEn" TEXT,
  ADD COLUMN "titleEs" TEXT,
  ADD COLUMN "descriptionPt" TEXT,
  ADD COLUMN "descriptionEn" TEXT,
  ADD COLUMN "descriptionEs" TEXT;

-- Backfill: copy the existing single-language value into all 3 new columns.
-- The admin corrects/retranslates for real afterward using the
-- "Traduzir automaticamente" button; this just guarantees nothing is blank.
UPDATE "events" SET "titlePt" = "title", "titleEn" = "title", "titleEs" = "title";
UPDATE "events" SET "descriptionPt" = "description", "descriptionEn" = "description", "descriptionEs" = "description";

UPDATE "text_contents" SET "titlePt" = "title", "titleEn" = "title", "titleEs" = "title";
UPDATE "text_contents" SET "descriptionPt" = "description", "descriptionEn" = "description", "descriptionEs" = "description";
UPDATE "text_contents" SET "contentHtmlPt" = "contentHtml", "contentHtmlEn" = "contentHtml", "contentHtmlEs" = "contentHtml";

UPDATE "trainings" SET "titlePt" = "title", "titleEn" = "title", "titleEs" = "title";
UPDATE "trainings" SET "descriptionPt" = "description", "descriptionEn" = "description", "descriptionEs" = "description";

UPDATE "videos" SET "titlePt" = "title", "titleEn" = "title", "titleEs" = "title";
UPDATE "videos" SET "descriptionPt" = "description", "descriptionEn" = "description", "descriptionEs" = "description";

-- Contract: titles and text-content's HTML body are required; enforce NOT NULL
-- now that every row has been backfilled. Descriptions stay optional.
ALTER TABLE "events" ALTER COLUMN "titlePt" SET NOT NULL;
ALTER TABLE "events" ALTER COLUMN "titleEn" SET NOT NULL;
ALTER TABLE "events" ALTER COLUMN "titleEs" SET NOT NULL;

ALTER TABLE "text_contents" ALTER COLUMN "titlePt" SET NOT NULL;
ALTER TABLE "text_contents" ALTER COLUMN "titleEn" SET NOT NULL;
ALTER TABLE "text_contents" ALTER COLUMN "titleEs" SET NOT NULL;
ALTER TABLE "text_contents" ALTER COLUMN "contentHtmlPt" SET NOT NULL;
ALTER TABLE "text_contents" ALTER COLUMN "contentHtmlEn" SET NOT NULL;
ALTER TABLE "text_contents" ALTER COLUMN "contentHtmlEs" SET NOT NULL;

ALTER TABLE "trainings" ALTER COLUMN "titlePt" SET NOT NULL;
ALTER TABLE "trainings" ALTER COLUMN "titleEn" SET NOT NULL;
ALTER TABLE "trainings" ALTER COLUMN "titleEs" SET NOT NULL;

ALTER TABLE "videos" ALTER COLUMN "titlePt" SET NOT NULL;
ALTER TABLE "videos" ALTER COLUMN "titleEn" SET NOT NULL;
ALTER TABLE "videos" ALTER COLUMN "titleEs" SET NOT NULL;

-- Drop the old single-language columns now that the pt/en/es replacements
-- are fully populated.
ALTER TABLE "events" DROP COLUMN "title", DROP COLUMN "description", DROP COLUMN "language";
ALTER TABLE "text_contents" DROP COLUMN "title", DROP COLUMN "description", DROP COLUMN "contentHtml", DROP COLUMN "language";
ALTER TABLE "trainings" DROP COLUMN "title", DROP COLUMN "description";
ALTER TABLE "videos" DROP COLUMN "title", DROP COLUMN "description", DROP COLUMN "originalLanguage";
