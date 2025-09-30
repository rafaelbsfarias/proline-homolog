import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const VEHICLE_ID = '41648094-05fc-44b3-87c9-1c96becd715d';
const SPECIALIST_ID = '1e7d25e2-05c4-407b-bd58-b565a17fbe9d';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function validate() {
  const { data: specialist, error: specialistError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', SPECIALIST_ID)
    .single();

  const { data: vehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .select('id, client_id')
    .eq('id', VEHICLE_ID)
    .single();

  const { data: link, error: linkError } = await supabase
    .from('client_specialists')
    .select('client_id, specialist_id')
    .eq('client_id', vehicle?.client_id)
    .eq('specialist_id', SPECIALIST_ID)
    .single();

  console.log('Especialista:', specialist, specialistError);
  console.log('Veículo:', vehicle, vehicleError);
  console.log('Vínculo client_specialists:', link, linkError);
  console.log('Path esperado:', `${VEHICLE_ID}/${SPECIALIST_ID}/test.jpg`);
}

validate();
