#!/bin/bash

echo "🧪 Teste Final - Ordem de Serviço"
echo "=================================="
echo ""

QUOTE_ID="9c95b7de-d3a1-42d2-aaca-783b04319870"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vMTI3LjAuMC4xOjU0MzIxL2F1dGgvdjEiLCJzdWIiOiI1ZDBhZTIwNi02NzVkLTQ1Y2YtYjcxZi03NWFhMTVjMTM5ODkiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYwMDA4MTQwLCJpYXQiOjE3NjAwMDQ1NDAsImVtYWlsIjoicGludHVyYUBwYXJjZWlyby5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmdWxsX25hbWUiOiJQYXJjZWlybyBGdW5pbGFyaWEvUGludHVyYSIsInByb2ZpbGVfaWQiOiI1ZDBhZTIwNi02NzVkLTQ1Y2YtYjcxZi03NWFhMTVjMTM5ODkiLCJyb2xlIjoicGFydG5lciJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzYwMDA0NTQwfV0sInNlc3Npb25faWQiOiJlN2UyYWQzMy1kN2Y5LTQxMTUtYjdlOC0zZmFhNzEwN2VhNjIiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.-3YfnUM0A0K1lkeGRGPE8Zk410VhsHC0EXDXLF7cQ70"

echo "📋 Quote ID: $QUOTE_ID"
echo ""

# Teste 1: API Endpoint
echo "1️⃣ Testando API Endpoint..."
echo "GET /api/partner/service-order/$QUOTE_ID"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" \
  "http://localhost:3000/api/partner/service-order/$QUOTE_ID" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Status: 200 OK"
  echo ""
  
  # Validar estrutura da resposta
  echo "📊 Dados Retornados:"
  echo "$BODY" | python3 -c "
import sys, json
data = json.load(sys.stdin)
so = data.get('serviceOrder', {})

print(f'   ID: {so.get(\"id\", \"N/A\")[:8]}...')
print(f'   Status: {so.get(\"status\", \"N/A\")}')
print(f'   Dias estimados: {so.get(\"estimated_days\", 0)}')
print()
print(f'   🚗 Veículo:')
vehicle = so.get('vehicle', {})
print(f'      Placa: {vehicle.get(\"plate\", \"N/A\")}')
print(f'      Modelo: {vehicle.get(\"brand\", \"N/A\")} {vehicle.get(\"model\", \"N/A\")} ({vehicle.get(\"year\", \"N/A\")})')
print()
print(f'   🏢 Parceiro:')
partner = so.get('partner', {})
print(f'      Empresa: {partner.get(\"company_name\", \"N/A\")}')
print(f'      Contato: {partner.get(\"contact_name\", \"N/A\")}')
print(f'      Telefone: {partner.get(\"phone\", \"N/A\")}')
print()
print(f'   👤 Cliente:')
client = so.get('client', {})
print(f'      Nome: {client.get(\"name\", \"N/A\")}')
print(f'      Email: {client.get(\"email\", \"N/A\")}')
print(f'      Telefone: {client.get(\"phone\", \"N/A\")}')
print()
items = so.get('items', [])
print(f'   📋 Itens: {len(items)} serviço(s)')
for i, item in enumerate(items, 1):
    print(f'      {i}. {item.get(\"description\", \"N/A\")} (Qtd: {item.get(\"quantity\", 0)})')
    # Verificar que não tem preços
    if 'unit_price' in item or 'total_price' in item:
        print('      ⚠️  AVISO: Item contém preços!')
"
  echo ""
  
  # Verificar que não há preços nos itens
  HAS_PRICES=$(echo "$BODY" | grep -o "unit_price\|total_price" | wc -l)
  if [ "$HAS_PRICES" -eq 0 ]; then
    echo "✅ Confirmado: Nenhum preço nos itens"
  else
    echo "❌ ERRO: Itens contêm preços!"
  fi
  
else
  echo "❌ Status: $HTTP_CODE"
  echo "$BODY"
fi

echo ""
echo "=================================="
echo ""

# Teste 2: Página de Visualização
echo "2️⃣ Informações da Página:"
echo "URL: http://localhost:3000/dashboard/partner/service-order?quoteId=$QUOTE_ID"
echo ""
echo "📝 Para testar manualmente:"
echo "   1. Faça login como parceiro (pintura@parceiro.com)"
echo "   2. Vá para o dashboard"
echo "   3. Na seção 'Orçamentos Aprovados'"
echo "   4. Clique no botão verde de download"
echo "   5. Verifique se a OS abre corretamente"
echo "   6. Clique em 'Imprimir / Baixar PDF'"
echo "   7. Salve como PDF e verifique o resultado"
echo ""

echo "✅ Teste concluído!"
