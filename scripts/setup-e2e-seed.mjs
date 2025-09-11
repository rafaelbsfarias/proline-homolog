#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) dotenv.config({ path: envLocalPath });
else dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
if (!url || !serviceKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

function todayPlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function ensureClient() {
  // Prefer the standard test client used by Cypress config (auth + profiles aligned)
  const preferredEmail = 'cliente@prolineauto.com.br';

  // 1) Find auth user by email
  const { data: usersPage, error: usersErr } = await admin.auth.admin.listUsers();
  if (usersErr) throw usersErr;
  const authUser = (usersPage?.users || []).find(u => u.email === preferredEmail);
  if (!authUser) throw new Error(`Auth user not found for ${preferredEmail}`);
  const authId = authUser.id;

  // 2) Ensure profiles row with same id
  const { data: profileRow } = await admin.from('profiles').select('*').eq('id', authId).maybeSingle();
  if (profileRow) return profileRow;

  // If missing, create a minimal profile
  const newProfile = {
    id: authId,
    email: preferredEmail,
    full_name: authUser.user_metadata?.full_name || 'Cliente de Teste',
    role: 'client',
    user_role: 'client',
  };
  const { data: inserted, error: insertErr } = await admin.from('profiles').insert(newProfile).select('*').single();
  if (insertErr) throw insertErr;
  return inserted;
}

async function ensureAddress(clientId) {
  // Find any collect point address for this client
  const { data: addr } = await admin
    .from('addresses')
    .select('id, street, number, city, is_collect_point, profile_id')
    .eq('profile_id', clientId)
    .eq('is_collect_point', true)
    .limit(1)
    .maybeSingle();
  if (addr) return addr;
  // Create one
  const payload = {
    profile_id: clientId,
    street: 'Rua Teste E2E',
    number: '100',
    city: 'São Paulo',
    state: 'SP',
    zip_code: '00000-000',
    country: 'Brasil',
    is_collect_point: true,
  };
  const { data: created, error } = await admin.from('addresses').insert(payload).select('*').single();
  if (error) throw error;
  return created;
}

async function resetVehicles(clientId) {
  // Delete client vehicles, then insert 3 vehicles in initial status
  await admin.from('vehicles').delete().eq('client_id', clientId);
  const base = {
    client_id: clientId,
    status: 'AGUARDANDO DEFINIÇÃO DE COLETA',
    pickup_address_id: null,
    estimated_arrival_date: null,
    brand: 'Teste',
    model: 'E2E',
    year: 2024,
    color: 'Preto',
  };
  const rows = [
    { ...base, plate: 'E2E-0001' },
    { ...base, plate: 'E2E-0002' },
    { ...base, plate: 'E2E-0003' },
  ];
  const { data, error } = await admin.from('vehicles').insert(rows).select('id, plate');
  if (error) throw error;
  return data || [];
}

async function main() {
  const client = await ensureClient();
  const address = await ensureAddress(client.id);
  const vehicles = await resetVehicles(client.id);
  const out = {
    clientId: client.id,
    addressId: address.id,
    addressLabel: `${address.street}, ${address.number} - ${address.city}`,
    vehicles,
    dates: {
      d1: todayPlus(1),
      d2: todayPlus(2),
      d3: todayPlus(3),
      d4: todayPlus(4),
      d5: todayPlus(5),
    },
  };
  console.log('__SEED_JSON__ ' + JSON.stringify(out));
}

main().catch(err => {
  console.error('Seed failed:', err?.message || err);
  process.exit(1);
});
