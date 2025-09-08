#!/bin/bash

# Script para alternar entre ambientes Supabase (local/produção)
# Uso: ./switch-env.sh [local|production]

if [ "$1" = "local" ]; then
    echo "🔄 Mudando para ambiente LOCAL..."
    
    # Verificar se arquivo local existe
    if [ ! -f ".env.local.local" ]; then
        echo "❌ Arquivo .env.local.local não encontrado!"
        echo "📝 Crie o arquivo com as configurações locais do Supabase"
        exit 1
    fi
    
    # Fazer backup da configuração atual
    cp .env.local .env.local.backup
    
    # Aplicar configuração local
    cp .env.local.local .env.local
    
    echo "✅ Ambiente LOCAL ativado"
    echo ""
    echo "🌐 URLs disponíveis:"
    echo "  📊 Supabase Studio: http://127.0.0.1:54323"
    echo "  📧 Inbucket (emails): http://127.0.0.1:54324"
    echo "  🔌 API Local: http://127.0.0.1:54321"
    echo "  🖥️  Aplicação: http://localhost:3000"
    echo ""
    echo "💡 Para iniciar os serviços: supabase start"
    
elif [ "$1" = "production" ]; then
    echo "🔄 Mudando para ambiente PRODUÇÃO..."
    
    # Verificar se existe backup da produção
    if [ -f ".env.production.backup" ]; then
        cp .env.production.backup .env.local
        echo "✅ Configuração de PRODUÇÃO restaurada"
    elif [ -f ".env.local.backup" ]; then
        cp .env.local.backup .env.local
        echo "✅ Configuração anterior restaurada"
    else
        echo "⚠️  Nenhum backup encontrado"
        echo "� Verifique manualmente as configurações de produção"
    fi
    
    echo "🌍 Ambiente PRODUÇÃO ativado"
    
elif [ "$1" = "status" ]; then
    echo "📋 Status dos ambientes:"
    echo ""
    
    # Verificar qual ambiente está ativo
    if grep -q "127.0.0.1" .env.local 2>/dev/null; then
        echo "✅ Ambiente atual: LOCAL"
        echo "� API: $(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d'=' -f2)"
    else
        echo "✅ Ambiente atual: PRODUÇÃO"
        echo "🔌 API: $(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d'=' -f2 2>/dev/null || echo 'URL não encontrada')"
    fi
    
    echo ""
    echo "📁 Arquivos disponíveis:"
    [ -f ".env.local" ] && echo "  ✅ .env.local (ativo)"
    [ -f ".env.local.local" ] && echo "  ✅ .env.local.local (configuração local)"
    [ -f ".env.production.backup" ] && echo "  ✅ .env.production.backup (backup produção)"
    [ -f ".env.local.backup" ] && echo "  ✅ .env.local.backup (backup anterior)"
    
    echo ""
    echo "🐳 Status do Supabase local:"
    if command -v supabase >/dev/null 2>&1; then
        supabase status 2>/dev/null || echo "  ❌ Supabase local não está rodando"
    else
        echo "  ⚠️  Supabase CLI não instalado"
    fi
    
else
    echo "🚀 Script de Gerenciamento de Ambientes Supabase"
    echo ""
    echo "📝 Uso: ./switch-env.sh [comando]"
    echo ""
    echo "📋 Comandos disponíveis:"
    echo "  local      - Ativar ambiente local (sem rate limits)"
    echo "  production - Ativar ambiente de produção"
    echo "  status     - Mostrar status atual dos ambientes"
    echo ""
    echo "💡 Exemplos:"
    echo "  ./switch-env.sh local      # Usar Supabase local"
    echo "  ./switch-env.sh production # Usar Supabase produção"
    echo "  ./switch-env.sh status     # Ver ambiente atual"
    echo ""
    echo "🔧 Configuração necessária:"
    echo "  📄 .env.local.local        # Configurações do ambiente local"
    echo "  📄 .env.production.backup  # Backup das configurações de produção"
fi
        echo ""
        echo "Status atual:"
        if grep -q "127.0.0.1:54321" "$CURRENT_ENV" 2>/dev/null; then
            echo "  🏠 Ambiente LOCAL ativo"
        else
            echo "  ☁️ Ambiente PRODUÇÃO ativo"
        fi
        ;;
esac
