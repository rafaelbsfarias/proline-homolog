drop extension if exists "pg_net";

drop index if exists "public"."uniq_main_address_per_profile";

alter table "public"."addresses" drop column "is_collect_point";

alter table "public"."addresses" drop column "is_main_address";


