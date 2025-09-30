// Teste de upload para o bucket vehicle-media do Supabase
// Rode com: node test_upload_vehicle_media.js

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// --- DADOS HARDCODEADOS PARA TESTE LOCAL (PARTNER) ---
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const VEHICLE_ID = '41648094-05fc-44b3-87c9-1c96becd715d';
const USER_ID = '3b76bcbb-da43-44ac-be09-700cba1b35ae'; // partner_id
const FILE_PATH = './test.jpg';
const ACCESS_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vMTI3LjAuMC4xOjU0MzIxL2F1dGgvdjEiLCJzdWIiOiIzYjc2YmNiYi1kYTQzLTQ0YWMtYmUwOS03MDBjYmExYjM1YWUiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzU5MTg5MzEyLCJpYXQiOjE3NTkxODU3MTIsImVtYWlsIjoibWVjYW5pY2FAcGFyY2Vpcm8uY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZnVsbF9uYW1lIjoiUGFyY2Vpcm8gTWVjw6JuaWNhIiwicHJvZmlsZV9pZCI6IjNiNzZiY2JiLWRhNDMtNDRhYy1iZTA5LTcwMGNiYTFiMzVhZSIsInJvbGUiOiJwYXJ0bmVyIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NTkxODU3MTJ9XSwic2Vzc2lvbl9pZCI6ImM0OGFiMWY3LWM1OGItNGIzMS05MTZjLTI1YjVmNDNiNDkyMSIsImlzX2Fub255bW91cyI6ZmFsc2V9.-yDhyOXDsetSnTwJ_o7ss0_HAJnWdNg9lqxt9hk_mng';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function uploadTest() {
  console.log('--- DEBUG UPLOAD ---');
  console.log('SUPABASE_URL:', SUPABASE_URL);
  console.log('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY.slice(0, 10) + '...');
  console.log(
    'ACCESS_TOKEN (sub):',
    ACCESS_TOKEN.split('.')[1]
      ? Buffer.from(ACCESS_TOKEN.split('.')[1], 'base64').toString('utf8')
      : ''
  );
  console.log('VEHICLE_ID:', VEHICLE_ID);
  console.log('USER_ID:', USER_ID);
  console.log('FILE_PATH:', FILE_PATH);

  // Autentica o client com o access_token do usuário
  const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
    access_token: ACCESS_TOKEN,
    refresh_token: '',
  });
  if (sessionError) {
    console.error('Erro ao setar sessão:', sessionError);
    return;
  }
  console.log('Sessão autenticada:', sessionData);

  let fileBuffer;
  try {
    fileBuffer = fs.readFileSync(path.resolve(FILE_PATH));
  } catch (e) {
    console.error('Erro ao ler arquivo:', e);
    return;
  }
  const ext = path.extname(FILE_PATH).replace('.', '') || 'jpg';
  const fileName = `test-upload-${Date.now()}.${ext}`;
  const objectPath = `${VEHICLE_ID}/${USER_ID}/${fileName}`;
  console.log('Bucket: vehicle-media');
  console.log('Object path:', objectPath);

  const { data, error } = await supabase.storage
    .from('vehicle-media')
    .upload(objectPath, fileBuffer, {
      upsert: true,
      contentType: `image/${ext}`,
    });

  if (error) {
    console.error('Erro ao fazer upload:', error);
  } else {
    console.log('Upload realizado com sucesso! Path:', data.path);
  }
}

uploadTest();
