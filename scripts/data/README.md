# Scripts de Dados

Esta pasta contém scripts para **população e geração de dados de teste**. Estes scripts modificam o
banco de dados e devem ser usados com cuidado.

## ⚠️ Atenção

**Estes scripts MODIFICAM o banco de dados!**

- Faça backup antes de executar
- Use apenas em ambientes de desenvolvimento/homologação
- Não execute em produção

## 📋 Scripts Disponíveis

### Scripts de População

- `populate-partner-services.js` - Popula serviços dos parceiros com categorias
- `populate-partner-categories.js` - Popula categorias dos parceiros
- `populate-partner-categories.sh` - Versão shell do script acima

### Scripts de Geração de Dados

- `create-test-data.sh` - Cria conjunto completo de dados de teste
- `create-test-inspection.js` - Cria inspeções de teste
- `generate-report.sh` - Gera relatórios de dados

### Scripts de Verificação

- `verify-partner-services.js` - Verifica serviços criados pelos scripts de população
- `add-missing-categories.js` - Adiciona categorias que estão faltando

## 🚀 Ordem Recomendada de Execução

```bash
# 1. Criar dados básicos de teste
./create-test-data.sh

# 2. Popular categorias dos parceiros
./populate-partner-categories.js

# 3. Popular serviços dos parceiros
./populate-partner-services.js

# 4. Verificar se tudo foi criado corretamente
./verify-partner-services.js
```

## 📊 O que Cada Script Faz

### `populate-partner-services.js`

- Cria serviços organizados por categoria
- Cada parceiro recebe serviços específicos
- Serviços incluem preços e descrições realistas
- Suporte a subcategorias para melhor organização

### `populate-partner-categories.js`

- Associa categorias aos parceiros existentes
- Cria relacionamento entre partners e categories
- Essencial para o funcionamento do sistema de orçamentos

### `create-test-data.sh`

- Cria usuários de teste (clientes, parceiros, especialistas)
- Gera veículos de teste
- Prepara ambiente completo para testes

## 🔍 Verificação

Após executar os scripts de população:

```bash
# Verificar serviços criados
./verify-partner-services.js

# Este script mostra:
# - Quantos parceiros têm serviços
# - Quantos serviços foram criados
# - Organização por categoria
# - Estatísticas gerais
```

## 🎯 Quando Usar

- **Setup inicial:** Preparar ambiente de desenvolvimento
- **Testes funcionais:** Criar dados para testar fluxos
- **Demonstrações:** Popular dados para apresentações
- **Debugging:** Criar cenários específicos para teste

## 📝 Resultados Esperados

Após execução completa:

- ✅ 7+ parceiros com serviços
- ✅ 50+ serviços criados
- ✅ Categorias organizadas (Mecânica, Pintura, Lavagem, etc.)
- ✅ Preços e descrições realistas
- ✅ Relacionamentos corretos no banco

---

**Use com responsabilidade - estes scripts modificam dados!**
