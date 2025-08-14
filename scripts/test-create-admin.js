import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api/admin/create-user'; // Ajuste a porta se necessário
const ADMIN_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vMTI3LjAuMC4xOjU0MzIxL2F1dGgvdjEiLCJzdWIiOiIxNWQ4YTk4Zi1kOWM5LTQwYjYtYjVhZS05ZjA5MDY1ODE0ZDMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzU1MDk5NTk0LCJpYXQiOjE3NTUwOTU5OTQsImVtYWlsIjoiYWRtaW5AcHJvbGluZWF1dG8uY29tLmJyIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZnVsbF9uYW1lIjoiQWRtaW5pc3RyYWRvciBQcmluY2lwYWwiLCJwcm9maWxlX2lkIjoiMTVkOGE5OGYtZDljOS00MGI2LWI1YWUtOWYwOTA2NTgxNGQzIiwicm9sZSI6ImFkbWluIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NTUwOTU5OTR9XSwic2Vzc2lvbl9pZCI6IjZlYzJhODNiLTE4MDQtNDAxYy1iODY2LTFhZDI0ZTRlOGJkNyIsImlzX2Fub255bW91cyI6ZmFsc2V9.HJxNsP2Zm2myQxlF1SyLCGefoAQ2SM73-p44OAs4C-8'; // Substitua pelo token de um admin válido

async function testCreateAdmin() {
  const userData = {
    name: 'Admin Teste',
    email: `admin.teste.${Date.now()}@example.com`,
    role: 'administrador',
  };

  try {
    console.log('Attempting to create admin with data:', userData);
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ADMIN_TOKEN}`,
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    console.log('\n--- API Response ---');
    console.log('Status:', response.status);
    console.log('Body:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\nAdmin created successfully!');
    } else {
      console.error('\nFailed to create admin.');
    }
  } catch (error) {
    console.error('\nError during fetch:', error);
  }
}

testCreateAdmin();
