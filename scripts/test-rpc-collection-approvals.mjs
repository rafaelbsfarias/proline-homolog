import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Carrega explicitamente o .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erro: URL do Supabase ou Chave de Serviço não definidas.');
  console.error('Verifique se o arquivo .env.local existe na raiz do projeto e contém as variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testRpc(clientId) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!clientId) {
    console.error('Erro: Nenhum client_id fornecido.');
    console.log('\nUso: node scripts/test-rpc-collection-approvals.mjs <client_id>');
    console.log('O <client_id> deve ser um UUID, não um token.');
    process.exit(1);
  }

  if (!uuidRegex.test(clientId)) {
      console.error('Erro: O ID fornecido não parece ser um UUID válido.');
      console.log(`ID recebido: ${clientId}`);
      console.log('\nPor favor, passe um ID de cliente (client_id) no formato UUID.');
      process.exit(1); 
  }


  console.log(`Testando RPC 'get_collections_for_approval' com client_id: ${clientId}`);

  try {
    const { data, error } = await supabase.rpc('get_collections_for_approval', {
      p_client_id: clientId,
    });

    if (error) {
      console.error('\nChamada RPC falhou:');
      console.error(error);
      return;
    }

    console.log('\nChamada RPC bem-sucedida. Resultado:');
    console.log(JSON.stringify(data, null, 2));

  } catch (e) {
    console.error('\nOcorreu um erro inesperado:', e);
  }
}

const clientIdFromArgs = process.argv[2];
testRpc(clientIdFromArgs);