#!/bin/bash

echo "=== Teste: Verificar Análises Finalizadas e Categorias de Serviço ==="

# Configurações
BASE_URL="http://localhost:3000"

# Função para consultar o banco
query_db() {
    local query="$1"
    psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -c "$query" 2>/dev/null
}

echo "1. Verificando inspeções finalizadas..."

# Buscar inspeções finalizadas
FINALIZED_INSPECTIONS=$(query_db "
    SELECT
        i.id,
        i.vehicle_id,
        v.plate,
        v.brand || ' ' || v.model as vehicle_info,
        pr.full_name as client_name,
        i.finalized,
        i.created_at
    FROM public.inspections i
    JOIN public.vehicles v ON i.vehicle_id = v.id
    JOIN public.profiles pr ON v.client_id = pr.id
    WHERE i.finalized = true
    ORDER BY i.created_at DESC;
")

if [ -z "$FINALIZED_INSPECTIONS" ]; then
    echo "❌ Nenhuma inspeção finalizada encontrada."
else
    echo "✅ Inspeções finalizadas encontradas:"
    echo ""
    FINALIZED_COUNT=$(echo "$FINALIZED_INSPECTIONS" | wc -l)
    echo "Total de inspeções finalizadas: $FINALIZED_COUNT"
    echo ""

    echo "$FINALIZED_INSPECTIONS" | while IFS='|' read -r id vehicle_id plate vehicle_info client_name finalized created; do
        echo "  📋 Inspeção ID: $id"
        echo "     Veículo: $plate - $vehicle_info"
        echo "     Cliente: $client_name"
        echo "     Finalizada: $finalized"
        echo "     Criada em: $created"
        echo ""
    done
fi

echo "2. Verificando categorias de serviço selecionadas nas inspeções..."

# Buscar serviços das inspeções finalizadas
INSPECTION_SERVICES=$(query_db "
    SELECT
        i.id as inspection_id,
        v.plate,
        is2.category,
        COUNT(is2.id) as servicos_por_categoria,
        STRING_AGG(is2.notes, '; ') as servicos_descricao
    FROM public.inspections i
    JOIN public.vehicles v ON i.vehicle_id = v.id
    LEFT JOIN public.inspection_services is2 ON i.id = is2.inspection_id
    WHERE i.finalized = true
    GROUP BY i.id, v.plate, is2.category
    ORDER BY i.id, is2.category;
")

if [ -z "$INSPECTION_SERVICES" ]; then
    echo "❌ Nenhuma categoria de serviço encontrada nas inspeções finalizadas."
else
    echo "✅ Categorias de serviço nas inspeções finalizadas:"
    echo ""

    echo "$INSPECTION_SERVICES" | while IFS='|' read -r inspection_id plate categoria servicos_count servicos_desc; do
        echo "  🔧 Inspeção $inspection_id (Veículo: $plate)"
        if [ "$categoria" = "" ]; then
            echo "     ⚠️  Sem categoria definida"
        else
            echo "     📂 Categoria: $categoria"
            echo "     🔢 Serviços nesta categoria: $servicos_count"
            if [ "$servicos_desc" != "" ]; then
                echo "     📝 Serviços: $servicos_desc"
            fi
        fi
        echo ""
    done
fi

echo "3. Estatísticas gerais de categorias de serviço..."

# Estatísticas de categorias mais utilizadas
CATEGORY_STATS=$(query_db "
    SELECT
        is2.category,
        COUNT(DISTINCT i.id) as inspections_finalizadas,
        COUNT(is2.id) as total_servicos,
        COUNT(DISTINCT v.client_id) as clientes_unicos
    FROM public.inspection_services is2
    LEFT JOIN public.inspections i ON is2.inspection_id = i.id AND i.finalized = true
    LEFT JOIN public.vehicles v ON i.vehicle_id = v.id
    GROUP BY is2.category
    ORDER BY inspections_finalizadas DESC, total_servicos DESC;
")

echo "📊 Estatísticas de uso das categorias:"
echo "$CATEGORY_STATS" | while IFS='|' read -r categoria inspections servicos clientes; do
    echo "  $categoria:"
    echo "    Inspeções finalizadas: $inspections"
    echo "    Total de serviços: $servicos"
    echo "    Clientes únicos: $clientes"
    echo ""
done

echo "4. Verificando ordens de serviço geradas a partir das inspeções..."

# Verificar ordens de serviço geradas
SERVICE_ORDERS_FROM_INSPECTIONS=$(query_db "
    SELECT
        so.id as service_order_id,
        so.order_code,
        i.id as inspection_id,
        v.plate,
        pr.full_name as client_name,
        sc.name as categoria_principal,
        so.status,
        so.created_at,
        so.final_delivery_date
    FROM public.service_orders so
    JOIN public.inspections i ON so.source_inspection_id = i.id
    JOIN public.vehicles v ON so.vehicle_id = v.id
    JOIN public.profiles pr ON so.client_id = pr.id
    LEFT JOIN public.service_categories sc ON so.category_id = sc.id
    WHERE i.finalized = true
    ORDER BY so.created_at DESC;
")

if [ -z "$SERVICE_ORDERS_FROM_INSPECTIONS" ]; then
    echo "❌ Nenhuma ordem de serviço gerada a partir de inspeções finalizadas."
else
    echo "✅ Ordens de serviço geradas a partir de inspeções:"
    echo ""

    SO_COUNT=$(echo "$SERVICE_ORDERS_FROM_INSPECTIONS" | wc -l)
    echo "Total de ordens de serviço: $SO_COUNT"
    echo ""

    echo "$SERVICE_ORDERS_FROM_INSPECTIONS" | while IFS='|' read -r so_id order_code inspection_id plate client_name categoria status created final_date; do
        echo "  📋 OS: $order_code (ID: $so_id)"
        echo "     Inspeção origem: $inspection_id"
        echo "     Veículo: $plate"
        echo "     Cliente: $client_name"
        echo "     Categoria: ${categoria:-'Não definida'}"
        echo "     Status: $status"
        echo "     Criada em: $created"
        if [ "$final_date" != "" ]; then
            echo "     Finalizada em: $final_date"
        fi
        echo ""
    done
fi

echo "5. Verificando orçamentos gerados para essas ordens de serviço..."

# Verificar orçamentos relacionados
QUOTES_FROM_INSPECTIONS=$(query_db "
    SELECT
        q.id as quote_id,
        so.order_code,
        p.company_name as partner_name,
        q.total_value,
        q.status as quote_status,
        q.created_at,
        COUNT(s.id) as servicos_orcados
    FROM public.quotes q
    JOIN public.service_orders so ON q.service_order_id = so.id
    JOIN public.inspections i ON so.source_inspection_id = i.id
    JOIN public.partners part ON q.partner_id = part.profile_id
    JOIN public.profiles p ON part.profile_id = p.id
    LEFT JOIN public.services s ON q.id = s.quote_id
    WHERE i.finalized = true
    GROUP BY q.id, so.order_code, p.company_name, q.total_value, q.status, q.created_at
    ORDER BY q.created_at DESC;
")

if [ -z "$QUOTES_FROM_INSPECTIONS" ]; then
    echo "❌ Nenhum orçamento encontrado para inspeções finalizadas."
else
    echo "✅ Orçamentos gerados:"
    echo ""

    QUOTES_COUNT=$(echo "$QUOTES_FROM_INSPECTIONS" | wc -l)
    echo "Total de orçamentos: $QUOTES_COUNT"
    echo ""

    echo "$QUOTES_FROM_INSPECTIONS" | while IFS='|' read -r quote_id order_code partner_name total_value status created servicos_count; do
        echo "  💰 Orçamento ID: $quote_id"
        echo "     OS: $order_code"
        echo "     Parceiro: $partner_name"
        echo "     Valor total: R$ $total_value"
        echo "     Status: $status"
        echo "     Serviços orçados: $servicos_count"
        echo "     Criado em: $created"
        echo ""
    done
fi

echo ""
echo "=== Fim do teste ==="
