#!/bin/bash
# Script de Verificação de Dependências - Partner Checklist
# Verifica se arquivos suspeitos estão em uso antes de deletar

echo "🔍 AUDITORIA DE DEPENDÊNCIAS - PARTNER CHECKLIST"
echo "================================================"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para contar usos
check_usage() {
    local pattern=$1
    local description=$2
    local count=$(grep -r "$pattern" --include="*.ts" --include="*.tsx" . 2>/dev/null | wc -l)
    
    if [ $count -eq 0 ]; then
        echo -e "${GREEN}✅ SEGURO DELETAR${NC}: $description (0 usos)"
    elif [ $count -lt 5 ]; then
        echo -e "${YELLOW}⚠️  POUCOS USOS${NC}: $description ($count usos)"
    else
        echo -e "${RED}❌ EM USO${NC}: $description ($count usos)"
    fi
    
    return $count
}

echo "📁 Verificando arquivos suspeitos..."
echo ""

# 1. dynamic-checklist
echo "1️⃣  dynamic-checklist/"
check_usage "dynamic-checklist" "Pasta dynamic-checklist"
echo ""

# 2. usePartnerChecklist (modules/partner)
echo "2️⃣  modules/partner/hooks/usePartnerChecklist.ts"
check_usage "from '@/modules/partner/hooks/usePartnerChecklist" "Hook usePartnerChecklist (partner)"
echo ""

# 3. API exists
echo "3️⃣  /api/partner/checklist/exists"
check_usage "/api/partner/checklist/exists" "Endpoint /exists"
echo ""

# 4. save-anomalies
echo "4️⃣  /api/partner/checklist/save-anomalies"
check_usage "/api/partner/checklist/save-anomalies" "Endpoint /save-anomalies"
echo ""

# 5. load-anomalies
echo "5️⃣  /api/partner/checklist/load-anomalies"
check_usage "/api/partner/checklist/load-anomalies" "Endpoint /load-anomalies"
echo ""

# 6. Backups
echo "6️⃣  Arquivos .backup e .original"
backup_count=$(find . -name "*.backup" -o -name "*.original" | wc -l)
if [ $backup_count -eq 0 ]; then
    echo -e "${GREEN}✅ Nenhum backup encontrado${NC}"
else
    echo -e "${YELLOW}⚠️  $backup_count arquivos de backup encontrados:${NC}"
    find . -name "*.backup" -o -name "*.original"
fi
echo ""

echo "================================================"
echo "📊 RESUMO DA ANÁLISE"
echo "================================================"
echo ""

# Arquivos seguros para deletar
echo -e "${GREEN}✅ SEGUROS PARA DELETAR:${NC}"
echo "   • Arquivos .backup e .original (se existirem)"
echo ""

# Arquivos que NÃO podem ser deletados
echo -e "${RED}❌ NÃO DELETAR (EM USO):${NC}"
echo "   • dynamic-checklist/ (usado por parceiros não-mecânicos)"
echo "   • usePartnerChecklist.ts (usado por dynamic-checklist)"
echo "   • /api/partner/checklist/exists (usado por cache)"
echo "   • Endpoints de anomalies (usados por dynamic-checklist)"
echo ""

# Próximos passos
echo "🎯 PRÓXIMOS PASSOS:"
echo "   1. Deletar backups com segurança"
echo "   2. Testar checklist-v2 para todas as categorias"
echo "   3. Consolidar as 3 páginas em uma só"
echo ""

# Detalhes de usos
echo "================================================"
echo "📋 DETALHES DOS USOS (para referência)"
echo "================================================"
echo ""

echo "🔎 Arquivos que importam de dynamic-checklist:"
grep -r "from '@/app/dashboard/partner/dynamic-checklist" --include="*.ts" --include="*.tsx" . 2>/dev/null | cut -d: -f1 | sort | uniq
echo ""

echo "🔎 Arquivos que usam usePartnerChecklist (partner):"
grep -r "from '@/modules/partner/hooks/usePartnerChecklist" --include="*.ts" --include="*.tsx" . 2>/dev/null | cut -d: -f1 | sort | uniq
echo ""

echo "🔎 Arquivos que chamam /exists:"
grep -r "/api/partner/checklist/exists" --include="*.ts" --include="*.tsx" . 2>/dev/null | cut -d: -f1 | sort | uniq
echo ""

echo "✨ Auditoria concluída!"
echo ""
echo "📄 Relatório completo: docs/CHECKLIST_ENDPOINT_AUDIT.md"
echo "📊 Resumo executivo: docs/CHECKLIST_EXECUTIVE_SUMMARY.md"
