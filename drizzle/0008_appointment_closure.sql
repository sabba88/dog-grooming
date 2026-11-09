-- Chiusura appuntamento: a prestazione finita si conferma il prezzo effettivo e
-- l'appuntamento risulta chiuso.
--
-- Additiva e senza backfill: gli appuntamenti gia' in archivio restano aperti.
-- Si puo' eseguire a mano oppure lasciare a `drizzle-kit push`, che produce le
-- stesse due colonne; IF NOT EXISTS la rende ripetibile in entrambi i casi.

ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "closed_at" timestamp;
--> statement-breakpoint

ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "closed_by_user_id" uuid;
