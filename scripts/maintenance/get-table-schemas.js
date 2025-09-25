import pkg from 'pg';
const { Client } = pkg;
import 'dotenv/config';

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 54322,
  database: process.env.DB_DATABASE || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

const SQL_QUERY = `
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM
    information_schema.columns
WHERE
    table_schema = 'public'
    AND table_name IN ('quotes', 'quote_items')
ORDER BY
    table_name,
    ordinal_position;
`;

async function getTableSchemas() {
  console.log('🔍 Buscando schemas para as tabelas: quotes, quote_items...');
  console.log('=========================================================');

  const client = new Client(DB_CONFIG);
  try {
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL');

    const res = await client.query(SQL_QUERY);
    const columns = res.rows;

    if (columns.length === 0) {
      console.log('⚠️ Nenhuma coluna encontrada para as tabelas especificadas.');
      return;
    }

    // Group columns by table
    const schemas = columns.reduce((acc, col) => {
      if (!acc[col.table_name]) {
        acc[col.table_name] = [];
      }
      acc[col.table_name].push(col);
      return acc;
    }, {});

    console.log('\n--- Schemas das Tabelas ---');
    for (const table in schemas) {
      console.log(`\nTabela: public.${table}`);
      console.log('--------------------------');
      schemas[table].forEach(col => {
        let columnInfo = `  -> ${col.column_name} | Tipo: ${col.data_type}`;
        if (col.is_nullable === 'NO') {
          columnInfo += ' | Obrigatório: Sim';
        }
        if (col.column_default) {
          columnInfo += ` | Padrão: ${col.column_default}`;
        }
        console.log(columnInfo);
      });
    }
    console.log('\n---------------------------');
  } catch (error) {
    console.error('❌ Erro ao buscar schemas:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão fechada.');
  }
}

getTableSchemas();
