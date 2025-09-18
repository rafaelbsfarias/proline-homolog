import { createClient } from '@supabase/supabase-js';
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Config for Supabase client (for API-layer checks)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Config for direct PG client (for schema-layer checks)
const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 54322,
  database: process.env.DB_DATABASE || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

async function checkBudgetTables() {
  console.log('🔍 === VERIFICAÇÃO DAS TABELAS DE ORÇAMENTO ===');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const pgClient = new Client(DB_CONFIG);

  try {
    // --- API Layer Check (using Supabase client) ---
    console.log('\n--- Verificando acesso via API (Supabase) ---');
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select('id')
      .limit(1);

    if (quotesError) {
      console.error('❌ Erro ao acessar "quotes" via API:', quotesError.message);
    } else {
      console.log('✅ Tabela "quotes" acessível via API.');
    }

    const { data: items, error: itemsError } = await supabase
      .from('quote_items')
      .select('id')
      .limit(1);

    if (itemsError) {
      console.error('❌ Erro ao acessar "quote_items" via API:', itemsError.message);
    } else {
      console.log('✅ Tabela "quote_items" acessível via API.');
    }

    // --- Schema Layer Check (using direct PG client) ---
    console.log('\n--- Verificando schemas no Banco de Dados (Conexão Direta) ---');
    await pgClient.connect();
    console.log('✅ Conectado diretamente ao PostgreSQL.');

    // Listar todas as tabelas
    console.log('\n📊 Listando todas as tabelas do schema public...');
    const tablesResult = await pgClient.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name;
    `);
    console.log('✅ Tabelas encontradas:');
    tablesResult.rows.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });

    // Verificar a estrutura da tabela 'quotes'
    console.log('\n🔍 Verificando estrutura da tabela "quotes"...');
    const quotesStructureResult = await pgClient.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'quotes'
      ORDER BY ordinal_position;
    `);
    console.log('✅ Estrutura da tabela "quotes":');
    quotesStructureResult.rows.forEach(column => {
      console.log(
        `  - ${column.column_name}: ${column.data_type} (nullable: ${column.is_nullable})`
      );
    });

    // Verificar a estrutura da tabela 'quote_items'
    console.log('\n🔍 Verificando estrutura da tabela "quote_items"...');
    const quoteItemsStructureResult = await pgClient.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'quote_items'
      ORDER BY ordinal_position;
    `);
    console.log('✅ Estrutura da tabela "quote_items":');
    quoteItemsStructureResult.rows.forEach(column => {
      console.log(
        `  - ${column.column_name}: ${column.data_type} (nullable: ${column.is_nullable})`
      );
    });
  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  } finally {
    await pgClient.end();
    console.log('\n🔌 Conexão direta com o banco fechada.');
  }

  console.log('\n🔍 === FIM DA VERIFICAÇÃO ===');
}

checkBudgetTables();
