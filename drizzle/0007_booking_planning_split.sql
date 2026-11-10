-- CC-2026-10-23 — Separazione prenotazione / pianificazione.
--
-- ATTENZIONE: va eseguita a mano PRIMA di `drizzle-kit push`.
-- `push` imposterebbe location_id NOT NULL su una colonna appena creata e vuota,
-- fallendo su qualsiasi database con appuntamenti gia' presenti.
--
-- Per gli appuntamenti privi di postazione la sede non e' scritta da nessuna parte
-- e va ricostruita. Due casi, nell'ordine:
--   3a) il tenant ha una sola sede → si usa quella: non c'e' niente da indovinare;
--   3b) il tenant ne ha piu' di una → serve una scelta esplicita, per nome.
-- DA RIVEDERE A OGNI AMBIENTE: il nome al punto 3b.
--   dev  → non serve: tenant con una sola sede ("Sede Castelplanio"), coperto da 3a
--   uat  → "Castelplanio" (deciso il 10/11/2026). Le sedi sono due, Castelplanio e
--          AgriMoie, e 6167 appuntamenti su 6240 non hanno postazione. Castelplanio
--          e' la sede di fatto: suoi tutti i 73 appuntamenti con postazione, 210
--          turni contro 12, 9 fasce di apertura contro 2, 3 postazioni contro 2.
--   prod → da decidere. Il nome qui sotto e' quello di uat: va riletto prima di
--          lanciare la migration in produzione.
-- Se dopo 3a e 3b resta anche un solo appuntamento senza sede, la migration si
-- ferma (punto 4) invece di assegnarlo alla sede sbagliata.

-- 1. Sede dell'appuntamento: finora dedotta dalla postazione, che ora puo' mancare.
ALTER TABLE "appointments" ADD COLUMN "location_id" uuid;
--> statement-breakpoint

-- 2. Appuntamenti con postazione: la sede e' quella della postazione. Nessun dubbio.
UPDATE "appointments" a
   SET "location_id" = s."location_id"
  FROM "stations" s
 WHERE s."id" = a."station_id"
   AND a."location_id" IS NULL;
--> statement-breakpoint

-- 3a. Tenant con una sola sede: l'appuntamento puo' essere solo li'.
UPDATE "appointments" a
   SET "location_id" = (
         SELECT l."id" FROM "locations" l
          WHERE l."tenant_id" = a."tenant_id"
          LIMIT 1)
 WHERE a."location_id" IS NULL
   AND (SELECT count(*) FROM "locations" l2 WHERE l2."tenant_id" = a."tenant_id") = 1;
--> statement-breakpoint

-- 3b. Tenant con piu' sedi: sede di ripiego scelta per nome, per questo ambiente.
UPDATE "appointments" a
   SET "location_id" = (
         SELECT l."id" FROM "locations" l
          WHERE l."tenant_id" = a."tenant_id"
            AND l."name" = 'Castelplanio'
          LIMIT 1)
 WHERE a."location_id" IS NULL;
--> statement-breakpoint

-- 4. Nessun appuntamento deve restare senza sede: meglio fermarsi con un messaggio
-- leggibile che far fallire il SET NOT NULL qui sotto con un errore criptico.
DO $$
DECLARE orfani int;
BEGIN
  SELECT count(*) INTO orfani FROM "appointments" WHERE "location_id" IS NULL;
  IF orfani > 0 THEN
    RAISE EXCEPTION
      'Restano % appuntamenti senza sede. Controlla il nome della sede di ripiego al punto 3b per questo ambiente.',
      orfani;
  END IF;
END $$;
--> statement-breakpoint

ALTER TABLE "appointments" ALTER COLUMN "location_id" SET NOT NULL;
--> statement-breakpoint

ALTER TABLE "appointments"
  ADD CONSTRAINT "appointments_location_id_locations_id_fk"
  FOREIGN KEY ("location_id") REFERENCES "locations"("id");
--> statement-breakpoint

CREATE INDEX "appointments_location_start_idx"
  ON "appointments" ("tenant_id", "location_id", "start_time");
--> statement-breakpoint

-- 5. Servizio e prezzo diventano facoltativi: si valorizzano in pianificazione.
ALTER TABLE "appointments" ALTER COLUMN "service_id" DROP NOT NULL;
--> statement-breakpoint

ALTER TABLE "appointments" ALTER COLUMN "price" DROP NOT NULL;
