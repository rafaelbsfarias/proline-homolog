// db_scripts/generate_vehicles.js

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

const NUM_VEHICLES_TO_GENERATE = 100;

async function generateVehicles() {
  try {
    console.log(`
--- Gerando ${NUM_VEHICLES_TO_GENERATE} veículos ---`);

    // 1. Obter IDs de clientes existentes
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('profile_id');

    if (clientsError) {
      throw clientsError;
    }

    if (!clients || clients.length === 0) {
      console.warn('Nenhum cliente encontrado. Por favor, crie clientes primeiro.');
      return;
    }

    const clientIds = clients.map(client => client.profile_id);
    console.log(`Encontrados ${clientIds.length} clientes para associar veículos.`);

    const vehiclesToInsert = [];
    const brands = ['Toyota', 'Volkswagen', 'Ford', 'Chevrolet', 'Fiat', 'Honda'];
    const models = ['Corolla', 'Golf', 'Ka', 'Onix', 'Palio', 'Civic'];
    const colors = ['Branco', 'Preto', 'Prata', 'Vermelho', 'Azul'];

    for (let i = 0; i < NUM_VEHICLES_TO_GENERATE; i++) {
      const randomClientIndex = i % clientIds.length; // Cicla entre os clientes
      const clientId = clientIds[randomClientIndex];

      const randomBrand = brands[Math.floor(Math.random() * brands.length)];
      const randomModel = models[Math.floor(Math.random() * models.length)];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const randomYear = 2000 + Math.floor(Math.random() * 25); // Ano entre 2000 e 2024
      const plate = `ABC${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String(Math.floor(Math.random() * 10)).padStart(1, '0')}`; // Ex: ABC123A4

      vehiclesToInsert.push({
        client_id: clientId,
        plate: plate,
        brand: randomBrand,
        model: randomModel,
        color: randomColor,
        year: randomYear,
        status: 'ativo',
      });
    }

    // 2. Inserir veículos em lote
    console.log(`Inserindo ${vehiclesToInsert.length} veículos...`);
    const { error: insertError } = await supabase.from('vehicles').insert(vehiclesToInsert);

    if (insertError) {
      throw insertError;
    }

    console.log(`
--- ${NUM_VEHICLES_TO_GENERATE} veículos gerados e associados com sucesso! ---`);
  } catch (error) {
    console.error(`
--- Erro ao gerar veículos: ---`);
    console.error(error);
    process.exit(1);
  }
}

generateVehicles();
