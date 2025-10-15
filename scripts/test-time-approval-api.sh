#!/bin/bash

# Script para testar a API de aprovação de prazos
# Uso: ./test-time-approval-api.sh

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Teste da API de Aprovação de Prazos ===${NC}\n"

# 1. Obter token (assumindo que você já está logado no navegador)
echo -e "${YELLOW}1. Obtendo token do especialista...${NC}"
echo "Por favor, cole o token do Authorization header:"
read -r TOKEN

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Token não fornecido${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Token recebido${NC}\n"

# 2. Testar listagem de orçamentos pendentes
echo -e "${YELLOW}2. Testando GET /api/specialist/quotes/pending-time-approval${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  'http://localhost:3000/api/specialist/quotes/pending-time-approval' \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ Status: $HTTP_CODE${NC}"
    echo -e "${GREEN}Response:${NC}"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
    
    # Extrair primeiro quote ID se existir
    QUOTE_ID=$(echo "$BODY" | jq -r '.data[0].id // empty' 2>/dev/null)
    
    if [ -n "$QUOTE_ID" ]; then
        echo -e "\n${YELLOW}3. Quote encontrado: $QUOTE_ID${NC}"
        echo "Deseja testar aprovação deste quote? (s/n)"
        read -r APPROVE
        
        if [ "$APPROVE" = "s" ]; then
            echo -e "${YELLOW}Escolha uma ação:${NC}"
            echo "1. Aprovar todos os prazos"
            echo "2. Solicitar revisão"
            read -r ACTION_CHOICE
            
            if [ "$ACTION_CHOICE" = "1" ]; then
                ACTION_DATA='{"action": "approved", "comments": "Prazos aprovados via teste automatizado"}'
            else
                echo "Digite o ID do item para solicitar revisão:"
                read -r ITEM_ID
                echo "Digite o prazo sugerido (em dias):"
                read -r SUGGESTED_DAYS
                echo "Digite o motivo:"
                read -r REASON
                
                ACTION_DATA=$(cat <<EOF
{
  "action": "revision_requested",
  "comments": "Revisão solicitada via teste automatizado",
  "revision_requests": {
    "$ITEM_ID": {
      "suggested_days": $SUGGESTED_DAYS,
      "reason": "$REASON"
    }
  }
}
EOF
)
            fi
            
            echo -e "\n${YELLOW}4. Enviando revisão...${NC}"
            REVIEW_RESPONSE=$(curl -s -w "\n%{http_code}" \
              "http://localhost:3000/api/specialist/quotes/$QUOTE_ID/review-times" \
              -X POST \
              -H "Authorization: Bearer $TOKEN" \
              -H "Content-Type: application/json" \
              -d "$ACTION_DATA")
            
            REVIEW_HTTP_CODE=$(echo "$REVIEW_RESPONSE" | tail -n 1)
            REVIEW_BODY=$(echo "$REVIEW_RESPONSE" | head -n -1)
            
            if [ "$REVIEW_HTTP_CODE" -eq 200 ]; then
                echo -e "${GREEN}✓ Revisão enviada com sucesso!${NC}"
                echo "$REVIEW_BODY" | jq . 2>/dev/null || echo "$REVIEW_BODY"
            else
                echo -e "${RED}❌ Erro ao enviar revisão: Status $REVIEW_HTTP_CODE${NC}"
                echo "$REVIEW_BODY"
            fi
        fi
    else
        echo -e "${YELLOW}ℹ Nenhum quote pendente encontrado${NC}"
    fi
else
    echo -e "${RED}❌ Status: $HTTP_CODE${NC}"
    echo -e "${RED}Error Response:${NC}"
    echo "$BODY"
fi

echo -e "\n${YELLOW}=== Teste Concluído ===${NC}"