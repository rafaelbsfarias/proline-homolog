const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vMTI3LjAuMC4xOjU0MzIxL2F1dGgvdjEiLCJzdWIiOiI1NzEzZmEwMS0zNDc1LTRjNTItYWQ2NC01MjMwMjg1YWRlZjEiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzU4MTU1NTU0LCJpYXQiOjE3NTgxNTE5NTQsImVtYWlsIjoicGFydG5lci10ZXN0QHByb2xpbmUuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwibmFtZSI6IlBhcnRuZXIgVGVzdCIsInJvbGUiOiJwYXJ0bmVyIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NTgxNTE5NTR9XSwic2Vzc2lvbl9pZCI6IjlmNmI4Nzk1LWVlMjEtNDc0MC05MGUwLTlmZGJiNDAyOTYxYyIsImlzX2Fub255bW91cyI6ZmFsc2V9.BwNkEb5wHnlLUDCbvkjF1wq3i0Oi9gYFlGjAm6eOVs8';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/partner/budgets/57306036-9de7-4676-a6fa-1a1f0fee298d',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  timeout: 5000,
};

console.log('🧪 TESTANDO API COM HTTP NATIVO');
console.log('===============================');

const req = http.request(options, (res) => {
  console.log('📡 Resposta da API:');
  console.log(`   Status: ${res.statusCode}`);
  console.log(`   Headers:`, res.headers);

  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('   Resposta completa:', data);
  });
});

req.on('error', (e) => {
  console.log(`❌ Erro: ${e.message}`);
});

req.on('timeout', () => {
  console.log('❌ Timeout na requisição');
  req.destroy();
});

req.end();
