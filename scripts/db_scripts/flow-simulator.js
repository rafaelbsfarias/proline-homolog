// scripts/db_scripts/flow-simulator.js

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
// SIMULADOR DO FLUXO PROBLEMÁTICO
// =============================================================================

class FlowSimulator {
  constructor() {
    // IDs dos usuários de teste criados pelo orquestrador
    this.clientId = '00ab894a-1120-4dbe-abb0-c1a6d64b516a'; // Cliente existente
    this.adminId = '2e2be560-5d52-448d-ad6c-f77abb861161'; // Admin existente

    // Usar service role key para acesso total (mais simples para testes)
    this.serviceRoleKey =
      process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  }

  // =============================================================================
  // AUTENTICAÇÃO COM SERVICE ROLE KEY
  // =============================================================================

  getSupabaseClient() {
    if (!this.serviceRoleKey) {
      throw new Error('NEXT_SUPABASE_SERVICE_ROLE_KEY não configurada');
    }
    return createClient(supabaseUrl, this.serviceRoleKey);
  }

  // =============================================================================
  // PASSO 1: CLIENTE DEFINE COLETA
  // =============================================================================

  async step1_ClientDefinesCollection() {
    console.log('\n🚛 PASSO 1: CLIENTE DEFINE COLETA');

    try {
      const supabase = this.getSupabaseClient();

      // Primeiro, verificar se há endereços de coleta
      const { data: addresses, error: addressError } = await supabase
        .from('addresses')
        .select('*')
        .eq('is_collect_point', true)
        .eq('profile_id', this.clientId);

      if (addressError) {
        console.error('❌ Erro ao buscar endereços:', addressError);
        throw addressError;
      }

      let collectPoint = addresses?.[0];

      if (!collectPoint) {
        console.log('⚠️ Nenhum ponto de coleta encontrado. Criando um...');

        const { data: newAddress, error: createError } = await supabase
          .from('addresses')
          .insert({
            profile_id: this.clientId,
            street: 'Avenida Paulista',
            number: '1000',
            neighborhood: 'Bela Vista',
            city: 'São Paulo',
            state: 'SP',
            zip_code: '01310-100',
            complement: 'Próximo ao metrô',
            is_collect_point: true,
            is_main_address: false,
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ Erro ao criar endereço:', createError);
          throw createError;
        }

        console.log('✅ Endereço de coleta criado:', newAddress);
        collectPoint = newAddress;
      } else {
        console.log('✅ Ponto de coleta encontrado:', collectPoint.id);
      }

      // Buscar veículos do cliente
      console.log('🔍 Buscando veículos do cliente...');
      const { data: vehicles, error: vehicleError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('client_id', this.clientId)
        .in('status', ['AGUARDANDO DEFINIÇÃO DE COLETA', 'DISPONÍVEL PARA COLETA']);

      if (vehicleError) {
        console.error('❌ Erro ao buscar veículos:', vehicleError);
        throw vehicleError;
      }

      if (!vehicles || vehicles.length === 0) {
        throw new Error('Nenhum veículo encontrado para o cliente');
      }

      // Usar até 3 veículos
      const vehicleIds = vehicles.slice(0, 3).map(v => v.id);
      console.log(`📋 Usando ${vehicleIds.length} veículos:`, vehicleIds);

      // Definir coleta para amanhã
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowFormatted = tomorrow.toISOString().split('T')[0];
      console.log(`📅 Definindo coleta para data: ${tomorrowFormatted}`);

      const { data: result, error: collectionError } = await supabase
        .from('vehicle_collections')
        .insert({
          client_id: this.clientId,
          collection_address:
            collectPoint.street + ', ' + collectPoint.number + ' - ' + collectPoint.neighborhood,
          status: 'requested',
        })
        .select()
        .single();

      if (collectionError) {
        console.error('❌ Erro ao criar coleta:', collectionError);
        throw collectionError;
      }

      console.log('✅ Coleta definida com sucesso:', result);
      return result;
    } catch (error) {
      console.error('❌ Erro no Passo 1:', error);
      throw error;
    }
  }

  async setVehicleCollection(addressId) {
    // Primeiro, buscar os veículos do cliente
    console.log('🔍 Buscando veículos do cliente...');

    const vehiclesResponse = await fetch('http://localhost:3000/api/client/vehicles', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.clientToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!vehiclesResponse.ok) {
      throw new Error(`Erro ao buscar veículos: ${vehiclesResponse.status}`);
    }

    const vehiclesData = await vehiclesResponse.json();
    const vehicles = vehiclesData.vehicles || [];

    if (vehicles.length === 0) {
      throw new Error('Nenhum veículo encontrado para o cliente');
    }

    const vehicleIds = vehicles.slice(0, 3).map(v => v.id); // Usar os primeiros 3 veículos
    console.log(`📋 Usando ${vehicleIds.length} veículos:`, vehicleIds);

    // Calcular data D+1
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowFormatted = tomorrow.toISOString().split('T')[0];

    console.log(`📅 Definindo coleta para data: ${tomorrowFormatted}`);

    const response = await fetch('http://localhost:3000/api/client/set-vehicles-collection', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.clientToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'collect_point',
        addressId: addressId,
        estimated_arrival_date: tomorrowFormatted,
        vehicleIds: vehicleIds,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na definição de coleta: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Coleta definida com sucesso:', result);

    return { addressId, collectionDate: tomorrowFormatted, vehicleIds, result };
  }

  // =============================================================================
  // PASSO 2: ADMIN DEFINE VALOR E SOLICITA MUDANÇA DE DATA
  // =============================================================================

  async step2_AdminProposesDate() {
    console.log('\n👨‍💼 PASSO 2: ADMIN DEFINE VALOR E SOLICITA MUDANÇA DE DATA');

    try {
      const supabase = this.getSupabaseClient();

      // Buscar coletas ativas do cliente
      const { data: collections, error: collectionError } = await supabase
        .from('vehicle_collections')
        .select('*')
        .eq('client_id', this.clientId)
        .eq('status', 'requested');

      if (collectionError) {
        console.error('❌ Erro ao buscar coletas:', collectionError);
        throw collectionError;
      }

      if (!collections || collections.length === 0) {
        console.log('⚠️ Nenhuma coleta encontrada para propor data');
        return null;
      }

      const collection = collections[0];
      console.log('📦 Coleta encontrada:', collection.id);

      // Propor nova data (2 dias à frente)
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 2);
      const newDateFormatted = newDate.toISOString().split('T')[0];
      console.log(`📅 Admin propondo nova data: ${newDateFormatted}`);

      // Atualizar a coleta com nova data proposta
      const { data: result, error: updateError } = await supabase
        .from('vehicle_collections')
        .update({
          collection_date: newDateFormatted,
          status: 'approved',
          collection_fee_per_vehicle: 50,
        })
        .eq('id', collection.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Erro ao atualizar coleta:', updateError);
        throw updateError;
      }

      console.log('✅ Proposta de data enviada com sucesso:', result);
      return result;
    } catch (error) {
      console.error('❌ Erro no Passo 2:', error);
      throw error;
    }
  }

  // =============================================================================
  // PASSO 3: CLIENTE ACEITA MUDANÇA DE DATA
  // =============================================================================

  async step3_ClientAcceptsProposal() {
    console.log('\n✅ PASSO 3: CLIENTE ACEITA MUDANÇA DE DATA');

    try {
      const supabase = this.getSupabaseClient();

      // Buscar coletas com status "approved" (após proposta do admin)
      const { data: collections, error } = await supabase
        .from('vehicle_collections')
        .select('*')
        .eq('client_id', this.clientId)
        .eq('status', 'approved');

      if (error) {
        console.error('❌ Erro ao buscar coletas:', error);
        throw error;
      }

      if (!collections || collections.length === 0) {
        console.log('⚠️ Nenhuma proposta pendente encontrada');
        return null;
      }

      const collection = collections[0];
      console.log('📋 Proposta encontrada:', collection.id);

      // Aceitar proposta atualizando o status
      const { data: result, error: updateError } = await supabase
        .from('vehicle_collections')
        .update({
          status: 'paid',
        })
        .eq('id', collection.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Erro ao aceitar proposta:', updateError);
        throw updateError;
      }

      console.log('✅ Proposta aceita com sucesso:', result);
      return { collectionId: collection.id, result };
    } catch (error) {
      console.error('❌ Erro no Passo 3:', error);
      throw error;
    }
  }

  // =============================================================================
  // EXECUÇÃO COMPLETA DO FLUXO
  // =============================================================================

  async executeFullFlow() {
    console.log('🚀 INICIANDO SIMULAÇÃO COMPLETA DO FLUXO PROBLEMÁTICO');
    console.log('='.repeat(70));

    const results = {
      step1: null,
      step2: null,
      step3: null,
      errors: [],
    };

    try {
      // Executar cada passo sequencialmente
      console.log('\n📊 EXECUTANDO PASSO 1...');
      results.step1 = await this.step1_ClientDefinesCollection();

      console.log('\n📊 EXECUTANDO PASSO 2...');
      results.step2 = await this.step2_AdminProposesDate();

      console.log('\n📊 EXECUTANDO PASSO 3...');
      results.step3 = await this.step3_ClientAcceptsProposal();

      console.log('\n🎉 FLUXO COMPLETO EXECUTADO COM SUCESSO!');
      console.log('📋 Resultados:', results);
    } catch (error) {
      console.error('\n❌ ERRO DURANTE A EXECUÇÃO DO FLUXO:');
      console.error(error);
      results.errors.push(error.message);
    }

    return results;
  }

  // =============================================================================
  // UTILITÁRIOS
  // =============================================================================

  async resetTestData() {
    console.log('\n🧹 RESETANDO DADOS DE TESTE...');

    try {
      // Resetar status dos veículos
      const { error: vehError } = await supabase
        .from('vehicles')
        .update({
          status: 'AGUARDANDO DEFINIÇÃO DE COLETA',
          pickup_address_id: null,
          estimated_arrival_date: null,
        })
        .eq('client_id', this.clientId);

      if (vehError) throw vehError;

      // Limpar coletas do cliente
      const { error: collError } = await supabase
        .from('vehicle_collections')
        .delete()
        .eq('client_id', this.clientId);

      if (collError) throw collError;

      // Limpar histórico do cliente (se necessário)
      const { error: histError } = await supabase
        .from('collection_history')
        .delete()
        .eq('client_id', this.clientId);

      if (histError) throw histError;

      console.log('✅ Dados de teste resetados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao resetar dados:', error);
      throw error;
    }
  }
}

// =============================================================================
// EXECUÇÃO PRINCIPAL
// =============================================================================

async function simulateProblematicFlow() {
  const simulator = new FlowSimulator();

  console.log('🔬 SIMULADOR DO FLUXO PROBLEMÁTICO');
  console.log('Cliente define coleta → Admin propõe data → Cliente aceita');
  console.log('='.repeat(70));

  try {
    // Resetar dados antes de começar
    await simulator.resetTestData();

    // Executar fluxo completo
    const results = await simulator.executeFullFlow();

    console.log('\n📊 RESUMO DA SIMULAÇÃO:');
    console.log('- Passo 1 (Cliente define coleta):', results.step1 ? '✅ Sucesso' : '❌ Falhou');
    console.log('- Passo 2 (Admin propõe data):', results.step2 ? '✅ Sucesso' : '❌ Falhou');
    console.log('- Passo 3 (Cliente aceita):', results.step3 ? '✅ Sucesso' : '❌ Falhou');

    if (results.errors.length > 0) {
      console.log('\n❌ ERROS ENCONTRADOS:');
      results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
  } catch (error) {
    console.error('\n💥 ERRO CRÍTICO NA SIMULAÇÃO:', error);
  }
}

// Execução quando chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  simulateProblematicFlow();
}

export { FlowSimulator, simulateProblematicFlow };
