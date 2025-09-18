#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local if present
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config();
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
if (!url || !serviceKey) {
  console.error('Missing Supabase env vars. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

const argv = new Map();
process.argv.slice(2).forEach((arg, idx, all) => {
  if (arg.startsWith('--')) {
    const k = arg.replace(/^--/, '');
    const v = all[idx + 1] && !all[idx + 1].startsWith('--') ? all[idx + 1] : 'true';
    argv.set(k, v);
  }
});

const clientId = argv.get('clientId') || process.env.CLIENT_ID || null;
const dryRun = argv.get('dryRun') !== 'false';
const limit = argv.has('limit') ? Number(argv.get('limit')) : undefined;

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function fmt(obj) {
  return JSON.stringify(obj, null, 2);
}

async function main() {
  console.log('Running dry-run orphan cleanup with params:', fmt({ clientId, dryRun, limit }));

  let q = admin
    .from('vehicle_collections')
    .select('id, client_id, collection_address, collection_date, status')
    .eq('status', 'requested');
  if (clientId) q = q.eq('client_id', clientId);
  if (limit) q = q.limit(limit);
  const { data: requested, error: reqErr } = await q;
  if (reqErr) throw new Error(`Failed to load requested: ${reqErr.message}`);

  const ids = (requested || []).map(r => r.id).filter(Boolean);
  if (!ids.length) {
    console.log('No requested collections found for the given filters.');
    return;
  }

  const { data: vehiclesRows, error: vErr } = await admin
    .from('vehicles')
    .select('id, collection_id')
    .in('collection_id', ids);
  if (vErr) throw new Error(`Failed to load vehicles: ${vErr.message}`);

  const counts = new Map();
  (vehiclesRows || []).forEach(r => {
    const cid = String(r?.collection_id || '');
    if (!cid) return;
    counts.set(cid, (counts.get(cid) || 0) + 1);
  });

  const orphans = (requested || []).filter(r => (counts.get(r.id) || 0) === 0);
  console.log('Detected orphan requested collections:', orphans.length);

  if (dryRun || orphans.length === 0) {
    console.log(fmt({ detected: orphans.length, deleted: 0 }));
    if (orphans.length) {
      console.log('Sample items (first 10):');
      console.log(fmt(orphans.slice(0, 10)));
    }
    return;
  }

  const orphanIds = orphans.map(o => o.id);
  const { error: delErr } = await admin
    .from('vehicle_collections')
    .delete()
    .in('id', orphanIds)
    .eq('status', 'requested');
  if (delErr) throw new Error(`Failed to delete orphans: ${delErr.message}`);
  console.log(fmt({ detected: orphans.length, deleted: orphanIds.length }));
}

main().catch(err => {
  console.error('Dry-run failed:', err?.message || err);
  process.exit(1);
});

