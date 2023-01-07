PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS "warnings" (
  "id" INTEGER PRIMARY KEY NOT NULL,
  "package" VARCHAR(100) NOT NULL,
  "kind" VARCHAR(50) NOT NULL,
  "location" VARCHAR(100) NOT NULL,
  "value" TEXT,
  "severity" VARCHAR(50) NOT NULL,
  "file" VARCHAR(500)
);