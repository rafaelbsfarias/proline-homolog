/*
  Testa upload no bucket 'vehicle-media' exercitando RLS com um usuário parceiro real.
  Suporta autenticação com email/senha ou com ACCESS_TOKEN (setAuth sem refresh).

  Variáveis necessárias:
    - NEXT_PUBLIC_SUPABASE_URL
    - SUPABASE_ANON_KEY (ou NEXT_PUBLIC_SUPABASE_ANON_KEY)
    - VEHICLE_ID (uuid do veículo)

  Autenticação (escolha UMA das opções):
    - PARTNER_EMAIL + PARTNER_PASSWORD
    - TEST_ACCESS_TOKEN (access_token JWT válido do parceiro)

  Opcional:
    - TEST_IMAGE_PATH (caminho para arquivo local, ex: ./test.jpg)

  Uso:
    NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_ANON_KEY=... VEHICLE_ID=... \
    PARTNER_EMAIL=... PARTNER_PASSWORD=... \
    node scripts/maintenance/test-vehicle-media-upload.cjs

    OU com access token direto:
    NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_ANON_KEY=... VEHICLE_ID=... \
    TEST_ACCESS_TOKEN=... TEST_IMAGE_PATH=./test.jpg \
    node scripts/maintenance/test-vehicle-media-upload.cjs
*/

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const email = process.env.PARTNER_EMAIL;
const password = process.env.PARTNER_PASSWORD;
const accessToken = process.env.TEST_ACCESS_TOKEN || process.env.ACCESS_TOKEN;
const vehicleId = process.env.VEHICLE_ID;
const imagePath = process.env.TEST_IMAGE_PATH;

function assertEnv(cond, msg) {
  if (!cond) {
    console.error(`❌ ${msg}`);
    process.exit(1);
  }
}

assertEnv(url, 'NEXT_PUBLIC_SUPABASE_URL ausente');
assertEnv(anon, 'SUPABASE_ANON_KEY ausente');
assertEnv(vehicleId, 'VEHICLE_ID ausente');

function decodeJwtPayload(token) {
  try {
    const p = token.split('.')[1];
    const s = p.replace(/-/g, '+').replace(/_/g, '/');
    const b = Buffer.from(s, 'base64').toString('utf8');
    return JSON.parse(b);
  } catch { return null; }
}

async function main() {
  let supabase = createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let userId;
  if (accessToken) {
    console.log('🔑 Usando TEST_ACCESS_TOKEN (setAuth)...');
    // setAuth pode não existir em algumas versões; garantimos via headers globais
    if (supabase?.auth?.setAuth) {
      supabase.auth.setAuth(accessToken);
    } else {
      supabase = createClient(url, anon, {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
      });
    }
    const payload = decodeJwtPayload(accessToken);
    userId = payload?.sub;
    console.log('👤 userId (JWT sub):', userId);
  } else {
    assertEnv(email && password, 'Defina PARTNER_EMAIL e PARTNER_PASSWORD, ou TEST_ACCESS_TOKEN');
    console.log('🔑 Autenticando com email/senha...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      console.error('❌ Erro de autenticação:', authError.message);
      process.exit(1);
    }
    userId = authData.user?.id;
    console.log('✅ Autenticado:', userId);
  }

  if (!/^[0-9a-fA-F-]{36}$/.test(vehicleId)) {
    console.warn('⚠️ VEHICLE_ID não parece um UUID. Verifique.');
  }

  let content;
  let contentType = 'text/plain';
  if (imagePath) {
    const abs = path.resolve(imagePath);
    assertEnv(fs.existsSync(abs), `Arquivo não encontrado: ${abs}`);
    content = fs.readFileSync(abs);
    const ext = path.extname(abs).toLowerCase();
    contentType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.png' ? 'image/png' : 'application/octet-stream';
  } else {
    content = Buffer.from('upload test');
  }

  const name = imagePath ? path.basename(imagePath) : `test-${Date.now()}.txt`;
  const objectPath = `${vehicleId}/${userId}/${name}`;
  console.log('⬆️ Upload path:', objectPath);
  console.log('🧾 Content-Type:', contentType);

  const { data, error } = await supabase.storage
    .from('vehicle-media')
    .upload(objectPath, content, { contentType, upsert: true });

  if (error) {
    console.error('❌ Upload falhou:', error.message);
    process.exit(1);
  }
  console.log('✅ Upload OK:', data?.path);
}

main();
