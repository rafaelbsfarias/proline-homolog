// tests/collection-workflow/scripts/flow-simulator.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { TEST_CONFIG, getDateDaysFromNow } from '../config/test-config.js';

// Resolve __dirname para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar environment - ajustar caminho para a nova localização
dotenv.config({ path: path.join(__dirname, '../../../.env.local') });

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
    // IDs dos usuários de teste - serão definidos dinamicamente
    this.clientId = null; // Será definido após buscar cliente
    this.adminId = TEST_CONFIG.ADMIN_ID;

    // Inicializar cliente Supabase
    this.supabase = supabase;

    // Usar service role key para acesso total (mais simples para testes)
    this.serviceRoleKey =
      process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  }

  // Método para buscar e definir o cliente correto
  async initializeClient() {
    if (this.clientId) return this.clientId; // Já inicializado

    console.log('🔍 Buscando cliente para testes...');

    // Primeiro, tenta usar o CLIENT_ID da configuração
    const { TEST_CONFIG } = await import('../config/test-config.js');
    if (TEST_CONFIG.CLIENT_ID) {
      console.log(`🎯 Usando CLIENT_ID da configuração: ${TEST_CONFIG.CLIENT_ID}`);

      // Verifica se o cliente existe
      const { data: client, error: clientError } = await this.supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', TEST_CONFIG.CLIENT_ID)
        .eq('role', 'client')
        .single();

      if (!clientError && client) {
        this.clientId = client.id;
        console.log(`✅ Cliente encontrado: ${client.full_name} (${this.clientId})`);
        return this.clientId;
      }

      console.log('⚠️ Cliente da configuração não encontrado, buscando outro...');
    }

    // Buscar primeiro cliente disponível
    const { data: firstClient, error } = await this.supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('role', 'client')
      .limit(1)
      .maybeSingle();

    if (firstClient && !error) {
      this.clientId = firstClient.id;
      console.log(`✅ Cliente para testes: ${firstClient.full_name} - ID: ${firstClient.id}`);
      return this.clientId;
    }

    throw new Error('Nenhum cliente encontrado para testes');
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
      tomorrow.setDate(tomorrow.getDate() + TEST_CONFIG.COLLECTION.DAYS_AHEAD);
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
          status: TEST_CONFIG.STATUS_FLOW.CLIENT_ACCEPTED,
          updated_at: new Date().toISOString(),
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
  // NOVO FLUXO: COLETA APROVADA + NOVA SOLICITAÇÃO + MUDANÇA DE DATA
  // =============================================================================

  async executeAdvancedCollectionFlow() {
    console.log(
      '\n🎯 EXECUTANDO FLUXO AVANÇADO: COLETA APROVADA + NOVA SOLICITAÇÃO + MUDANÇA DE DATA'
    );
    console.log('='.repeat(80));

    const results = {
      fase1_coletaAprovada: null,
      fase2_novaSolicitacao: null,
      fase3_mudancaData: null,
      historicoAntes: null,
      historicoDepois: null,
      collectionsAntes: null,
      collectionsDepois: null,
      errors: [],
    };

    try {
      // Inicializar cliente primeiro
      await this.initializeClient();

      // FASE 1: Criar uma coleta já aprovada para o dia 10
      console.log('\n📅 FASE 1: CRIANDO COLETA JÁ APROVADA PARA DIA 10...');
      results.fase1_coletaAprovada = await this.criarColetaAprovada('2025-09-10');

      // FASE 2: Cliente solicita nova coleta para o dia 20
      console.log('\n📅 FASE 2: CLIENTE SOLICITA NOVA COLETA PARA DIA 20...');
      results.fase2_novaSolicitacao = await this.criarNovaSolicitacao('2025-09-20');

      // Capturar estado ANTES da mudança de data
      console.log('\n📊 CAPTURANDO ESTADO ANTES DA MUDANÇA...');
      results.historicoAntes = await this.capturarHistoricoAtual();
      results.collectionsAntes = await this.capturarCollectionsAtual();

      // FASE 3: Admin propõe mudança de data da segunda coleta para o dia 28
      console.log('\n📅 FASE 3: ADMIN PROPÕE MUDANÇA PARA DIA 28...');
      results.fase3_mudancaData = await this.propormudancaData('2025-09-28');

      // Capturar estado DEPOIS da mudança de data
      console.log('\n📊 CAPTURANDO ESTADO DEPOIS DA MUDANÇA...');
      results.historicoDepois = await this.capturarHistoricoAtual();
      results.collectionsDepois = await this.capturarCollectionsAtual();

      // Análise dos resultados
      console.log('\n🔍 ANÁLISE DOS RESULTADOS...');
      await this.analisarImpactoMudancaData(results);
    } catch (error) {
      console.error('\n❌ ERRO DURANTE FLUXO AVANÇADO:', error);
      results.errors.push(error.message);
    }

    return results;
  }

  async criarColetaAprovada(dataColeta) {
    console.log(`   📌 Criando coleta aprovada para ${dataColeta}...`);

    try {
      // 1. Criar collection aprovada
      const { data: collection, error: collError } = await supabase
        .from('vehicle_collections')
        .insert({
          client_id: this.clientId,
          collection_address: TEST_CONFIG.COLLECTION.DEFAULT_ADDRESS,
          collection_date: dataColeta,
          collection_fee_per_vehicle: TEST_CONFIG.COLLECTION.FEE_PER_VEHICLE,
          status: 'approved', // JÁ APROVADA
        })
        .select()
        .single();

      if (collError) throw collError;

      // 2. Vincular 1 veículo a esta collection
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('id')
        .eq('client_id', this.clientId)
        .limit(1);

      if (vehicles && vehicles.length > 0) {
        const { error: vehError } = await supabase
          .from('vehicles')
          .update({
            collection_id: collection.id,
            estimated_arrival_date: dataColeta,
            status: 'AGUARDANDO_COLETA',
          })
          .eq('id', vehicles[0].id);

        if (vehError) throw vehError;
      }

      console.log(`   ✅ Coleta aprovada criada: ${collection.id} para ${dataColeta}`);
      return collection;
    } catch (error) {
      console.error(`   ❌ Erro ao criar coleta aprovada:`, error);
      throw error;
    }
  }

  async criarNovaSolicitacao(dataColeta) {
    console.log(`   📌 Cliente solicita nova coleta para ${dataColeta}...`);

    try {
      // 1. Criar nova collection requested
      const { data: collection, error: collError } = await supabase
        .from('vehicle_collections')
        .insert({
          client_id: this.clientId,
          collection_address: TEST_CONFIG.COLLECTION.DEFAULT_ADDRESS,
          collection_date: dataColeta,
          collection_fee_per_vehicle: null, // Ainda não precificada
          status: 'requested',
        })
        .select()
        .single();

      if (collError) throw collError;

      // 2. Vincular outro veículo a esta collection
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('id')
        .eq('client_id', this.clientId)
        .is('collection_id', null)
        .limit(1);

      if (vehicles && vehicles.length > 0) {
        const { error: vehError } = await supabase
          .from('vehicles')
          .update({
            collection_id: collection.id,
            estimated_arrival_date: dataColeta,
            status: 'PONTO_COLETA_SELECIONADO',
          })
          .eq('id', vehicles[0].id);

        if (vehError) throw vehError;
      }

      console.log(`   ✅ Nova solicitação criada: ${collection.id} para ${dataColeta}`);
      return collection;
    } catch (error) {
      console.error(`   ❌ Erro ao criar nova solicitação:`, error);
      throw error;
    }
  }

  async propormudancaData(novaData) {
    console.log(`   📌 Admin propõe mudança para ${novaData}...`);

    try {
      // Simular a operação que acontece no endpoint propose-collection-date
      // Buscar todas as collections do cliente para a nova data
      const { data: existingCollections, error: fetchError } = await this.supabase
        .from('collections')
        .select('*')
        .eq('client_id', this.clientId)
        .eq('collection_date', novaData);

      if (fetchError) {
        throw new Error(`Erro ao buscar collections existentes: ${fetchError.message}`);
      }

      console.log(
        `   📋 Collections existentes para ${novaData}: ${existingCollections?.length || 0}`
      );

      // Se já existe collection para essa data, simular o UPSERT que causa o problema
      if (existingCollections && existingCollections.length > 0) {
        console.log(`   ⚠️ ATENÇÃO: Já existe collection para ${novaData}. Simulando UPSERT...`);

        // Este é o ponto onde o bug pode acontecer - vamos simular o comportamento
        // do endpoint que faz UPSERT e pode sobrescrever dados
        const { data: upsertResult, error: upsertError } = await this.supabase
          .from('collections')
          .upsert(
            {
              client_id: this.clientId,
              collection_date: novaData,
              collection_address: TEST_CONFIG.COLLECTION_ADDRESS,
              status: 'approved',
              collection_fee_per_vehicle: 10,
            },
            {
              onConflict: 'client_id,collection_date',
            }
          )
          .select();

        if (upsertError) {
          throw new Error(`Erro no UPSERT: ${upsertError.message}`);
        }

        console.log(`   ✅ UPSERT realizado para ${novaData}`);
        return { type: 'upsert', data: upsertResult };
      } else {
        // Criar nova collection normalmente
        const { data: insertResult, error: insertError } = await this.supabase
          .from('collections')
          .insert({
            client_id: this.clientId,
            collection_date: novaData,
            collection_address: TEST_CONFIG.COLLECTION_ADDRESS,
            status: 'approved',
            collection_fee_per_vehicle: 10,
          })
          .select();

        if (insertError) {
          throw new Error(`Erro ao inserir nova collection: ${insertError.message}`);
        }

        console.log(`   ✅ Nova collection criada para ${novaData}`);
        return { type: 'insert', data: insertResult };
      }
    } catch (error) {
      console.error(`   ❌ Erro ao propor mudança de data:`, error);
      return { error: error.message };
    }
  }

  async capturarHistoricoAtual() {
    try {
      const { data, error } = await supabase
        .from('collection_history')
        .select('*')
        .eq('client_id', this.clientId)
        .order('collection_date', { ascending: true });

      if (error) throw error;

      console.log(`   📊 Histórico capturado: ${data?.length || 0} registros`);
      return data || [];
    } catch (error) {
      console.error('   ❌ Erro ao capturar histórico:', error);
      return [];
    }
  }

  async capturarCollectionsAtual() {
    try {
      const { data, error } = await supabase
        .from('vehicle_collections')
        .select(
          `
          *,
          vehicles:vehicles(id, plate, status, estimated_arrival_date)
        `
        )
        .eq('client_id', this.clientId)
        .order('collection_date', { ascending: true });

      if (error) throw error;

      console.log(`   📊 Collections capturadas: ${data?.length || 0} registros`);
      return data || [];
    } catch (error) {
      console.error('   ❌ Erro ao capturar collections:', error);
      return [];
    }
  }

  async analisarImpactoMudancaData(results) {
    console.log('\n🔍 ANÁLISE DE IMPACTO DA MUDANÇA DE DATA:');
    console.log('='.repeat(50));

    // Comparar histórico antes vs depois
    const historicoAntes = results.historicoAntes || [];
    const historicoDepois = results.historicoDepois || [];

    console.log(`📈 Histórico ANTES: ${historicoAntes.length} registros`);
    historicoAntes.forEach((h, i) => {
      console.log(
        `   ${i + 1}. ${h.collection_date} - ${h.vehicle_count} veículo(s) - R$ ${h.total_amount}`
      );
    });

    console.log(`📈 Histórico DEPOIS: ${historicoDepois.length} registros`);
    historicoDepois.forEach((h, i) => {
      console.log(
        `   ${i + 1}. ${h.collection_date} - ${h.vehicle_count} veículo(s) - R$ ${h.total_amount}`
      );
    });

    // Comparar collections antes vs depois
    const collectionsAntes = results.collectionsAntes || [];
    const collectionsDepois = results.collectionsDepois || [];

    console.log(`📋 Collections ANTES: ${collectionsAntes.length} registros`);
    collectionsAntes.forEach((c, i) => {
      const veiculos = c.vehicles || [];
      console.log(
        `   ${i + 1}. ${c.collection_date} - Status: ${c.status} - ${veiculos.length} veículo(s)`
      );
    });

    console.log(`📋 Collections DEPOIS: ${collectionsDepois.length} registros`);
    collectionsDepois.forEach((c, i) => {
      const veiculos = c.vehicles || [];
      console.log(
        `   ${i + 1}. ${c.collection_date} - Status: ${c.status} - ${veiculos.length} veículo(s)`
      );
    });

    // Detectar problemas
    console.log('\n🚨 PROBLEMAS DETECTADOS:');

    // Problema 1: Perda de dados no histórico
    if (historicoAntes.length > historicoDepois.length) {
      console.log('   ❌ PERDA DE DADOS NO HISTÓRICO!');
      console.log(`      - Antes: ${historicoAntes.length} registros`);
      console.log(`      - Depois: ${historicoDepois.length} registros`);
    }

    // Problema 2: Mesclagem indevida de collections
    const datasAntes = new Set(collectionsAntes.map(c => c.collection_date));
    const datasDepois = new Set(collectionsDepois.map(c => c.collection_date));

    if (datasAntes.size > datasDepois.size) {
      console.log('   ❌ MESCLAGEM INDEVIDA DE COLLECTIONS!');
      console.log(`      - Datas antes: ${Array.from(datasAntes).join(', ')}`);
      console.log(`      - Datas depois: ${Array.from(datasDepois).join(', ')}`);
    }

    // Problema 3: Contagem incorreta de veículos
    const totalVeiculosHistoricoDepois = historicoDepois.reduce(
      (sum, h) => sum + h.vehicle_count,
      0
    );
    const totalVeiculosRealidade = collectionsDepois.reduce(
      (sum, c) => sum + (c.vehicles?.length || 0),
      0
    );

    if (totalVeiculosHistoricoDepois !== totalVeiculosRealidade) {
      console.log('   ❌ CONTAGEM INCORRETA DE VEÍCULOS NO HISTÓRICO!');
      console.log(`      - Histórico indica: ${totalVeiculosHistoricoDepois} veículo(s)`);
      console.log(`      - Realidade: ${totalVeiculosRealidade} veículo(s)`);
    }

    console.log('\n✅ Análise completa!');
  }

  // Função para salvar relatório detalhado
  async saveDetailedReport(results, testType) {
    try {
      const report = {
        testType,
        timestamp: new Date().toISOString(),
        results,
        summary: {
          problemaDetectado: {
            perdaHistorico:
              (results.historicoAntes?.length || 0) > (results.historicoDepois?.length || 0),
            mesclagemCollections:
              (results.collectionsAntes?.length || 0) > (results.collectionsDepois?.length || 0),
            contagemIncorreta: false, // será calculado na análise
          },
        },
      };

      const fs = await import('fs');
      const path = await import('path');
      const { fileURLToPath } = await import('url');

      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const reportsDir = path.resolve(__dirname, '../reports');

      // Criar diretório se não existir
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const filename = `${testType}-report-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
      const filepath = path.join(reportsDir, filename);

      fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
      console.log(`\n📄 Relatório salvo em: ${filepath}`);
    } catch (error) {
      console.error('❌ Erro ao salvar relatório:', error);
    }
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

async function simulateAdvancedCollectionFlow() {
  const simulator = new FlowSimulator();

  console.log('🎯 SIMULADOR AVANÇADO: COLETA APROVADA + NOVA SOLICITAÇÃO + MUDANÇA DE DATA');
  console.log('='.repeat(80));
  console.log('🎯 OBJETIVO: Detectar perda de histórico quando há mudança de data');
  console.log('📋 CENÁRIO:');
  console.log('   1. Coleta já aprovada para dia 10 (1 veículo)');
  console.log('   2. Cliente solicita nova coleta para dia 20 (1 veículo)');
  console.log('   3. Admin propõe mudança da segunda coleta para dia 28');
  console.log('   4. Verificar se histórico da primeira coleta se perde');
  console.log('='.repeat(80));

  try {
    // Resetar dados antes de começar
    await simulator.resetTestData();

    // Executar fluxo avançado
    const results = await simulator.executeAdvancedCollectionFlow();

    console.log('\n📊 RESUMO DO TESTE AVANÇADO:');
    console.log(
      '- Fase 1 (Coleta aprovada dia 10):',
      results.fase1_coletaAprovada ? '✅ Sucesso' : '❌ Falhou'
    );
    console.log(
      '- Fase 2 (Nova solicitação dia 20):',
      results.fase2_novaSolicitacao ? '✅ Sucesso' : '❌ Falhou'
    );
    console.log(
      '- Fase 3 (Mudança para dia 28):',
      results.fase3_mudancaData ? '✅ Sucesso' : '❌ Falhou'
    );

    console.log('\n📈 DIAGNÓSTICO:');
    console.log(`- Histórico antes: ${results.historicoAntes?.length || 0} registro(s)`);
    console.log(`- Histórico depois: ${results.historicoDepois?.length || 0} registro(s)`);
    console.log(`- Collections antes: ${results.collectionsAntes?.length || 0} registro(s)`);
    console.log(`- Collections depois: ${results.collectionsDepois?.length || 0} registro(s)`);

    if (results.errors.length > 0) {
      console.log('\n❌ ERROS ENCONTRADOS:');
      results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    // Salvar relatório detalhado
    const simulatorForReport = new FlowSimulator();
    await simulatorForReport.saveDetailedReport(results, 'advanced-collection-flow');
  } catch (error) {
    console.error('\n💥 ERRO CRÍTICO NO TESTE AVANÇADO:', error);
  }
}

// Execução quando chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  // Verificar argumentos da linha de comando
  const args = process.argv.slice(2);

  if (args.includes('--advanced') || args.includes('-a')) {
    simulateAdvancedCollectionFlow();
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log('🔬 SIMULADOR DE FLUXO DE COLETA');
    console.log('');
    console.log('Uso:');
    console.log('  node flow-simulator.js           # Executa fluxo básico');
    console.log('  node flow-simulator.js --advanced # Executa teste avançado');
    console.log('  node flow-simulator.js --help     # Mostra esta ajuda');
    console.log('');
    console.log('Testes disponíveis:');
    console.log('  Básico:   Cliente define → Admin propõe → Cliente aceita');
    console.log('  Avançado: Coleta aprovada + Nova solicitação + Mudança data');
  } else {
    simulateProblematicFlow();
  }
}

export { FlowSimulator, simulateProblematicFlow };
