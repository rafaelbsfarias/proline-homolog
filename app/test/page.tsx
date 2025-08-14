'use client';

import { useState } from 'react';

export default function TestPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testVehicleCount = async () => {
    setLoading(true);
    try {
      // Primeiro fazer login
      const loginResponse = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@prolineauto.com.br',
          password: '1234qwer',
        }),
      });

      const loginData = await loginResponse.json();

      if (loginData.session?.access_token) {
        // Testar contador de veículos
        const countResponse = await fetch('/api/client/vehicles-count', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${loginData.session.access_token}`,
          },
        });

        const countData = await countResponse.json();
        setResult(
          `Vehicle Count Status: ${countResponse.status}\n${JSON.stringify(countData, null, 2)}`
        );
      } else {
        setResult('Login failed - no token received');
      }
    } catch (error) {
      setResult(`Error: ${error}`);
    }
    setLoading(false);
  };

  const testLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@prolineauto.com.br',
          password: '1234qwer',
        }),
      });

      const data = await response.json();
      setResult(`Login Status: ${response.status}\n${JSON.stringify(data, null, 2)}`);

      if (data.session?.access_token) {
        // Testar criação de veículo
        const vehicleResponse = await fetch('/api/client/create-vehicle', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${data.session.access_token}`,
          },
          body: JSON.stringify({
            plate: 'TEST-9999',
            brand: 'Toyota',
            model: 'Corolla',
            color: 'Preto',
            year: 2023,
            fipeValue: 150000,
          }),
        });

        const vehicleData = await vehicleResponse.json();
        setResult(
          prev =>
            prev +
            `\n\nVehicle Creation Status: ${vehicleResponse.status}\n${JSON.stringify(vehicleData, null, 2)}`
        );
      }
    } catch (error) {
      setResult(`Error: ${error}`);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Test API</h1>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={testLogin} disabled={loading}>
          {loading ? 'Testing...' : 'Test Login & Vehicle Creation'}
        </button>
        <button onClick={testVehicleCount} disabled={loading}>
          {loading ? 'Testing...' : 'Test Vehicle Count'}
        </button>
      </div>
      <pre
        style={{
          marginTop: '20px',
          background: '#f5f5f5',
          padding: '10px',
          overflow: 'auto',
          maxHeight: '500px',
        }}
      >
        {result}
      </pre>
    </div>
  );
}
