-- Chiusura appuntamento: a prestazione finita si conferma il prezzo effettivo e
-- l'appuntamento risulta chiuso.
--
-- Additiva e senza backfill: gli appuntamenti gia' in archivio restano aperti.
-- Si puo' eseguire a mano oppure lasciare a `drizzle-kit push`, che produce le
-- stesse due colonne; IF NOT EXISTS la rende ripetibile in entrambi i casi.

-- Da controllare a ogni ambiente, insieme a questa: "user_id" deve essere
-- FACOLTATIVO (appuntamento "da assegnare"). Non lo rende tale nessuna
-- migration, quindi un database nato prima se lo ritrova ancora NOT NULL e
-- l'appuntamento senza collaboratore non si riesce a salvare. Su uat e' stato
-- sistemato a mano il 10/11/2026 con l'ALTER in fondo; "drizzle-kit push" lo
-- allinea da solo, l'esecuzione a mano no.
--
--   SELECT is_nullable FROM information_schema.columns
--    WHERE table_name = 'appointments' AND column_name = 'user_id';

ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "closed_at" timestamp;
--> statement-breakpoint

ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "closed_by_user_id" uuid;
--> statement-breakpoint

-- Ripetibile: se e' gia' facoltativo non fa niente.
ALTER TABLE "appointments" ALTER COLUMN "user_id" DROP NOT NULL;
