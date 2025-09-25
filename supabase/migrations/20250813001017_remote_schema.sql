create policy "Allow service_role to read auth.users"
on "auth"."users"
as permissive
for select
to service_role
using (true);
