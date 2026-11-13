-- Assistente vocale (POC del 12/11/2026): l'assistente al telefono crea e sposta
-- prenotazioni, salva i clienti nuovi con il consenso detto a voce e lascia messaggi.
--
-- Additiva e senza backfill: gli appuntamenti esistenti diventano "banco".
-- Si puo' eseguire a mano oppure lasciare a `drizzle-kit push`, che produce le
-- stesse colonne e la stessa tabella; IF NOT EXISTS la rende ripetibile.

-- Da dove arriva l'appuntamento: 'banco' (gestionale) o 'telefono' (assistente).
-- Serve a distinguerli a video e a contare quelli presi al telefono.
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "source" text DEFAULT 'banco' NOT NULL;
--> statement-breakpoint

-- Quando l'assistente ha spostato l'appuntamento: postazione e collaboratore sono
-- stati tolti e va ripianificato. Vuoto per tutti gli altri.
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "phone_changed_at" timestamp;
--> statement-breakpoint

-- Per i clienti creati dall'assistente: la sessione della chiamata in cui hanno
-- detto si' al salvataggio dei dati (consent_version = 'telefono-1.0').
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "consent_session_id" text;
--> statement-breakpoint

-- Messaggi lasciati al telefono per il negozio (disdette, richieste particolari,
-- cani difficili, tutto quello che l'assistente non fa da solo).
CREATE TABLE IF NOT EXISTS "phone_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "location_id" uuid NOT NULL,
  "client_id" uuid,
  "name" text,
  "phone" text,
  "message" text NOT NULL,
  "session_id" text,
  "read_at" timestamp,
  "tenant_id" uuid NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "phone_messages_tenant_created_idx"
  ON "phone_messages" ("tenant_id", "created_at");
