import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testValidation() {
  console.log('🔍 Testando validação de categoria de parceiro no service layer...\n');

  try {
    // 1. Buscar um parceiro que NÃO seja de Mecânica
    const { data: nonMechanicPartner, error: partnerError } = await supabase
      .from('partners')
      .select('profile_id, category')
      .neq('category', 'Mecânica')
      .limit(1)
      .single();

    if (partnerError || !nonMechanicPartner) {
      console.error('❌ Não encontrou parceiro não-mecânico para teste');
      return;
    }

    console.log(
      `📋 Parceiro não-mecânico encontrado: ${nonMechanicPartner.category} (ID: ${nonMechanicPartner.profile_id.slice(0, 8)}...)`
    );

    // 2. Buscar um parceiro de Mecânica
    const { data: mechanicPartner, error: mechanicError } = await supabase
      .from('partners')
      .select('profile_id, category')
      .eq('category', 'Mecânica')
      .limit(1)
      .single();

    if (mechanicError || !mechanicPartner) {
      console.log('⚠️  Não encontrou parceiro de Mecânica para teste completo');
    } else {
      console.log(
        `📋 Parceiro de Mecânica encontrado: ${mechanicPartner.category} (ID: ${mechanicPartner.profile_id.slice(0, 8)}...)`
      );
    }

    // 3. Buscar um veículo para teste
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id')
      .limit(1)
      .single();

    if (vehicleError || !vehicle) {
      console.error('❌ Não encontrou veículo para teste');
      return;
    }

    console.log(`🚗 Veículo encontrado: ${vehicle.id.slice(0, 8)}...`);

    // 4. Testar validação diretamente no service layer
    console.log('\n🧪 Testando validação no ChecklistService...');

    // Importar o service
    const { ChecklistService } = await import(
      '../modules/partner/services/checklist/ChecklistService.js'
    );

    const checklistService = ChecklistService.getInstance();

    // Teste 1: Parceiro não-mecânico deve ser rejeitado
    console.log('\n🚫 Testando com parceiro não-mecânico...');
    const testDataNonMechanic = {
      vehicle_id: vehicle.id,
      inspection_id: `test-non-mechanic-${Date.now()}`,
      partner_id: nonMechanicPartner.profile_id,
      clutch: 'ok',
      observations: 'Teste de validação - deve ser bloqueado',
    };

    try {
      const resultNonMechanic = await checklistService.submitChecklist(testDataNonMechanic);
      if (
        resultNonMechanic.success === false &&
        resultNonMechanic.error?.includes('Apenas parceiros de Mecânica')
      ) {
        console.log(
          '✅ VALIDAÇÃO FUNCIONANDO: Parceiro não-mecânico foi corretamente rejeitado pelo service'
        );
        console.log(`   Erro: ${resultNonMechanic.error}`);
      } else {
        console.log('❌ VALIDAÇÃO FALHANDO: Service aceitou parceiro não-mecânico');
        console.log(`   Resultado:`, resultNonMechanic);
      }
    } catch (error) {
      if (error.message?.includes('Apenas parceiros de Mecânica')) {
        console.log(
          '✅ VALIDAÇÃO FUNCIONANDO: Parceiro não-mecânico foi corretamente rejeitado (exceção)'
        );
        console.log(`   Erro: ${error.message}`);
      } else {
        console.log('❌ VALIDAÇÃO FALHANDO: Erro inesperado com parceiro não-mecânico');
        console.log(`   Erro: ${error.message}`);
      }
    }

    // Teste 2: Parceiro de Mecânica deve ser aceito
    if (mechanicPartner) {
      console.log('\n🔧 Testando com parceiro de Mecânica...');
      const testDataMechanic = {
        vehicle_id: vehicle.id,
        inspection_id: `test-mechanic-${Date.now()}`,
        partner_id: mechanicPartner.profile_id,
        clutch: 'ok',
        observations: 'Teste de validação - deve ser permitido',
      };

      try {
        const resultMechanic = await checklistService.submitChecklist(testDataMechanic);
        if (resultMechanic.success === true) {
          console.log(
            '✅ VALIDAÇÃO FUNCIONANDO: Parceiro de Mecânica teve checklist aceito pelo service'
          );

          // Limpar o registro de teste
          await supabase
            .from('mechanics_checklist')
            .delete()
            .eq('inspection_id', testDataMechanic.inspection_id);

          console.log('🧹 Registro de teste limpo');
        } else {
          console.log('❌ VALIDAÇÃO PROBLEMÁTICA: Service rejeitou parceiro de Mecânica');
          console.log(`   Resultado:`, resultMechanic);
        }
      } catch (error) {
        console.log('❌ VALIDAÇÃO PROBLEMÁTICA: Service lançou erro com parceiro de Mecânica');
        console.log(`   Erro: ${error.message}`);
      }
    }

    // 5. Verificar registros existentes na tabela
    console.log('\n📊 Verificando registros atuais na tabela mechanics_checklist...');
    const { data: existingRecords, error: recordsError } = await supabase
      .from('mechanics_checklist')
      .select('id, partner_id, category, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recordsError) {
      console.error('❌ Erro ao consultar registros:', recordsError);
    } else {
      console.log(`📋 Total de registros encontrados: ${existingRecords?.length || 0}`);
      if (existingRecords && existingRecords.length > 0) {
        existingRecords.forEach((record, index) => {
          console.log(
            `   ${index + 1}. ID: ${record.id.slice(0, 8)}... | Parceiro: ${record.partner_id.slice(0, 8)}... | Categoria: ${record.category || 'N/A'}`
          );
        });
      }
    }
  } catch (error) {
    console.error('❌ Erro durante teste:', error);
  }
}

// Executar teste
testValidation()
  .then(() => {
    console.log('\n🏁 Teste concluído');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
