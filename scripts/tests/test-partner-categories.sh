#!/bin/bash

echo "=== Teste: Verificar Categoria do Parceiro Cadastrado ==="

# Configurações
BASE_URL="http://localhost:3000"

# Função para consultar o banco
query_db() {
    local query="$1"
    psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -c "$query" 2>/dev/null
}

echo "1. Verificando parceiros cadastrados..."

# Buscar todos os parceiros
PARTNERS=$(query_db "
    SELECT
        p.profile_id,
        pr.full_name,
        p.company_name,
        p.cnpj,
        p.is_active,
        p.created_at
    FROM public.partners p
    JOIN public.profiles pr ON p.profile_id = pr.id
    ORDER BY p.created_at DESC;
")

if [ -z "$PARTNERS" ]; then
    echo "❌ Nenhum parceiro encontrado no banco de dados."
    exit 1
fi

echo "Parceiros encontrados:"
echo "$PARTNERS" | while IFS='|' read -r profile_id name company cnpj active created; do
    echo "  ID: $profile_id"
    echo "  Nome: $name"
    echo "  Empresa: $company"
    echo "  CNPJ: $cnpj"
    echo "  Ativo: $active"
    echo "  Criado em: $created"
    echo ""
done

echo "2. Verificando categorias de serviço disponíveis..."

# Buscar categorias disponíveis
CATEGORIES=$(query_db "
    SELECT key, name
    FROM public.service_categories
    ORDER BY name;
")

echo "Categorias disponíveis:"
echo "$CATEGORIES" | while IFS='|' read -r key name; do
    echo "  $key: $name"
done
echo ""

# Pegar o primeiro parceiro para análise detalhada
FIRST_PARTNER_ID=$(echo "$PARTNERS" | head -1 | cut -d'|' -f1 | xargs)

if [ -n "$FIRST_PARTNER_ID" ]; then
    echo "3. Analisando categorias do primeiro parceiro (ID: $FIRST_PARTNER_ID)..."

    # Buscar categorias do parceiro
    PARTNER_CATEGORIES=$(query_db "
        SELECT
            sc.key,
            sc.name,
            psc.priority,
            psc.created_at
        FROM public.partners_service_categories psc
        JOIN public.service_categories sc ON psc.category_id = sc.id
        WHERE psc.partner_id = '$FIRST_PARTNER_ID'
        ORDER BY psc.priority DESC, sc.name;
    ")

    if [ -z "$PARTNER_CATEGORIES" ]; then
        echo "❌ Este parceiro não possui categorias de serviço associadas."
    else
        echo "✅ Categorias associadas ao parceiro:"
        echo "$PARTNER_CATEGORIES" | while IFS='|' read -r key name priority created; do
            echo "  - $name ($key) - Prioridade: $priority"
        done
    fi

    echo ""
    echo "4. Verificando estatísticas de orçamentos por categoria..."

    # Estatísticas de orçamentos por categoria
    BUDGET_STATS=$(query_db "
        SELECT
            sc.name as categoria,
            COUNT(q.id) as total_orcamentos,
            COUNT(q.id) FILTER (WHERE q.status = 'approved') as aprovados,
            COUNT(q.id) FILTER (WHERE q.status = 'rejected') as rejeitados,
            COUNT(q.id) FILTER (WHERE q.status IN ('pending_admin_approval', 'pending_client_approval')) as pendentes
        FROM public.service_categories sc
        LEFT JOIN public.service_orders so ON so.category_id = sc.id
        LEFT JOIN public.quotes q ON q.service_order_id = so.id AND q.partner_id = '$FIRST_PARTNER_ID'
        GROUP BY sc.id, sc.name
        ORDER BY total_orcamentos DESC;
    ")

    echo "Estatísticas de orçamentos por categoria:"
    echo "$BUDGET_STATS" | while IFS='|' read -r categoria total aprovados rejeitados pendentes; do
        echo "  $categoria:"
        echo "    Total: $total | Aprovados: $aprovados | Rejeitados: $rejeitados | Pendentes: $pendentes"
    done
fi

echo ""
echo "5. Testando API de dashboard do parceiro..."

# Testar API do dashboard do parceiro (se existir)
if [ -n "$FIRST_PARTNER_ID" ]; then
    echo "Testando endpoint: ${BASE_URL}/api/partner/dashboard"
    echo "Com partner_id: $FIRST_PARTNER_ID"

    # Aqui você precisaria de um token válido do parceiro para testar a API
    echo "⚠️  Nota: Para testar a API completamente, seria necessário um token JWT válido do parceiro."
fi

echo ""
echo "=== Fim do teste ==="
