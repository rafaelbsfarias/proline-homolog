// scripts/db_scripts/setup-test-vehicles.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey =
  process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// =============================================================================
// CONFIGURAÇÃO DE VEÍCULOS DE TESTE
// =============================================================================

class TestVehicleSetup {
  constructor() {
    this.clientId = '00ab894a-1120-4dbe-abb0-c1a6d64b516a'; // ID do cliente existente
  }

  async setupTestVehicles() {
    console.log('🚗 CONFIGURANDO VEÍCULOS DE TESTE PARA O CLIENTE');
    console.log('='.repeat(60));

    try {
      // Primeiro, limpar veículos existentes do cliente
      console.log('🧹 Limpando veículos existentes...');
      const { error: deleteError } = await supabase
        .from('vehicles')
        .delete()
        .eq('client_id', this.clientId);

      if (deleteError) {
        console.error('❌ Erro ao limpar veículos:', deleteError);
        throw deleteError;
      }

      console.log('✅ Veículos existentes removidos');

      // Criar veículos de teste
      const testVehicles = [
        {
          client_id: this.clientId,
          brand: 'Toyota',
          model: 'Corolla',
          year: 2020,
          plate: 'ABC-1234',
          color: 'Prata',
          status: 'AGUARDANDO DEFINIÇÃO DE COLETA',
          pickup_address_id: null,
          estimated_arrival_date: null,
        },
        {
          client_id: this.clientId,
          brand: 'Honda',
          model: 'Civic',
          year: 2019,
          plate: 'DEF-5678',
          color: 'Preto',
          status: 'AGUARDANDO DEFINIÇÃO DE COLETA',
          pickup_address_id: null,
          estimated_arrival_date: null,
        },
        {
          client_id: this.clientId,
          brand: 'Volkswagen',
          model: 'Golf',
          year: 2021,
          plate: 'GHI-9012',
          color: 'Branco',
          status: 'AGUARDANDO DEFINIÇÃO DE COLETA',
          pickup_address_id: null,
          estimated_arrival_date: null,
        },
      ];

      console.log('📝 Criando veículos de teste...');

      const createdVehicles = [];
      for (const vehicle of testVehicles) {
        const { data, error } = await supabase.from('vehicles').insert(vehicle).select().single();

        if (error) {
          console.error(`❌ Erro ao criar veículo ${vehicle.plate}:`, error);
          throw error;
        }

        createdVehicles.push(data);
        console.log(`✅ Veículo criado: ${vehicle.brand} ${vehicle.model} - ${vehicle.plate}`);
      }

      // Verificar se os veículos foram criados corretamente
      const { data: allVehicles, error: fetchError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('client_id', this.clientId);

      if (fetchError) {
        console.error('❌ Erro ao verificar veículos criados:', fetchError);
        throw fetchError;
      }

      console.log('\n📊 RESUMO DOS VEÍCULOS CRIADOS:');
      console.log('='.repeat(40));
      allVehicles.forEach((vehicle, index) => {
        console.log(`${index + 1}. ${vehicle.brand} ${vehicle.model} (${vehicle.year})`);
        console.log(`   Placa: ${vehicle.plate}`);
        console.log(`   Status: ${vehicle.status}`);
        console.log(`   ID: ${vehicle.id}`);
        console.log('');
      });

      console.log(`🎉 ${allVehicles.length} veículos de teste criados com sucesso!`);
      console.log('✅ Agora o cliente pode definir coletas');

      return {
        success: true,
        vehiclesCreated: allVehicles.length,
        vehicles: allVehicles,
      };
    } catch (error) {
      console.error('❌ Erro durante configuração dos veículos:', error);
      throw error;
    }
  }

  async verifyClientExists() {
    console.log('🔍 Verificando se o cliente existe...');

    const { data: client, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', this.clientId)
      .single();

    if (error) {
      console.error('❌ Erro ao buscar cliente:', error);
      throw error;
    }

    if (!client) {
      throw new Error(`Cliente com ID ${this.clientId} não encontrado`);
    }

    console.log(`✅ Cliente encontrado: ${client.full_name} (${client.email})`);
    return client;
  }
}

// =============================================================================
// EXECUÇÃO PRINCIPAL
// =============================================================================

async function setupTestVehicles() {
  const setup = new TestVehicleSetup();

  console.log('🔧 INICIANDO CONFIGURAÇÃO DE VEÍCULOS DE TESTE');
  console.log('Cliente ID:', setup.clientId);
  console.log('='.repeat(60));

  try {
    // Verificar se o cliente existe
    await setup.verifyClientExists();

    // Configurar veículos de teste
    const result = await setup.setupTestVehicles();

    console.log('\n🎯 CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('📋 Próximos passos:');
    console.log('1. Executar o diagnóstico novamente');
    console.log('2. O fluxo agora deve funcionar corretamente');
    console.log('3. Verificar se o problema de movimentação é reproduzido');

    return result;
  } catch (error) {
    console.error('\n💥 ERRO NA CONFIGURAÇÃO:', error);
    process.exit(1);
  }
}

// Execução quando chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  setupTestVehicles();
}

export { TestVehicleSetup, setupTestVehicles };
