#!/usr/bin/env node
/**
 * Simple script to exercise admin endpoints related to client collections.
 *
 * Usage:
 *   node scripts/test-collections.mjs --base http://localhost:3000 \
 *     --token "$ADMIN_JWT" --client <clientId>
 *
 * Env var alternatives:
 *   BASE_URL, ADMIN_TOKEN, CLIENT_ID
 */

const args = Object.fromEntries(
  (() => {
    const out = [];
    const argv = process.argv.slice(2);
    for (let i = 0; i < argv.length; i++) {
      const cur = argv[i];
      const m = cur.match(/^--([^=]+)=(.*)$/);
      if (m) {
        out.push([m[1], m[2]]);
      } else if (cur.startsWith('--')) {
        const key = cur.slice(2);
        // Se próximo argumento não começa com --, é valor
        if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
          out.push([key, argv[i + 1]]);
          i++;
        } else {
          out.push([key, true]);
        }
      }
    }
    return out;
  })()
);

const BASE = args.base || process.env.BASE_URL || 'http://localhost:3000';
const TOKEN = args.token || process.env.ADMIN_TOKEN || '';
const CLIENT_ID = args.client || process.env.CLIENT_ID || '';

function h1(t) { console.log(`\n=== ${t} ===`); }

async function doGet(path) {
  const url = `${BASE}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (TOKEN) {
    // Tenta Authorization: Bearer <token>
    headers.Authorization = `Bearer ${TOKEN}`;
    // Tenta x-access-token sem Bearer
    headers['x-access-token'] = TOKEN;
  }
  const res = await fetch(url, { headers });
  const ct = res.headers.get('content-type') || '';
  let body;
  if (ct.includes('application/json')) body = await res.json();
  else body = await res.text();
  return { status: res.status, ok: res.ok, body };
}

async function main() {
  if (!TOKEN) {
    console.warn('WARN: No admin token provided. Set --token or ADMIN_TOKEN');
  }
  if (!CLIENT_ID) {
    console.warn('WARN: No CLIENT_ID provided. Set --client or CLIENT_ID');
  }

  // 1) Summary per client (groups, approvalGroups, clientSummary, statusTotals)
  if (CLIENT_ID) {
    h1(`GET /api/admin/client-collections-summary/${CLIENT_ID}`);
    const r1 = await doGet(`/api/admin/client-collections-summary/${CLIENT_ID}`);
    console.log('status:', r1.status, 'ok:', r1.ok);
    console.dir(r1.body, { depth: 4 });
  } else {
    console.log('Skipping client-collections-summary: no CLIENT_ID');
  }

  // 2) Overall list that powers DataPanel
  h1('GET /api/admin/clients-with-collection-summary');
  const r2 = await doGet('/api/admin/clients-with-collection-summary');
  console.log('status:', r2.status, 'ok:', r2.ok);
  console.dir(r2.body, { depth: 3 });

  // 3) Legacy (optional): collection requests by client (if table is used)
  if (CLIENT_ID) {
    h1(`GET /api/admin/collection-requests/${CLIENT_ID}`);
    const r3 = await doGet(`/api/admin/collection-requests/${CLIENT_ID}`);
    console.log('status:', r3.status, 'ok:', r3.ok);
    console.dir(r3.body, { depth: 4 });
  }
}

main().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});
