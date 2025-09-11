/**
 * Migration script to populate collection_history table with existing finalized collections
 * Run this script after deploying the collection_history table migration
 *
 * Usage: npx ts-node scripts/migrate-collection-history.ts
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration - adjust these values according to your environment
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

async function migrateCollectionHistory() {
  console.log('🚀 Starting collection history migration...');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Get all approved collections that don't have history records yet
    const { data: approvedCollections, error } = await supabase
      .from('vehicle_collections')
      .select(
        `
        id,
        client_id,
        collection_address,
        collection_fee_per_vehicle,
        collection_date,
        payment_received,
        payment_received_at,
        created_at
      `
      )
      .eq('status', 'approved')
      .not('collection_date', 'is', null)
      .gt('collection_fee_per_vehicle', 0);

    if (error) {
      console.error('❌ Failed to fetch approved collections:', error.message);
      throw error;
    }

    if (!approvedCollections || approvedCollections.length === 0) {
      console.log('ℹ️ No approved collections found for migration');
      return;
    }

    console.log(`📊 Found ${approvedCollections.length} approved collections to migrate`);

    // Check which collections already have history records
    const collectionIds = approvedCollections.map(c => c.id);
    const { data: existingHistory } = await supabase
      .from('collection_history')
      .select('collection_id')
      .in('collection_id', collectionIds);

    const existingHistoryIds = new Set((existingHistory || []).map(h => h.collection_id));

    // Filter out collections that already have history records
    const collectionsToMigrate = approvedCollections.filter(c => !existingHistoryIds.has(c.id));

    console.log(`📝 ${collectionsToMigrate.length} collections need history records`);

    let successCount = 0;
    let errorCount = 0;

    // Create history records for each collection
    for (const collection of collectionsToMigrate) {
      try {
        // Count vehicles for this collection
        const { count: vehicleCount } = await supabase
          .from('vehicles')
          .select('*', { count: 'exact', head: true })
          .eq('collection_id', collection.id);

        const vehicleCountVal = Math.max(vehicleCount || 1, 1); // Ensure at least 1

        const historyRecord = {
          client_id: collection.client_id,
          collection_id: collection.id,
          collection_address: collection.collection_address,
          collection_fee_per_vehicle: collection.collection_fee_per_vehicle,
          collection_date: collection.collection_date,
          finalized_at: collection.created_at, // Use created_at as finalized_at for migration
          payment_received: collection.payment_received || false,
          payment_received_at: collection.payment_received_at,
          vehicle_count: vehicleCountVal,
        };

        const { error: insertError } = await supabase
          .from('collection_history')
          .insert(historyRecord);

        if (insertError) {
          console.error(`❌ Failed to migrate collection ${collection.id}:`, insertError.message);
          errorCount++;
        } else {
          console.log(`✅ Migrated collection ${collection.id} for client ${collection.client_id}`);
          successCount++;
        }
      } catch (recordError) {
        console.error(`❌ Exception migrating collection ${collection.id}:`, recordError);
        errorCount++;
      }
    }

    console.log(`\n📈 Migration Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📊 Total processed: ${collectionsToMigrate.length}`);

    if (errorCount === 0) {
      console.log('🎉 Collection history migration completed successfully!');
    } else {
      console.log('⚠️ Migration completed with some errors. Check logs above.');
    }
  } catch (error) {
    console.error('💥 Collection history migration failed:', error);
    throw error;
  }
}

// Execute migration
migrateCollectionHistory()
  .then(() => {
    console.log('🏁 Migration script finished');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  });
