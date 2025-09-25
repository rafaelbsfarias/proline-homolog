drop index if exists "public"."uniq_main_address_per_profile";

alter table "public"."addresses" alter column "is_collect_point" drop not null;

alter table "public"."addresses" alter column "is_main_address" drop not null;


