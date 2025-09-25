/**
 * Testes de Integração - PartnerService API v2
 *
 * Testa todos os endpoints da API v2 com cenários reais:
 * - CRUD completo (Create, Read, Update, Delete)
 * - Validação de entrada
 * - Autenticação e autorização
 * - Tratamento de erros
 * - Paginação e filtros
 * - Casos de borda
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Configuração do cliente de teste
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

describe('PartnerService API v2 - Integração', () => {
  let testPartnerId: string;
  let testServiceId: string;
  let authToken: string;

  // Configuração inicial
  beforeAll(async () => {
    // Criar parceiro de teste
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .insert({
        company_name: 'Oficina Teste API v2',
        email: `teste-api-v2-${Date.now()}@example.com`,
        phone: '11999999999',
        category_id: 'mecânica',
      })
      .select()
      .single();

    if (partnerError) throw partnerError;
    testPartnerId = partner.id;

    // Criar usuário para o parceiro
    const { error: userError } = await supabase.auth.admin.createUser({
      email: `teste-api-v2-${Date.now()}@example.com`,
      password: 'senha123',
      user_metadata: {
        partner_id: testPartnerId,
        role: 'partner',
      },
    });

    if (userError) throw userError;

    // Simular login para obter token (em produção seria feito via API de login)
    authToken = 'mock-jwt-token-for-testing';
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (testPartnerId) {
      await supabase.from('partners').delete().eq('id', testPartnerId);
    }
  });

  describe('POST /api/partner/services/v2 - Criar Serviço', () => {
    it('deve criar serviço com dados válidos', async () => {
      const serviceData = {
        name: 'Troca de Óleo - Teste',
        price: 89.9,
        description: 'Serviço de teste para integração',
      };

      const response = await fetch('http://localhost:3000/api/partner/services/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(serviceData),
      });

      expect(response.status).toBe(201);

      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id');
      expect(result.data.name).toBe(serviceData.name);
      expect(result.data.price).toBe(serviceData.price);
      expect(result.data.partnerId).toBe(testPartnerId);

      testServiceId = result.data.id;
    });

    it('deve rejeitar criação sem autenticação', async () => {
      const serviceData = {
        name: 'Serviço Sem Auth',
        price: 50.0,
        description: 'Teste sem autenticação',
      };

      const response = await fetch('http://localhost:3000/api/partner/services/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData),
      });

      expect(response.status).toBe(401);

      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('UNAUTHORIZED_ERROR');
    });

    it('deve rejeitar dados inválidos - nome vazio', async () => {
      const invalidData = {
        name: '',
        price: 89.9,
        description: 'Descrição válida',
      };

      const response = await fetch('http://localhost:3000/api/partner/services/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(invalidData),
      });

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.details).toHaveProperty('name');
    });

    it('deve rejeitar dados inválidos - preço negativo', async () => {
      const invalidData = {
        name: 'Serviço Válido',
        price: -10.0,
        description: 'Preço negativo',
      };

      const response = await fetch('http://localhost:3000/api/partner/services/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(invalidData),
      });

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.details).toHaveProperty('price');
    });

    it('deve rejeitar dados inválidos - descrição muito longa', async () => {
      const invalidData = {
        name: 'Serviço Válido',
        price: 89.9,
        description: 'a'.repeat(501), // 501 caracteres
      };

      const response = await fetch('http://localhost:3000/api/partner/services/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(invalidData),
      });

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.details).toHaveProperty('description');
    });
  });

  describe('GET /api/partner/services/v2 - Listar Serviços', () => {
    beforeEach(async () => {
      // Criar alguns serviços de teste
      const services = [
        {
          partner_id: testPartnerId,
          name: 'Serviço A',
          price: 50.0,
          description: 'Descrição A',
        },
        {
          partner_id: testPartnerId,
          name: 'Serviço B',
          price: 75.0,
          description: 'Descrição B',
        },
        {
          partner_id: testPartnerId,
          name: 'Outro Serviço',
          price: 100.0,
          description: 'Descrição C',
        },
      ];

      for (const service of services) {
        await supabase.from('partner_services').insert(service);
      }
    });

    it('deve listar serviços do parceiro autenticado', async () => {
      const response = await fetch('http://localhost:3000/api/partner/services/v2', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data.services)).toBe(true);
      expect(result.data.services.length).toBeGreaterThan(0);
      expect(result.data).toHaveProperty('total');
      expect(result.data).toHaveProperty('page');
      expect(result.data).toHaveProperty('limit');
    });

    it('deve rejeitar listagem sem autenticação', async () => {
      const response = await fetch('http://localhost:3000/api/partner/services/v2');

      expect(response.status).toBe(401);

      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('UNAUTHORIZED_ERROR');
    });

    it('deve suportar paginação', async () => {
      const response = await fetch('http://localhost:3000/api/partner/services/v2?page=1&limit=2', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.services.length).toBeLessThanOrEqual(2);
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(2);
    });

    it('deve suportar filtro por nome', async () => {
      const response = await fetch('http://localhost:3000/api/partner/services/v2?name=Serviço', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.services.length).toBeGreaterThan(0);

      // Verificar se todos os serviços retornados contêm "Serviço" no nome
      result.data.services.forEach((service: any) => {
        expect(service.name.toLowerCase()).toContain('serviço');
      });
    });

    it('deve rejeitar parâmetros de paginação inválidos', async () => {
      const response = await fetch(
        'http://localhost:3000/api/partner/services/v2?page=0&limit=150',
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/partner/services/v2/{serviceId} - Buscar Serviço Específico', () => {
    it('deve retornar serviço específico do parceiro', async () => {
      const response = await fetch(
        `http://localhost:3000/api/partner/services/v2/${testServiceId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(testServiceId);
      expect(result.data.partnerId).toBe(testPartnerId);
    });

    it('deve rejeitar acesso sem autenticação', async () => {
      const response = await fetch(
        `http://localhost:3000/api/partner/services/v2/${testServiceId}`
      );

      expect(response.status).toBe(401);

      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('UNAUTHORIZED_ERROR');
    });

    it('deve retornar 404 para serviço inexistente', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await fetch(`http://localhost:3000/api/partner/services/v2/${fakeId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(404);

      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('NOT_FOUND_ERROR');
    });

    it('deve rejeitar acesso a serviço de outro parceiro', async () => {
      // Criar serviço para outro parceiro
      const { data: otherPartner } = await supabase
        .from('partners')
        .insert({
          company_name: 'Outro Parceiro',
          email: `outro-${Date.now()}@example.com`,
          phone: '11999999998',
          category_id: 'mecânica',
        })
        .select()
        .single();

      const { data: otherService } = await supabase
        .from('partner_services')
        .insert({
          partner_id: otherPartner.id,
          name: 'Serviço de Outro',
          price: 50.0,
          description: 'Serviço de outro parceiro',
        })
        .select()
        .single();

      const response = await fetch(
        `http://localhost:3000/api/partner/services/v2/${otherService.id}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status).toBe(403);

      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('FORBIDDEN_ERROR');

      // Limpar
      await supabase.from('partner_services').delete().eq('id', otherService.id);
      await supabase.from('partners').delete().eq('id', otherPartner.id);
    });
  });

  describe('PUT /api/partner/services/v2/{serviceId} - Atualizar Serviço', () => {
    it('deve atualizar serviço com dados válidos', async () => {
      const updateData = {
        price: 99.9,
        description: 'Descrição atualizada',
      };

      const response = await fetch(
        `http://localhost:3000/api/partner/services/v2/${testServiceId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(testServiceId);
      expect(result.data.price).toBe(updateData.price);
      expect(result.data.description).toBe(updateData.description);
      expect(result.data.name).toBe('Troca de Óleo - Teste'); // Não alterado
    });

    it('deve atualizar apenas campos fornecidos', async () => {
      const updateData = {
        name: 'Nome Atualizado',
      };

      const response = await fetch(
        `http://localhost:3000/api/partner/services/v2/${testServiceId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.name).toBe(updateData.name);
      expect(result.data.price).toBe(99.9); // Mantém valor anterior
    });

    it('deve rejeitar atualização sem autenticação', async () => {
      const updateData = {
        price: 150.0,
      };

      const response = await fetch(
        `http://localhost:3000/api/partner/services/v2/${testServiceId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        }
      );

      expect(response.status).toBe(401);

      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('UNAUTHORIZED_ERROR');
    });

    it('deve rejeitar atualização de serviço inexistente', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const updateData = {
        price: 150.0,
      };

      const response = await fetch(`http://localhost:3000/api/partner/services/v2/${fakeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(404);

      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('NOT_FOUND_ERROR');
    });

    it('deve rejeitar dados inválidos na atualização', async () => {
      const invalidData = {
        price: -50.0,
      };

      const response = await fetch(
        `http://localhost:3000/api/partner/services/v2/${testServiceId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(invalidData),
        }
      );

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/partner/services/v2/{serviceId} - Desativar Serviço', () => {
    it('deve desativar serviço com sucesso', async () => {
      const response = await fetch(
        `http://localhost:3000/api/partner/services/v2/${testServiceId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.message).toContain('desativado');
    });

    it('deve rejeitar desativação sem autenticação', async () => {
      const response = await fetch(
        `http://localhost:3000/api/partner/services/v2/${testServiceId}`,
        {
          method: 'DELETE',
        }
      );

      expect(response.status).toBe(401);

      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('UNAUTHORIZED_ERROR');
    });

    it('deve rejeitar desativação de serviço inexistente', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await fetch(`http://localhost:3000/api/partner/services/v2/${fakeId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(404);

      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('NOT_FOUND_ERROR');
    });

    it('deve permitir desativação de serviço já desativado', async () => {
      // Tentar desativar novamente
      const response = await fetch(
        `http://localhost:3000/api/partner/services/v2/${testServiceId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.success).toBe(true);
    });
  });

  describe('Cenários de Borda e Casos Especiais', () => {
    it('deve lidar com IDs malformados', async () => {
      const malformedId = 'invalid-id-format';

      const response = await fetch(`http://localhost:3000/api/partner/services/v2/${malformedId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
    });

    it('deve lidar com corpo de requisição vazio', async () => {
      const response = await fetch('http://localhost:3000/api/partner/services/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
    });

    it('deve lidar com JSON malformado', async () => {
      const response = await fetch('http://localhost:3000/api/partner/services/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: '{invalid json}',
      });

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result.success).toBe(false);
    });

    it('deve lidar com limite de paginação máximo', async () => {
      const response = await fetch(
        'http://localhost:3000/api/partner/services/v2?page=1&limit=100',
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.limit).toBe(100);
    });

    it('deve lidar com caracteres especiais no nome', async () => {
      const serviceData = {
        name: 'Serviço com Acentos: àáâãéêíóôõúüç',
        price: 100.0,
        description: 'Teste com caracteres especiais',
      };

      const response = await fetch('http://localhost:3000/api/partner/services/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(serviceData),
      });

      expect(response.status).toBe(201);

      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.name).toBe(serviceData.name);
    });
  });

  describe('Performance e Limites', () => {
    it('deve responder dentro do tempo limite', async () => {
      const startTime = Date.now();

      const response = await fetch('http://localhost:3000/api/partner/services/v2', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(2000); // Menos de 2 segundos
    });

    it('deve lidar com muitos serviços na paginação', async () => {
      // Criar vários serviços para teste de paginação
      const services: Array<{
        partner_id: string;
        name: string;
        price: number;
        description: string;
      }> = [];
      for (let i = 0; i < 25; i++) {
        services.push({
          partner_id: testPartnerId,
          name: `Serviço ${i}`,
          price: 10.0 + i,
          description: `Descrição do serviço ${i}`,
        });
      }

      await supabase.from('partner_services').insert(services);

      // Testar primeira página
      const response1 = await fetch(
        'http://localhost:3000/api/partner/services/v2?page=1&limit=10',
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response1.status).toBe(200);
      const result1 = await response1.json();
      expect(result1.data.services.length).toBe(10);
      expect(result1.data.page).toBe(1);

      // Testar segunda página
      const response2 = await fetch(
        'http://localhost:3000/api/partner/services/v2?page=2&limit=10',
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response2.status).toBe(200);
      const result2 = await response2.json();
      expect(result2.data.services.length).toBe(10);
      expect(result2.data.page).toBe(2);

      // Limpar serviços de teste
      await supabase.from('partner_services').delete().in('partner_id', [testPartnerId]);
    });
  });
});
