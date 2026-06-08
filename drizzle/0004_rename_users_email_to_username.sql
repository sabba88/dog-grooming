ALTER TABLE "users" RENAME COLUMN "email" TO "username";
ALTER TABLE "users" RENAME CONSTRAINT "users_email_unique" TO "users_username_unique";
