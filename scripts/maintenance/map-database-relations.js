import pkg from 'pg';
const { Client } = pkg;
import 'dotenv/config';

// Carrega as variáveis de .env.local ou do ambiente
const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 54322,
  database: process.env.DB_DATABASE || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

const SQL_QUERY = `
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;
`;

async function mapDatabaseRelations() {
  console.log('🗺️  Mapeando Relações do Banco de Dados (Chaves Estrangeiras)...');
  console.log('================================================================');

  const client = new Client(DB_CONFIG);
  try {
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL');

    const res = await client.query(SQL_QUERY);
    const relations = res.rows;

    if (relations.length === 0) {
      console.log("⚠️ Nenhuma relação de chave estrangeira encontrada no schema 'public'.");
      return;
    }

    // Agrupa as relações por tabela
    const relationsByTable = relations.reduce((acc, rel) => {
      if (!acc[rel.table_name]) {
        acc[rel.table_name] = [];
      }
      acc[rel.table_name].push(rel);
      return acc;
    }, {});

    console.log('\n--- Mapa de Relações ---');
    for (const table in relationsByTable) {
      console.log(`\nTabela: public.${table}`);
      relationsByTable[table].forEach(rel => {
        console.log(
          `  -> Coluna '${rel.column_name}' referencia public.${rel.foreign_table_name} (${rel.foreign_column_name})`
        );
      });
    }
    console.log('\n------------------------');
  } catch (error) {
    console.error('❌ Erro ao mapear relações do banco de dados:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão fechada. Mapeamento concluído.');
  }
}

mapDatabaseRelations();
