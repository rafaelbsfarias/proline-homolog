#!/bin/bash

echo "=== Script: Popular Dados de Teste ==="
echo "Criando dados de teste para demonstração dos scripts..."
echo ""

# Função para consultar o banco
query_db() {
    local query="$1"
    psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "$query" 2>/dev/null
}

echo "1. Verificando se já existem dados de teste..."

# Verificar se já existem parceiros
EXISTING_PARTNERS=$(psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -c "SELECT COUNT(*) FROM public.partners;" 2>/dev/null | xargs)

if [ "$EXISTING_PARTNERS" -gt 0 ]; then
    echo "⚠️  Já existem $EXISTING_PARTNERS parceiros cadastrados."
    echo "Deseja limpar os dados existentes e criar novos? (s/N)"
    read -r response
    if [[ ! "$response" =~ ^[Ss]$ ]]; then
        echo "Operação cancelada."
        exit 0
    fi

    echo "Limpando dados existentes..."
    query_db "DELETE FROM public.quotes;"
    query_db "DELETE FROM public.service_orders;"
    query_db "DELETE FROM public.inspection_services;"
    query_db "DELETE FROM public.inspections;"
    query_db "DELETE FROM public.partners_service_categories;"
    query_db "DELETE FROM public.partners;"
    query_db "DELETE FROM public.vehicles;"
    query_db "DELETE FROM public.clients;"
    echo "✅ Dados limpos."
fi

echo ""
echo "2. Criando dados de teste..."

# Inserir parceiro de teste
echo "Criando parceiro de teste..."
query_db "
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
VALUES ('550e8400-e29b-41d4-a716-446655440001', 'parceiro.teste@email.com', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
VALUES ('550e8400-e29b-41d4-a716-446655440001', 'Parceiro Teste Silva', 'partner', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.partners (profile_id, company_name, cnpj, is_active, created_at, updated_at)
VALUES ('550e8400-e29b-41d4-a716-446655440001', 'Auto Peças Teste LTDA', '12.345.678/0001-99', true, NOW(), NOW())
ON CONFLICT (profile_id) DO NOTHING;
"

# Associar categorias ao parceiro
echo "Associando categorias de serviço ao parceiro..."
query_db "
INSERT INTO public.partners_service_categories (partner_id, category_id, priority, created_at)
SELECT '550e8400-e29b-41d4-a716-446655440001', sc.id, 1, NOW()
FROM public.service_categories sc
WHERE sc.key = 'mechanics'
ON CONFLICT (partner_id, category_id) DO NOTHING;

INSERT INTO public.partners_service_categories (partner_id, category_id, priority, created_at)
SELECT '550e8400-e29b-41d4-a716-446655440001', sc.id, 2, NOW()
FROM public.service_categories sc
WHERE sc.key = 'body_paint'
ON CONFLICT (partner_id, category_id) DO NOTHING;
"

# Criar cliente de teste
echo "Criando cliente de teste..."
query_db "
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
VALUES ('550e8400-e29b-41d4-a716-446655440002', 'cliente.teste@email.com', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
VALUES ('550e8400-e29b-41d4-a716-446655440002', 'Cliente Teste Santos', 'client', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (profile_id, document_number, created_at, updated_at)
VALUES ('550e8400-e29b-41d4-a716-446655440002', '123.456.789-00', NOW(), NOW())
ON CONFLICT (profile_id) DO NOTHING;
"

# Criar veículo de teste
echo "Criando veículo de teste..."
query_db "
INSERT INTO public.vehicles (id, client_id, plate, model, brand, year, color, created_at)
VALUES ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'ABC-1234', 'Uno', 'Fiat', 2015, 'Branco', NOW())
ON CONFLICT (id) DO NOTHING;
"

# Criar inspeção finalizada
echo "Criando inspeção finalizada..."
query_db "
INSERT INTO public.inspections (id, vehicle_id, specialist_id, inspection_date, odometer, fuel_level, finalized, created_at)
VALUES ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE, 50000, 'half', true, NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;
"

# Adicionar serviços à inspeção
echo "Adicionando serviços à inspeção..."
query_db "
INSERT INTO public.inspection_services (id, inspection_id, category, required, notes)
VALUES ('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440004', 'mechanics', true, 'Troca de óleo e filtros')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.inspection_services (id, inspection_id, category, required, notes)
VALUES ('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440004', 'body_paint', false, 'Pintura para-choque dianteiro')
ON CONFLICT (id) DO NOTHING;
"

# Criar ordem de serviço
echo "Criando ordem de serviço..."
query_db "
INSERT INTO public.service_orders (id, vehicle_id, specialist_id, status, classification, created_at, updated_at, client_id, order_code, source_inspection_id, category_id)
SELECT '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'completed', 'maintenance', NOW(), NOW(), '550e8400-e29b-41d4-a716-446655440002', 'OS-TEST-001', '550e8400-e29b-41d4-a716-446655440004', sc.id
FROM public.service_categories sc
WHERE sc.key = 'mechanics'
ON CONFLICT (id) DO NOTHING;
"

# Criar orçamento
echo "Criando orçamento..."
query_db "
INSERT INTO public.quotes (id, service_order_id, partner_id, total_value, status, created_at, updated_at)
VALUES ('550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440001', 850.00, 'approved', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
"

# Criar serviços do orçamento
echo "Criando serviços do orçamento..."
query_db "
INSERT INTO public.services (id, quote_id, description, value, status, estimated_days, created_at)
VALUES ('550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440008', 'Troca de óleo', 150.00, 'completed', 1, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.services (id, quote_id, description, value, status, estimated_days, created_at)
VALUES ('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440008', 'Troca de filtros', 200.00, 'completed', 1, NOW())
ON CONFLICT (id) DO NOTHING;
"

echo ""
echo "3. Verificando dados criados..."

# Verificar dados criados
PARTNERS_CREATED=$(psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -c "SELECT COUNT(*) FROM public.partners;" 2>/dev/null | xargs)
INSPECTIONS_CREATED=$(psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -c "SELECT COUNT(*) FROM public.inspections WHERE finalized = true;" 2>/dev/null | xargs)
QUOTES_CREATED=$(psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -c "SELECT COUNT(*) FROM public.quotes;" 2>/dev/null | xargs)

echo "✅ Dados de teste criados com sucesso!"
echo "   • Parceiros: $PARTNERS_CREATED"
echo "   • Inspeções finalizadas: $INSPECTIONS_CREATED"
echo "   • Orçamentos: $QUOTES_CREATED"

echo ""
echo "Agora você pode executar os scripts de teste:"
echo "  ./scripts/test-partner-categories.sh"
echo "  ./scripts/test-finalized-inspections.sh"
echo "  ./scripts/test-all.sh"

echo ""
echo "=== Fim da criação de dados de teste ==="
