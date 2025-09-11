import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config({ path: '.env.remoto' });

async function investigateInconsistencies() {
  console.log('🔍 INVESTIGANDO INCONSISTÊNCIAS DETALHADAS');
  console.log('==================================================');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente do Supabase não encontradas');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Investigar veículos com status inconsistente
    console.log('\n🚗 INVESTIGANDO VEÍCULOS COM STATUS INCONSISTENTE');
    console.log('--------------------------------------------------');

    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('id, plate, status, created_at, collection_id');

    if (vehiclesError) {
      console.error('Erro ao buscar veículos:', vehiclesError);
      return;
    }

    const { data: collections, error: collectionsError } = await supabase
      .from('vehicle_collections')
      .select('id, client_id, status, created_at, updated_at');

    if (collectionsError) {
      console.error('Erro ao buscar collections:', collectionsError);
      return;
    }

    console.log(`📊 Total de veículos: ${vehicles.length}`);
    console.log(`📦 Total de collections: ${collections.length}`);

    // Mapear collections por ID para facilitar lookup
    const collectionsById = collections.reduce((acc, collection) => {
      acc[collection.id] = collection;
      return acc;
    }, {});

    // Verificar inconsistências
    const inconsistencies = [];

    vehicles.forEach(vehicle => {
      if (vehicle.collection_id) {
        // Veículo tem uma collection associada
        const collection = collectionsById[vehicle.collection_id];

        if (collection) {
          // Verificar se status do veículo está consistente com a collection
          const expectedVehicleStatus =
            collection.status === 'approved' ? 'COLETA APROVADA' : 'AGUARDANDO COLETA';

          if (vehicle.status !== expectedVehicleStatus) {
            inconsistencies.push({
              type: 'VEHICLE_COLLECTION_STATUS_MISMATCH',
              vehicle_id: vehicle.id,
              vehicle_plate: vehicle.plate,
              vehicle_status: vehicle.status,
              collection_status: collection.status,
              expected_vehicle_status: expectedVehicleStatus,
              collection_id: collection.id,
            });
          }
        } else {
          // Collection referenciada não existe
          inconsistencies.push({
            type: 'ORPHANED_COLLECTION_REFERENCE',
            vehicle_id: vehicle.id,
            vehicle_plate: vehicle.plate,
            vehicle_status: vehicle.status,
            collection_id: vehicle.collection_id,
            issue: 'Collection referenciada não existe',
          });
        }
      } else {
        // Veículo sem collection
        if (vehicle.status !== 'AGUARDANDO DEFINIÇÃO DE COLETA') {
          inconsistencies.push({
            type: 'VEHICLE_WITHOUT_COLLECTION_INCONSISTENT_STATUS',
            vehicle_id: vehicle.id,
            vehicle_plate: vehicle.plate,
            vehicle_status: vehicle.status,
            expected_status: 'AGUARDANDO DEFINIÇÃO DE COLETA',
          });
        }
      }
    });

    console.log(`\n⚠️  INCONSISTÊNCIAS ENCONTRADAS: ${inconsistencies.length}`);

    if (inconsistencies.length > 0) {
      inconsistencies.forEach((inc, index) => {
        console.log(`\n🔴 INCONSISTÊNCIA ${index + 1}:`);
        console.log(`   Tipo: ${inc.type}`);
        console.log(`   Veículo: ${inc.vehicle_plate} (ID: ${inc.vehicle_id})`);
        console.log(`   Status atual: ${inc.vehicle_status}`);
        console.log(`   Status esperado: ${inc.expected_vehicle_status}`);
        if (inc.collection_status) {
          console.log(`   Status da collection: ${inc.collection_status}`);
          console.log(`   ID da collection: ${inc.collection_id}`);
        }
      });
    } else {
      console.log('✅ Nenhuma inconsistência de status encontrada!');
    }

    // 2. Investigar audit logs
    console.log('\n📋 INVESTIGANDO SISTEMA DE AUDIT LOGS');
    console.log('--------------------------------------');

    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select('id, table_name, operation, user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (auditError) {
      console.error('Erro ao buscar audit logs:', auditError);
    } else {
      console.log(`📊 Total de audit logs encontrados: ${auditLogs.length}`);

      if (auditLogs.length === 0) {
        console.log('⚠️  Nenhum log de auditoria encontrado!');
        console.log('💡 Possíveis causas:');
        console.log('   - Triggers de auditoria não estão ativos');
        console.log('   - Tabelas de auditoria não existem');
        console.log('   - Sistema de auditoria não foi implementado');
      } else {
        console.log('\n📝 Últimos logs de auditoria:');
        auditLogs.forEach((log, index) => {
          console.log(`   ${index + 1}. ${log.table_name} - ${log.operation} - ${log.created_at}`);
        });
      }
    }

    // 3. Verificar tabelas críticas
    console.log('\n📊 VERIFICANDO TABELAS CRÍTICAS');
    console.log('----------------------------------');

    const criticalTables = ['vehicles', 'vehicle_collections', 'collection_history', 'audit_logs'];

    for (const tableName of criticalTables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.log(`❌ Tabela ${tableName}: ERRO - ${error.message}`);
        } else {
          console.log(`✅ Tabela ${tableName}: OK (${count} registros)`);
        }
      } catch (err) {
        console.log(`❌ Tabela ${tableName}: ERRO - ${err.message}`);
      }
    }

    // 4. Salvar relatório detalhado
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total_vehicles: vehicles.length,
        total_collections: collections.length,
        inconsistencies_found: inconsistencies.length,
        audit_logs_count: auditLogs?.length || 0,
      },
      inconsistencies: inconsistencies,
      recommendations:
        inconsistencies.length > 0
          ? [
              'Corrigir status dos veículos inconsistentes',
              'Implementar sincronização automática de status',
              'Revisar lógica de atualização de collections',
            ]
          : ['Sistema funcionando corretamente'],
    };

    // Criar diretório reports se não existir
    if (!fs.existsSync('reports')) {
      fs.mkdirSync('reports');
    }

    fs.writeFileSync('reports/detailed-inconsistency-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Relatório detalhado salvo em: reports/detailed-inconsistency-report.json');
  } catch (error) {
    console.error('❌ Erro durante investigação:', error);
  }
}

investigateInconsistencies();
