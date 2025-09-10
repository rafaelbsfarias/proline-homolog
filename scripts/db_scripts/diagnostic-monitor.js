// scripts/db_scripts/diagnostic-monitor.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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
// MONITOR DE BANCO DE DADOS - DIAGNÓSTICO DE FLUXO DE COLETAS
// =============================================================================

class DatabaseMonitor {
  constructor() {
    this.snapshots = [];
    this.logFile = path.resolve(__dirname, 'diagnostic-log.json');
  }

  // =============================================================================
  // CAPTURA DE SNAPSHOTS
  // =============================================================================

  async captureSnapshot(label = 'snapshot') {
    console.log(`\n📸 CAPTURANDO SNAPSHOT: ${label}`);

    const timestamp = new Date().toISOString();
    const snapshot = {
      timestamp,
      label,
      data: {},
    };

    try {
      // 1. Capturar estado dos veículos do cliente
      console.log('  📊 Capturando veículos...');
      const { data: vehicles, error: vehError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('client_id', '00ab894a-1120-4dbe-abb0-c1a6d64b516a') // ID do cliente de teste
        .order('created_at', { ascending: false });

      if (vehError) throw vehError;

      // 2. Capturar coletas ativas
      console.log('  📦 Capturando coletas ativas...');
      const { data: collections, error: collError } = await supabase
        .from('vehicle_collections')
        .select('*')
        .eq('client_id', '00ab894a-1120-4dbe-abb0-c1a6d64b516a')
        .order('created_at', { ascending: false });

      if (collError) throw collError;

      // 3. Capturar histórico de coletas
      console.log('  📚 Capturando histórico...');
      const { data: history, error: histError } = await supabase
        .from('collection_history')
        .select('*')
        .eq('client_id', '00ab894a-1120-4dbe-abb0-c1a6d64b516a')
        .order('created_at', { ascending: false });

      if (histError) throw histError;

      // 4. Capturar endereços do cliente
      console.log('  📍 Capturando endereços...');
      const { data: addresses, error: addrError } = await supabase
        .from('addresses')
        .select('*')
        .eq('profile_id', '00ab894a-1120-4dbe-abb0-c1a6d64b516a')
        .order('created_at', { ascending: false });

      if (addrError) throw addrError;

      snapshot.data = {
        vehicles: vehicles || [],
        collections: collections || [],
        history: history || [],
        addresses: addresses || [],
      };

      this.snapshots.push(snapshot);

      console.log(`✅ Snapshot "${label}" capturado com sucesso`);
      console.log(`   📊 Veículos: ${vehicles?.length || 0}`);
      console.log(`   📦 Coletas: ${collections?.length || 0}`);
      console.log(`   📚 Histórico: ${history?.length || 0}`);
      console.log(`   📍 Endereços: ${addresses?.length || 0}`);

      return snapshot;
    } catch (error) {
      console.error(`❌ Erro ao capturar snapshot "${label}":`, error);
      throw error;
    }
  }

  // =============================================================================
  // COMPARAÇÃO DE SNAPSHOTS
  // =============================================================================

  compareSnapshots(snapshot1, snapshot2, description = 'Comparação') {
    console.log(`\n🔍 ${description}`);
    console.log('='.repeat(60));

    const changes = {
      vehicles: this.compareArrays(
        snapshot1.data.vehicles,
        snapshot2.data.vehicles,
        'id',
        'vehicles'
      ),
      collections: this.compareArrays(
        snapshot1.data.collections,
        snapshot2.data.collections,
        'id',
        'collections'
      ),
      history: this.compareArrays(snapshot1.data.history, snapshot2.data.history, 'id', 'history'),
      addresses: this.compareArrays(
        snapshot1.data.addresses,
        snapshot2.data.addresses,
        'id',
        'addresses'
      ),
    };

    // Resumo das mudanças
    console.log('\n📊 RESUMO DAS MUDANÇAS:');
    Object.entries(changes).forEach(([table, change]) => {
      if (change.added.length > 0 || change.removed.length > 0 || change.modified.length > 0) {
        console.log(`   ${table}:`);
        if (change.added.length > 0) console.log(`     ➕ Adicionados: ${change.added.length}`);
        if (change.removed.length > 0) console.log(`     ➖ Removidos: ${change.removed.length}`);
        if (change.modified.length > 0)
          console.log(`     🔄 Modificados: ${change.modified.length}`);
      }
    });

    return changes;
  }

  compareArrays(arr1, arr2, keyField, tableName) {
    const map1 = new Map(arr1.map(item => [item[keyField], item]));
    const map2 = new Map(arr2.map(item => [item[keyField], item]));

    const added = [];
    const removed = [];
    const modified = [];

    // Itens adicionados (estão em arr2 mas não em arr1)
    arr2.forEach(item => {
      if (!map1.has(item[keyField])) {
        added.push(item);
      }
    });

    // Itens removidos (estão em arr1 mas não em arr2)
    arr1.forEach(item => {
      if (!map2.has(item[keyField])) {
        removed.push(item);
      }
    });

    // Itens modificados (estão em ambos mas com diferenças)
    arr1.forEach(item1 => {
      const item2 = map2.get(item1[keyField]);
      if (item2) {
        const differences = this.findDifferences(item1, item2);
        if (differences.length > 0) {
          modified.push({
            id: item1[keyField],
            before: item1,
            after: item2,
            changes: differences,
          });
        }
      }
    });

    // Log detalhado das mudanças
    if (added.length > 0) {
      console.log(`\n➕ ${tableName.toUpperCase()} ADICIONADOS:`);
      added.forEach(item => console.log(`   ID: ${item[keyField]} - ${JSON.stringify(item)}`));
    }

    if (removed.length > 0) {
      console.log(`\n➖ ${tableName.toUpperCase()} REMOVIDOS:`);
      removed.forEach(item => console.log(`   ID: ${item[keyField]} - ${JSON.stringify(item)}`));
    }

    if (modified.length > 0) {
      console.log(`\n🔄 ${tableName.toUpperCase()} MODIFICADOS:`);
      modified.forEach(change => {
        console.log(`   ID: ${change.id}`);
        change.changes.forEach(diff => {
          console.log(`     ${diff.field}: ${diff.before} → ${diff.after}`);
        });
      });
    }

    return { added, removed, modified };
  }

  findDifferences(obj1, obj2) {
    const differences = [];
    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

    allKeys.forEach(key => {
      const val1 = obj1[key];
      const val2 = obj2[key];

      if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        differences.push({
          field: key,
          before: val1,
          after: val2,
        });
      }
    });

    return differences;
  }

  // =============================================================================
  // PERSISTÊNCIA DE LOGS
  // =============================================================================

  saveLog() {
    try {
      const logData = {
        session: new Date().toISOString(),
        snapshots: this.snapshots,
        comparisons: [],
      };

      fs.writeFileSync(this.logFile, JSON.stringify(logData, null, 2));
      console.log(`\n💾 Log salvo em: ${this.logFile}`);
    } catch (error) {
      console.error('❌ Erro ao salvar log:', error);
    }
  }

  loadLog() {
    try {
      if (fs.existsSync(this.logFile)) {
        const data = JSON.parse(fs.readFileSync(this.logFile, 'utf8'));
        this.snapshots = data.snapshots || [];
        console.log(`📖 Log carregado: ${this.snapshots.length} snapshots`);
        return data;
      }
    } catch (error) {
      console.error('❌ Erro ao carregar log:', error);
    }
    return null;
  }

  // =============================================================================
  // UTILITÁRIOS
  // =============================================================================

  clearSnapshots() {
    this.snapshots = [];
    console.log('🧹 Snapshots limpos');
  }

  getLatestSnapshot() {
    return this.snapshots[this.snapshots.length - 1];
  }

  getSnapshotByLabel(label) {
    return this.snapshots.find(s => s.label === label);
  }
}

// =============================================================================
// FUNÇÕES DE DIAGNÓSTICO ESPECÍFICAS
// =============================================================================

async function diagnoseCollectionFlow() {
  const monitor = new DatabaseMonitor();

  console.log('🔬 INICIANDO DIAGNÓSTICO DE FLUXO DE COLETAS');
  console.log('='.repeat(60));

  try {
    // Carregar log anterior se existir
    monitor.loadLog();

    // Capturar estado inicial
    await monitor.captureSnapshot('ESTADO_INICIAL');

    console.log('\n✅ Diagnóstico concluído. Use os snapshots para análise.');
    console.log('💡 Execute as ações do fluxo e capture novos snapshots para comparação.');
  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
  } finally {
    monitor.saveLog();
  }
}

// =============================================================================
// EXECUÇÃO PRINCIPAL
// =============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  diagnoseCollectionFlow();
}

export { DatabaseMonitor, diagnoseCollectionFlow };
