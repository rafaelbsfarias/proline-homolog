const testMagicLinkAPI = async () => {
  const token =
    'eyJhbGciOiJIUzI1NiIsImtpZCI6Ikd4TnZ1Y0FwOUxCOUllbDQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2lyYmFqdGNqdGdsendsaWdwZ2txLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIwODMzYWU2My1iNmIwLTRmYjUtOWQ1ZS1jMmQ3MjM3MjBjYjQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzU0MjIyMjg4LCJpYXQiOjE3NTQyMTg2ODgsImVtYWlsIjoiYWRtaW5AcHJvbGluZWF1dG8uY29tLmJyIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnt9LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJyb2xlIjoiYWRtaW4ifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc1NDIxODY4OH1dLCJzZXNzaW9uX2lkIjoiYWUxNTk2ODAtZWViNC00ZDM1LTliYmItNGE1OTljYjZlZmM1IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.u2NeBIhJkCEYvRgNT1G3GZVmX41iJARRrNIiHutNRqk';

  try {
    const response = await fetch('https://portal.prolineauto.com.br/api/admin/send-magic-link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: 'rafael@serejo.tech',
      }),
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);

    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Erro na requisição:', error);
  }
};

testMagicLinkAPI();
