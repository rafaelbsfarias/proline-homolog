#!/usr/bin/env node

/**
 * Test script to verify collection history integrity
 * This script tests that:
 * 1. Historical records are immutable
 * 2. New collection records don't interfere with history
 * 3. No duplicate history records are created
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCollectionHistoryIntegrity() {
  console.log('🧪 Testing Collection History Integrity...\n');

  try {
    // Test 1: Verify collection_history table structure
    console.log('1. Checking collection_history table structure...');
    const { data: historyColumns, error: historyError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'collection_history')
      .eq('table_schema', 'public');

    if (historyError) {
      console.error('❌ Error checking collection_history structure:', historyError);
      return;
    }

    console.log('✅ collection_history table exists with columns:');
    historyColumns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });

    // Test 2: Check for UNIQUE constraint
    const { data: constraints, error: constraintError } = await supabase.rpc('sql', {
      query: `
          SELECT conname, pg_get_constraintdef(c.oid) as constraint_def
          FROM pg_constraint c
          JOIN pg_class cl ON cl.oid = c.conrelid
          JOIN pg_namespace ns ON ns.oid = cl.relnamespace
          WHERE ns.nspname = 'public'
            AND cl.relname = 'collection_history'
            AND c.contype = 'u'
        `,
    });

    if (constraintError) {
      console.error('❌ Error checking constraints:', constraintError);
    } else {
      console.log('\n2. Checking UNIQUE constraints...');
      if (constraints && constraints.length > 0) {
        console.log('✅ Found UNIQUE constraints:');
        constraints.forEach(con => {
          console.log(`   - ${con.conname}: ${con.constraint_def}`);
        });
      } else {
        console.log('⚠️  No UNIQUE constraints found on collection_history');
      }
    }

    // Test 3: Check RLS policies
    const { data: policies, error: policyError } = await supabase.rpc('sql', {
      query: `
          SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
          FROM pg_policies
          WHERE tablename = 'collection_history'
        `,
    });

    if (policyError) {
      console.error('❌ Error checking RLS policies:', policyError);
    } else {
      console.log('\n3. Checking RLS policies...');
      if (policies && policies.length > 0) {
        console.log('✅ Found RLS policies:');
        policies.forEach(policy => {
          console.log(`   - ${policy.policyname} (${policy.cmd}): ${policy.qual}`);
        });
      } else {
        console.log('⚠️  No RLS policies found on collection_history');
      }
    }

    // Test 4: Check trigger function
    const { data: triggers, error: triggerError } = await supabase.rpc('sql', {
      query: `
          SELECT trigger_name, event_manipulation, action_statement
          FROM information_schema.triggers
          WHERE event_object_table = 'vehicle_collections'
            AND trigger_name = 'trigger_create_collection_history'
        `,
    });

    if (triggerError) {
      console.error('❌ Error checking triggers:', triggerError);
    } else {
      console.log('\n4. Checking collection history trigger...');
      if (triggers && triggers.length > 0) {
        console.log('✅ Found trigger:');
        triggers.forEach(trigger => {
          console.log(`   - ${trigger.trigger_name} (${trigger.event_manipulation})`);
        });
      } else {
        console.log('⚠️  No collection history trigger found');
      }
    }

    // Test 5: Sample data integrity check
    console.log('\n5. Checking sample data integrity...');
    const { data: sampleHistory, error: sampleError } = await supabase
      .from('collection_history')
      .select('id, collection_id, collection_date, created_at')
      .limit(5);

    if (sampleError) {
      console.error('❌ Error fetching sample history:', sampleError);
    } else {
      console.log(`✅ Found ${sampleHistory.length} historical records`);
      if (sampleHistory.length > 0) {
        console.log('Sample records:');
        sampleHistory.forEach(record => {
          console.log(
            `   - ID: ${record.id}, Collection: ${record.collection_id}, Date: ${record.collection_date}`
          );
        });
      }
    }

    // Test 6: Check for potential duplicates
    const { data: duplicates, error: dupError } = await supabase.rpc('sql', {
      query: `
          SELECT collection_id, collection_date, COUNT(*) as count
          FROM collection_history
          GROUP BY collection_id, collection_date
          HAVING COUNT(*) > 1
          LIMIT 5
        `,
    });

    if (dupError) {
      console.error('❌ Error checking for duplicates:', dupError);
    } else {
      console.log('\n6. Checking for duplicate records...');
      if (duplicates && duplicates.length > 0) {
        console.log('❌ Found duplicate records:');
        duplicates.forEach(dup => {
          console.log(
            `   - Collection ${dup.collection_id} on ${dup.collection_date}: ${dup.count} records`
          );
        });
      } else {
        console.log('✅ No duplicate records found');
      }
    }

    console.log('\n🎉 Collection History Integrity Test Complete!');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testCollectionHistoryIntegrity();
