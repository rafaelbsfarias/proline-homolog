#!/usr/bin/env node
/**
 * Script de teste para validar o fluxo UI do checklist dinâmico
 * 
 * Valida:
 * 1. Endpoint /init retorna vehicle + template
 * 2. Dados do veículo estão completos
 * 3. Campos de inspeção básica
 * 4. Template carregado corretamente
 */

const API_BASE = 'http://localhost:3000/api/partner';

// IDs de teste - ajuste conforme necessário
const TEST_VEHICLE_ID = '123e4567-e89b-12d3-a456-426614174000';
const TEST_QUOTE_ID = '223e4567-e89b-12d3-a456-426614174000';

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

async function testChecklistInit() {
  log('\n🧪 Teste: Inicialização do Checklist com Veículo', 'cyan');
  log('='.repeat(60), 'cyan');
  
  try {
    const url = `${API_BASE}/checklist/init?vehicleId=${TEST_VEHICLE_ID}&quoteId=${TEST_QUOTE_ID}`;
    log(`\n📡 GET ${url}`, 'blue');
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      log(`\n❌ Erro HTTP ${response.status}`, 'red');
      log(`Mensagem: ${data.message || 'Sem mensagem'}`, 'red');
      return false;
    }
    
    log('\n✅ Resposta recebida com sucesso', 'green');
    
    // Validar estrutura da resposta
    if (!data.data) {
      log('❌ Faltando data na resposta', 'red');
      return false;
    }
    
    const { vehicle, template, category } = data.data;
    
    // Validar dados do veículo
    log('\n📋 Validando dados do veículo:', 'yellow');
    if (!vehicle) {
      log('❌ Dados do veículo não encontrados', 'red');
      return false;
    }
    
    const vehicleFields = ['id', 'brand', 'model', 'year', 'plate', 'color', 'status'];
    let vehicleValid = true;
    
    vehicleFields.forEach(field => {
      if (vehicle[field] !== undefined) {
        log(`  ✅ ${field}: ${vehicle[field]}`, 'green');
      } else {
        log(`  ⚠️  ${field}: não presente`, 'yellow');
        if (field !== 'color' && field !== 'year') { // Campos opcionais
          vehicleValid = false;
        }
      }
    });
    
    if (!vehicleValid) {
      log('❌ Dados do veículo incompletos', 'red');
      return false;
    }
    
    // Validar template
    log('\n📋 Validando template:', 'yellow');
    if (!template) {
      log('❌ Template não encontrado', 'red');
      return false;
    }
    
    log(`  ✅ Título: ${template.title}`, 'green');
    log(`  ✅ Versão: ${template.version}`, 'green');
    log(`  ✅ Categoria: ${category}`, 'green');
    log(`  ✅ Seções: ${template.sections?.length || 0}`, 'green');
    
    // Contar itens totais
    const totalItems = template.sections?.reduce((acc, section) => 
      acc + (section.items?.length || 0), 0
    ) || 0;
    log(`  ✅ Total de itens: ${totalItems}`, 'green');
    
    // Validar campos de inspeção básica (devem ser tratados no frontend)
    log('\n📋 Campos de inspeção esperados no frontend:', 'yellow');
    const inspectionFields = ['date', 'odometer', 'fuelLevel', 'observations'];
    inspectionFields.forEach(field => {
      log(`  ℹ️  ${field} (gerenciado pelo componente)`, 'blue');
    });
    
    log('\n✅ TESTE PASSOU - Estrutura completa!', 'green');
    log('='.repeat(60), 'cyan');
    return true;
    
  } catch (error) {
    log(`\n❌ TESTE FALHOU - Erro: ${error.message}`, 'red');
    if (error.cause) {
      log(`Causa: ${error.cause}`, 'red');
    }
    log('='.repeat(60), 'cyan');
    return false;
  }
}

async function testMultipleCategories() {
  log('\n🧪 Teste: Múltiplas Categorias de Parceiros', 'cyan');
  log('='.repeat(60), 'cyan');
  
  const categories = [
    'funilaria',
    'mecanica',
    'eletrica',
    'suspensao',
    'borracharia',
    'lavagem'
  ];
  
  let allPassed = true;
  
  for (const category of categories) {
    try {
      const url = `${API_BASE}/checklist/templates/${category}`;
      log(`\n📡 GET ${url}`, 'blue');
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok && data.data) {
        log(`  ✅ ${category}: ${data.data.sections?.length || 0} seções`, 'green');
      } else {
        log(`  ❌ ${category}: Erro ao carregar`, 'red');
        allPassed = false;
      }
    } catch (error) {
      log(`  ❌ ${category}: ${error.message}`, 'red');
      allPassed = false;
    }
  }
  
  log('\n' + '='.repeat(60), 'cyan');
  return allPassed;
}

async function main() {
  log('\n🚀 Iniciando testes do Checklist UI', 'cyan');
  log(`📍 Base URL: ${API_BASE}`, 'blue');
  log(`🆔 Vehicle ID: ${TEST_VEHICLE_ID}`, 'blue');
  log(`🆔 Quote ID: ${TEST_QUOTE_ID}`, 'blue');
  
  const results = {
    checklistInit: await testChecklistInit(),
    multipleCategories: await testMultipleCategories(),
  };
  
  // Resumo
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 RESUMO DOS TESTES', 'cyan');
  log('='.repeat(60), 'cyan');
  
  Object.entries(results).forEach(([test, passed]) => {
    const icon = passed ? '✅' : '❌';
    const color = passed ? 'green' : 'red';
    log(`${icon} ${test}: ${passed ? 'PASSOU' : 'FALHOU'}`, color);
  });
  
  const allPassed = Object.values(results).every(r => r === true);
  log('\n' + '='.repeat(60), 'cyan');
  
  if (allPassed) {
    log('✅ Todos os testes passaram com sucesso!', 'green');
    process.exit(0);
  } else {
    log('❌ Alguns testes falharam', 'red');
    log('\n💡 Dicas:', 'yellow');
    log('  - Verifique se o servidor está rodando', 'yellow');
    log('  - Confirme se os IDs de teste existem no banco', 'yellow');
    log('  - Valide se as migrations foram aplicadas', 'yellow');
    process.exit(1);
  }
}

main();
