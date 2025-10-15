import { createClient } from './lib/supabase/server.js';

async function testEvidence() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('mechanics_checklist_evidences')
    .select('item_key, storage_path, inspection_id, quote_id, partner_id')
    .eq('quote_id', '78b4e14c-cc35-4139-b15a-1de6b36ba6dc')
    .eq('partner_id', '648bade7-3fb9-4c4c-b50f-fab0320e9c8b');

  console.log('Query result:', { data, error });
}

testEvidence();
