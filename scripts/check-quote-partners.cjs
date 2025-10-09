require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkQuotePartners() {
  console.log('🔍 Verificando partner_ids das quotes recentes\n');
  
  const quoteIds = [
    '302ff28a-7465-4b9f-bf1d-5ec1687a10e1',
    '42abb905-35ec-4f80-b844-5bf60dac6afb'
  ];
  
  for (const qid of quoteIds) {
    const { data: quote } = await supabase
      .from('quotes')
      .select('id, partner_id, status, service_order_id')
      .eq('id', qid)
      .single();
      
    console.log(`📋 Quote ${qid}:`);
    console.log(`   Partner ID: ${quote?.partner_id}`);
    console.log(`   Status: ${quote?.status}`);
    
    if (quote?.partner_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, role')
        .eq('id', quote.partner_id)
        .single();
        
      console.log(`   Partner: ${profile?.full_name} (${profile?.email})`);
      console.log(`   Role: ${profile?.role}`);
      
      const { data: partner } = await supabase
        .from('partners')
        .select('company_name, profile_id')
        .eq('profile_id', quote.partner_id)
        .single();
        
      console.log(`   Company: ${partner?.company_name || 'NÃO ENCONTRADO NA TABELA PARTNERS'}`);
    }
    console.log('');
  }
  
  // Listar todos os parceiros
  console.log('\n📊 PARCEIROS DISPONÍVEIS:');
  const { data: allPartners } = await supabase
    .from('partners')
    .select('profile_id, company_name, partners_service_categories(service_categories(key, name))')
    .limit(10);
    
  allPartners?.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.company_name} (${p.profile_id})`);
    const cats = p.partners_service_categories?.map(pc => pc.service_categories?.name).join(', ');
    console.log(`     Categorias: ${cats || 'Nenhuma'}`);
  });
}

checkQuotePartners();
