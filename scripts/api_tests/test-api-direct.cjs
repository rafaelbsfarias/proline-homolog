const fetch = require('node-fetch');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vMTI3LjAuMC4xOjU0MzIxL2F1dGgvdjEiLCJzdWIiOiI1NzEzZmEwMS0zNDc1LTRjNTItYWQ2NC01MjMwMjg1YWRlZjEiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzI2NjA1MTA3LCJpYXQiOjE3MjY2MDE1MDcsImVtYWlsIjoicGFydG5lci10ZXN0QHByb2xpbmUuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJuYW1lIjoiUGFydG5lciBUZXN0Iiwicm9sZSI6InBhcnRuZXIifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTcyNjYwMTUwN31dLCJzZXNzaW9uX2lkIjoiZGIyNjI1MmUtNzE1Zi00NmY1LTllMzQtMjg5YTMzNDBkMDRkIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.CqFkn0EaH-gQy3L6dGQWhtVsRnqVJvIwYmVNJlqfbPY';

(async () => {
  console.log('🧪 TESTANDO API DIRETAMENTE');
  console.log('==========================');

  try {
    const response = await fetch('http://localhost:3000/api/partner/budgets/57306036-9de7-4676-a6fa-1a1f0fee298d', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      timeout: 10000,
    });

    console.log('📡 Resposta da API:');
    console.log('   Status:', response.status);
    console.log('   Status Text:', response.statusText);
    
    const responseText = await response.text();
    console.log('   Resposta completa:', responseText);
    
  } catch (err) {
    console.log('❌ Erro:', err.message);
  }
})();
