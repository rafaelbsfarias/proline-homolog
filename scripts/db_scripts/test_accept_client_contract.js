import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega variáveis de ambiente do .env.local na raiz do projeto
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey =
  process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error(
    'Erro: Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas.'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testAcceptClientContract() {
  let p_client_id;
  const { data: clientProfile, error: clientError } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'client')
    .limit(1);

  if (clientError || !clientProfile || clientProfile.length === 0) {
    console.error('Erro: Nenhum perfil de cliente encontrado. Por favor, crie um cliente primeiro.');
    process.exit(1);
  }
  p_client_id = clientProfile[0].id;
  const p_content = 'Conteúdo do contrato de teste para o cliente.';

  try {
    console.log(`Chamando public.accept_client_contract para client_id: ${p_client_id}`);
    const { error } = await supabase.rpc('accept_client_contract', {
      p_client_id,
      p_content,
    });

    if (error) {
      console.error('Erro ao chamar RPC accept_client_contract:', error);
    } else {
      console.log('RPC accept_client_contract chamado com sucesso!');
      console.log('Verifique a tabela client_contract_acceptance no Supabase para confirmar a inserção/atualização.');
    }
  } catch (error) {
    console.error('Erro inesperado ao executar o script:', error);
  }
}

testAcceptClientContract();
