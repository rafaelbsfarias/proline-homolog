alter table "public"."vehicle_collections" add column "collection_date" date;

CREATE UNIQUE INDEX uniq_main_address_per_profile ON public.addresses USING btree (profile_id) WHERE (is_main_address = true);

CREATE UNIQUE INDEX vehicle_collections_client_address_uniq ON public.vehicle_collections USING btree (client_id, collection_address);

CREATE INDEX vehicle_collections_client_idx ON public.vehicle_collections USING btree (client_id);

CREATE INDEX vehicle_collections_client_status_idx ON public.vehicle_collections USING btree (client_id, status);

CREATE INDEX vehicle_collections_status_idx ON public.vehicle_collections USING btree (status);

alter table "public"."vehicle_collections" add constraint "vehicle_collections_client_address_uniq" UNIQUE using index "vehicle_collections_client_address_uniq";

alter table "public"."vehicle_collections" add constraint "vehicle_collections_status_chk" CHECK ((status = ANY (ARRAY['requested'::text, 'approved'::text, 'paid'::text]))) not valid;

alter table "public"."vehicle_collections" validate constraint "vehicle_collections_status_chk";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE TRIGGER trg_vehicle_collections_set_ts BEFORE UPDATE ON public.vehicle_collections FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();


