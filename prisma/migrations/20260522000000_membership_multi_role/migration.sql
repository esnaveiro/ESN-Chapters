ALTER TABLE "mandate_membership"
  ADD COLUMN "departments" TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN "roleTitles"  TEXT[] NOT NULL DEFAULT '{}';

UPDATE "mandate_membership"
  SET "departments" = CASE WHEN TRIM("department") = '' THEN '{}' ELSE ARRAY[TRIM("department")] END,
      "roleTitles"  = CASE WHEN TRIM("roleTitle")  = '' THEN '{}' ELSE ARRAY[TRIM("roleTitle")]  END;

ALTER TABLE "mandate_membership"
  DROP COLUMN "department",
  DROP COLUMN "roleTitle";
