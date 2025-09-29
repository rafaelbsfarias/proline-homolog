-- Substitua pelos valores reais usados no teste
\set user_id '3b76bcbb-da43-44ac-be09-700cba1b35ae'
\set vehicle_id '41648094-05fc-44b3-87c9-1c96becd715d'

-- Verifica se o usuário existe e tem papel 'partner'
SELECT id, role FROM public.profiles WHERE id = :'user_id';

-- Verifica se o veículo existe
SELECT id FROM public.vehicles WHERE id = :'vehicle_id';

-- Verifica se o path do upload está correto (simulação)
-- O correto é: <vehicle_id>/<user_id>/arquivo.jpg
SELECT :'vehicle_id' || '/' || :'user_id' || '/test.jpg' AS expected_path;
