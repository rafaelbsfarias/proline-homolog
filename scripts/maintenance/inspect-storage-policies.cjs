/*
  Lista as policies do storage.objects relacionadas ao bucket 'vehicle-media'.
  Uso:
    NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
    node scripts/maintenance/inspect-storage-policies.cjs
*/
const { Client } = require('pg');

const dbUrl = process.env.SUPABASE_DB_URL;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  if (!dbUrl && (!url || !serviceKey)) {
    console.error('Defina SUPABASE_DB_URL ou NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  // Preferir conexão PG direta se disponível
  if (dbUrl) {
    const client = new Client({ connectionString: dbUrl });
    await client.connect();
    const sql = `
      SELECT policyname, schemaname, tablename, cmd,
             pg_get_expr(pol.qual, pol.relid) AS using,
             pg_get_expr(pol.with_check, pol.relid) AS with_check
      FROM pg_policy pol
      JOIN pg_class cls ON cls.oid = pol.relid
      JOIN pg_namespace nsp ON nsp.oid = cls.relnamespace
      WHERE nsp.nspname = 'storage' AND cls.relname = 'objects'
      ORDER BY policyname;
    `;
    const { rows } = await client.query(sql);
    rows.forEach(r => {
      console.log(`\n🔐 ${r.policyname} [${r.cmd}]`);
      console.log('USING:', r.using);
      console.log('WITH CHECK:', r.with_check);
    });
    await client.end();
  } else {
    console.log('Para inspecionar via HTTP, use o console SQL do Supabase.');
  }
}

main();

