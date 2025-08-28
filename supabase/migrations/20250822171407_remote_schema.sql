drop extension if exists "pg_net";

drop index if exists "public"."uniq_main_address_per_profile";

alter table "public"."partners" add column if not exists "category" text;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_specialists()
 RETURNS TABLE(id uuid, full_name text, email text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Apenas admins podem executar esta função
    IF (get_my_claim('user_role'))::text != 'admin' THEN
        RAISE EXCEPTION 'Acesso negado. Apenas administradores podem listar especialistas.';
    END IF;

    RETURN QUERY
    SELECT 
        p.id,
        p.full_name,
        p.email,
        p.created_at
    FROM public.profiles p
    WHERE p.user_role = 'specialist'
      AND p.status = 'ativo'
    ORDER BY p.full_name ASC;
END;
$function$
;


