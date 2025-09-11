import pkg from 'pg';
const { Client } = pkg;

const DB_CONFIG = {
  host: '127.0.0.1',
  port: 54322,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres',
};

async function investigateSpecificDates() {
  const client = new Client(DB_CONFIG);

  try {
    await client.connect();
    console.log('🔍 INVESTIGAÇÃO DETALHADA - COLETAS 15 E 17');
    console.log('===========================================');

    // Verificar todas as collections entre 15 e 17 de setembro
    const collectionsResult = await client.query(`
      SELECT
        vc.id,
        vc.status,
        vc.collection_date,
        vc.created_at,
        vc.updated_at,
        COUNT(v.id) as vehicle_count,
        array_agg(v.plate ORDER BY v.plate) as vehicle_plates
      FROM vehicle_collections vc
      LEFT JOIN vehicles v ON vc.id = v.collection_id
      WHERE DATE(vc.collection_date) BETWEEN '2025-09-15' AND '2025-09-17'
      GROUP BY vc.id, vc.status, vc.collection_date, vc.created_at, vc.updated_at
      ORDER BY vc.collection_date
    `);

    const collections = collectionsResult.rows;
    console.log(`Total de collections encontradas (15-17 set): ${collections.length}\n`);

    collections.forEach((coll, index) => {
      console.log(`📅 Collection ${index + 1}:`);
      console.log(`   ID: ${coll.id}`);
      console.log(`   Status: ${coll.status}`);
      console.log(`   Data da collection: ${coll.collection_date}`);
      console.log(`   Criado em: ${coll.created_at}`);
      console.log(`   Atualizado em: ${coll.updated_at}`);
      console.log(
        `   Veículos: ${coll.vehicle_count} (${coll.vehicle_plates?.join(', ') || 'nenhum'})`
      );
      console.log('');
    });

    // Verificar se há veículos que aparecem em múltiplas datas
    console.log('🔍 VERIFICAÇÃO DE VEÍCULOS DUPLICADOS POR DATA:');
    console.log('-----------------------------------------------');

    const vehicleDateResult = await client.query(`
      SELECT
        v.plate,
        DATE(vc.collection_date) as collection_date,
        vc.status as collection_status,
        vc.id as collection_id
      FROM vehicles v
      JOIN vehicle_collections vc ON v.collection_id = vc.id
      WHERE DATE(vc.collection_date) BETWEEN '2025-09-15' AND '2025-09-17'
      ORDER BY v.plate, vc.collection_date
    `);

    const vehicleDates = vehicleDateResult.rows;

    // Agrupar por placa
    const vehicleGroups = {};
    vehicleDates.forEach(vd => {
      if (!vehicleGroups[vd.plate]) {
        vehicleGroups[vd.plate] = [];
      }
      vehicleGroups[vd.plate].push({
        date: vd.collection_date,
        status: vd.collection_status,
        collection_id: vd.collection_id,
      });
    });

    // Verificar duplicatas
    let duplicatesFound = 0;
    Object.entries(vehicleGroups).forEach(([plate, collections]) => {
      if (collections.length > 1) {
        duplicatesFound++;
        console.log(`\n🔴 VEÍCULO DUPLICADO: ${plate}`);
        collections.forEach((coll, idx) => {
          console.log(
            `   ${idx + 1}. Data: ${coll.date} | Status: ${coll.status} | Collection: ${coll.collection_id.slice(0, 8)}...`
          );
        });
      }
    });

    if (duplicatesFound === 0) {
      console.log('✅ Nenhum veículo aparece em múltiplas datas');
    }

    // Verificar histórico de collections
    console.log('\n📚 VERIFICAÇÃO DO HISTÓRICO DE COLLECTIONS:');
    console.log('--------------------------------------------');

    const historyResult = await client.query(`
      SELECT
        DATE(collection_date) as date,
        COUNT(*) as total_collections,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'requested' THEN 1 ELSE 0 END) as requested,
        COUNT(DISTINCT
          (SELECT COUNT(*) FROM vehicles v WHERE v.collection_id = vc.id)
        ) as vehicles_with_collections
      FROM vehicle_collections vc
      WHERE DATE(vc.collection_date) BETWEEN '2025-09-15' AND '2025-09-17'
      GROUP BY DATE(collection_date)
      ORDER BY date
    `);

    const history = historyResult.rows;
    console.log('Resumo por data:');

    history.forEach(h => {
      console.log(
        `   ${h.date}: ${h.total_collections} collections (${h.approved} approved, ${h.requested} requested) - ${h.vehicles_with_collections} veículos`
      );
    });

    // Verificar se há collections órfãs ou problemas
    console.log('\n⚠️  VERIFICAÇÃO DE PROBLEMAS ADICIONAIS:');
    console.log('---------------------------------------');

    const orphanResult = await client.query(`
      SELECT COUNT(*) as orphaned_collections
      FROM vehicle_collections vc
      LEFT JOIN vehicles v ON vc.id = v.collection_id
      WHERE v.collection_id IS NULL
    `);

    const orphaned = orphanResult.rows[0].orphaned_collections;
    console.log(`Collections órfãs (sem veículos): ${orphaned}`);

    if (orphaned > 0) {
      const orphanDetails = await client.query(`
        SELECT vc.id, vc.status, vc.collection_date
        FROM vehicle_collections vc
        LEFT JOIN vehicles v ON vc.id = v.collection_id
        WHERE v.collection_id IS NULL
        ORDER BY vc.collection_date DESC
      `);

      console.log('Detalhes das collections órfãs:');
      orphanDetails.rows.forEach(orphan => {
        console.log(
          `   ID: ${orphan.id.slice(0, 8)}... | Status: ${orphan.status} | Data: ${orphan.collection_date}`
        );
      });
    }
  } catch (error) {
    console.error('❌ Erro na investigação:', error);
  } finally {
    await client.end();
  }
}

investigateSpecificDates();
