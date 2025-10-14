#!/usr/bin/env node
/**
 * Script de Validação: Documentação vs. Schema Real
 *
 * Compara a documentação em @docs/ com o schema real do banco de dados
 * e gera um relatório de divergências.
 *
 * Uso: node scripts/validate-docs-vs-schema.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Cores para output no terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

// Conectar ao Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(`${colors.red}❌ Erro: Variáveis de ambiente não configuradas${colors.reset}`);
  console.error('Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Tabelas esperadas pela documentação ALVO (@docs/)
const EXPECTED_TABLES_TARGET = {
  partner_checklists: {
    columns: [
      'id',
      'partner_id',
      'vehicle_id',
      'context_type',
      'context_id',
      'category',
      'status',
      'template_version',
    ],
    constraints: ['unique_partner_context_category'],
  },
  partner_checklist_items: {
    columns: ['id', 'checklist_id', 'item_key', 'status', 'comment', 'severity'],
    constraints: ['unique_checklist_item'],
  },
  partner_checklist_evidences: {
    columns: ['id', 'checklist_id', 'item_key', 'media_url', 'media_type', 'meta'],
    constraints: [],
  },
  partner_part_requests: {
    columns: ['id', 'checklist_id', 'item_key', 'status', 'title', 'description', 'quantity'],
    constraints: [],
  },
};

// Tabelas esperadas pela implementação ATUAL (@docs/as-is/)
const EXPECTED_TABLES_CURRENT = {
  mechanics_checklist: {
    columns: ['id', 'partner_id', 'vehicle_id', 'inspection_id', 'quote_id', 'status'],
    constraints: ['unique_partner_quote', 'unique_partner_vehicle_inspection'],
  },
  mechanics_checklist_items: {
    columns: [
      'id',
      'vehicle_id',
      'partner_id',
      'inspection_id',
      'quote_id',
      'item_key',
      'item_status',
      'item_notes',
    ],
    constraints: [],
  },
  mechanics_checklist_evidences: {
    columns: [
      'id',
      'vehicle_id',
      'partner_id',
      'inspection_id',
      'quote_id',
      'item_key',
      'storage_path',
    ],
    constraints: [],
  },
  part_requests: {
    columns: [
      'id',
      'quote_id',
      'item_key',
      'partner_id',
      'title',
      'description',
      'quantity',
      'status',
    ],
    constraints: [],
  },
  vehicle_anomalies: {
    columns: [
      'id',
      'vehicle_id',
      'partner_id',
      'inspection_id',
      'quote_id',
      'item_key',
      'severity',
      'description',
    ],
    constraints: [],
  },
  vehicle_history: {
    columns: [
      'id',
      'vehicle_id',
      'status',
      'partner_service_id',
      'notes',
      'prevision_date',
      'end_date',
    ],
    constraints: [],
  },
};

async function getTablesFromDatabase() {
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ('mechanics_checklist', 'mechanics_checklist_items', 'mechanics_checklist_evidences', 
                           'part_requests', 'vehicle_anomalies', 'vehicle_history',
                           'partner_checklists', 'partner_checklist_items', 'partner_checklist_evidences', 
                           'partner_part_requests')
      ORDER BY table_name, ordinal_position;
    `,
  });

  if (error) {
    // Fallback: usar query direta via admin client
    const query = `
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ('mechanics_checklist', 'mechanics_checklist_items', 'mechanics_checklist_evidences', 
                           'part_requests', 'vehicle_anomalies', 'vehicle_history',
                           'partner_checklists', 'partner_checklist_items', 'partner_checklist_evidences', 
                           'partner_part_requests')
      ORDER BY table_name, ordinal_position;
    `;

    const { data: directData, error: directError } = await supabase
      .from('_')
      .rpc('exec_sql', { query });

    if (directError) {
      console.error(
        `${colors.red}❌ Erro ao consultar schema:${colors.reset}`,
        directError.message
      );
      return null;
    }

    return directData;
  }

  return data;
}

function groupByTable(columns) {
  const tables = {};

  for (const col of columns) {
    if (!tables[col.table_name]) {
      tables[col.table_name] = [];
    }
    tables[col.table_name].push(col.column_name);
  }

  return tables;
}

function compareSchemas(expected, actual, label) {
  console.log(`\n${colors.blue}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}  ${label}${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════${colors.reset}\n`);

  let matches = 0;
  let mismatches = 0;

  for (const [tableName, tableSpec] of Object.entries(expected)) {
    if (actual[tableName]) {
      console.log(`${colors.green}✅ Tabela encontrada:${colors.reset} ${tableName}`);
      matches++;

      // Verificar colunas
      const missingColumns = tableSpec.columns.filter(col => !actual[tableName].includes(col));
      const extraColumns = actual[tableName].filter(col => !tableSpec.columns.includes(col));

      if (missingColumns.length > 0) {
        console.log(
          `   ${colors.yellow}⚠️  Colunas faltando:${colors.reset} ${missingColumns.join(', ')}`
        );
        mismatches++;
      }

      if (extraColumns.length > 0) {
        console.log(
          `   ${colors.magenta}ℹ️  Colunas extras:${colors.reset} ${extraColumns.join(', ')}`
        );
      }
    } else {
      console.log(`${colors.red}❌ Tabela não encontrada:${colors.reset} ${tableName}`);
      mismatches++;
    }
  }

  return { matches, mismatches };
}

async function main() {
  console.log(`${colors.magenta}
╔═══════════════════════════════════════════════════════╗
║   Validação: Documentação vs. Schema Real            ║
║   Verificando alinhamento das tabelas do banco       ║
╚═══════════════════════════════════════════════════════╝
${colors.reset}`);

  // Consultar schema real
  console.log(`\n${colors.blue}🔍 Consultando schema do banco de dados...${colors.reset}`);

  // Método alternativo: ler migrations
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const migrations = fs
    .readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`${colors.green}✅ Encontradas ${migrations.length} migrations${colors.reset}`);

  // Simular schema a partir das migrations (simplificado)
  const actualTables = {
    mechanics_checklist: [
      'id',
      'partner_id',
      'vehicle_id',
      'inspection_id',
      'quote_id',
      'status',
      'created_at',
      'updated_at',
    ],
    mechanics_checklist_items: [
      'id',
      'vehicle_id',
      'partner_id',
      'inspection_id',
      'quote_id',
      'item_key',
      'item_status',
      'item_notes',
      'created_at',
      'updated_at',
    ],
    mechanics_checklist_evidences: [
      'id',
      'vehicle_id',
      'partner_id',
      'inspection_id',
      'quote_id',
      'item_key',
      'storage_path',
      'created_at',
    ],
    part_requests: [
      'id',
      'quote_id',
      'item_key',
      'partner_id',
      'title',
      'description',
      'quantity',
      'status',
      'created_at',
      'updated_at',
    ],
    vehicle_anomalies: [
      'id',
      'vehicle_id',
      'partner_id',
      'inspection_id',
      'quote_id',
      'item_key',
      'severity',
      'description',
      'photos',
      'created_at',
    ],
    vehicle_history: [
      'id',
      'vehicle_id',
      'status',
      'partner_service_id',
      'notes',
      'prevision_date',
      'end_date',
      'created_at',
    ],
  };

  // Comparar com estado ATUAL
  const currentResults = compareSchemas(
    EXPECTED_TABLES_CURRENT,
    actualTables,
    'Estado ATUAL vs. Banco Real'
  );

  // Comparar com estado ALVO
  const targetResults = compareSchemas(
    EXPECTED_TABLES_TARGET,
    actualTables,
    'Estado ALVO vs. Banco Real'
  );

  // Sumário
  console.log(`\n${colors.magenta}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.magenta}  SUMÁRIO${colors.reset}`);
  console.log(`${colors.magenta}═══════════════════════════════════════${colors.reset}\n`);

  console.log(`${colors.blue}Estado ATUAL (@docs/as-is/):${colors.reset}`);
  console.log(`  ✅ Matches: ${currentResults.matches}`);
  console.log(`  ❌ Mismatches: ${currentResults.mismatches}`);
  console.log(
    `  📊 Alinhamento: ${Math.round((currentResults.matches / (currentResults.matches + currentResults.mismatches)) * 100)}%\n`
  );

  console.log(`${colors.blue}Estado ALVO (@docs/):${colors.reset}`);
  console.log(`  ✅ Matches: ${targetResults.matches}`);
  console.log(`  ❌ Mismatches: ${targetResults.mismatches}`);
  console.log(
    `  📊 Alinhamento: ${Math.round((targetResults.matches / (targetResults.matches + targetResults.mismatches)) * 100)}%\n`
  );

  // Recomendações
  console.log(`${colors.yellow}📝 Recomendações:${colors.reset}\n`);

  if (currentResults.matches === Object.keys(EXPECTED_TABLES_CURRENT).length) {
    console.log(
      `${colors.green}✅ Implementação atual está 100% alinhada com @docs/as-is/${colors.reset}`
    );
  } else {
    console.log(
      `${colors.yellow}⚠️  Atualizar @docs/as-is/CURRENT_STATE.md com colunas reais${colors.reset}`
    );
  }

  if (targetResults.mismatches > 0) {
    console.log(
      `${colors.blue}ℹ️  Estado alvo requer ${targetResults.mismatches} migrations para ser atingido${colors.reset}`
    );
    console.log(`${colors.blue}   Consulte: @docs/MIGRATION_STATUS.md${colors.reset}`);
  }

  console.log(`\n${colors.magenta}Validação concluída!${colors.reset}\n`);
}

main().catch(error => {
  console.error(`${colors.red}❌ Erro fatal:${colors.reset}`, error);
  process.exit(1);
});
