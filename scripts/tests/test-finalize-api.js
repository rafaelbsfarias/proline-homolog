import fetch from 'node-fetch';

async function testFinalizeChecklist() {
  try {
    console.log('🧪 Testando finalização de checklist...');

    const response = await fetch('http://localhost:3000/api/specialist/finalize-checklist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vehicleId: '04b93f8c-c6c6-416e-bdae-94e2ef182bcf',
      }),
    });

    const result = await response.json();
    console.log('📋 Status:', response.status);
    console.log('📋 Resposta:', result);
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testFinalizeChecklist();
