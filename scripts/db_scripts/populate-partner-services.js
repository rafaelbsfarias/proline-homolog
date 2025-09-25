import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Definição de serviços por categoria com subcategorias
const servicesByCategory = {
  mechanics: {
    categoryName: 'Mecânica',
    subcategories: {
      motor: {
        name: 'Motor',
        services: [
          {
            name: 'Troca de óleo e filtros',
            description: 'Troca completa de óleo do motor, filtro de óleo e filtro de ar',
            price: 150,
          },
          {
            name: 'Revisão completa do motor',
            description: 'Verificação de velas, cabos, correias e sistema de arrefecimento',
            price: 300,
          },
          {
            name: 'Reparo de sistema de freios',
            description: 'Revisão e reparo de discos, tambores e pastilhas de freio',
            price: 400,
          },
          {
            name: 'Troca de embreagem',
            description: 'Substituição completa do kit de embreagem',
            price: 800,
          },
          {
            name: 'Reparo de suspensão',
            description: 'Revisão e reparo de amortecedores, molas e terminais',
            price: 600,
          },
        ],
      },
      transmissao: {
        name: 'Transmissão',
        services: [
          {
            name: 'Troca de fluido de transmissão',
            description: 'Drenagem e reposição do fluido de câmbio',
            price: 120,
          },
          {
            name: 'Reparo de câmbio manual',
            description: 'Reparo e regulagem de câmbio manual',
            price: 500,
          },
          {
            name: 'Manutenção de diferencial',
            description: 'Revisão e lubrificação do diferencial',
            price: 250,
          },
        ],
      },
      eletrica: {
        name: 'Elétrica',
        services: [
          { name: 'Reparo de bateria', description: 'Teste e substituição de bateria', price: 200 },
          {
            name: 'Reparo de alternador',
            description: 'Revisão e reparo do sistema de carregamento',
            price: 350,
          },
          {
            name: 'Instalação de acessórios elétricos',
            description: 'Instalação de som, alarme e acessórios',
            price: 150,
          },
        ],
      },
    },
  },
  body_paint: {
    categoryName: 'Funilaria e Pintura',
    subcategories: {
      funilaria: {
        name: 'Funilaria',
        services: [
          {
            name: 'Reparo de amassados',
            description: 'Retirada de amassados sem pintura',
            price: 300,
          },
          {
            name: 'Troca de para-choques',
            description: 'Substituição de para-choques dianteiro/traseiro',
            price: 600,
          },
          {
            name: 'Reparo de portas e capô',
            description: 'Reparo estrutural de portas e capô',
            price: 800,
          },
          {
            name: 'Alinhamento e balanceamento',
            description: 'Correção da geometria das rodas',
            price: 100,
          },
        ],
      },
      pintura: {
        name: 'Pintura',
        services: [
          { name: 'Pintura completa', description: 'Pintura de todo o veículo', price: 2500 },
          { name: 'Pintura parcial', description: 'Pintura de painel, porta ou capô', price: 800 },
          {
            name: 'Polimento e cristalização',
            description: 'Polimento profissional e proteção da pintura',
            price: 200,
          },
          {
            name: 'Remoção de riscos',
            description: 'Correção de pequenos riscos na pintura',
            price: 150,
          },
        ],
      },
    },
  },
  washing: {
    categoryName: 'Lavagem',
    subcategories: {
      exterior: {
        name: 'Lavagem Exterior',
        services: [
          {
            name: 'Lavagem completa exterior',
            description: 'Lavagem, enceramento e secagem',
            price: 30,
          },
          {
            name: 'Lavagem ecológica',
            description: 'Lavagem com produtos biodegradáveis',
            price: 40,
          },
          {
            name: 'Lavagem com cera',
            description: 'Lavagem com aplicação de cera protetora',
            price: 50,
          },
        ],
      },
      interior: {
        name: 'Higienização Interior',
        services: [
          {
            name: 'Higienização completa interior',
            description: 'Limpeza de bancos, carpete e painéis',
            price: 80,
          },
          {
            name: 'Limpeza de ar-condicionado',
            description: 'Limpeza e desinfecção do sistema de ar',
            price: 60,
          },
          {
            name: 'Impermeabilização de estofados',
            description: 'Proteção contra umidade nos bancos',
            price: 100,
          },
        ],
      },
    },
  },
  tires: {
    categoryName: 'Pneus',
    subcategories: {
      montagem: {
        name: 'Montagem e Balanceamento',
        services: [
          {
            name: 'Montagem de pneus',
            description: 'Montagem profissional de pneus novos',
            price: 40,
          },
          {
            name: 'Balanceamento de rodas',
            description: 'Balanceamento computadorizado',
            price: 25,
          },
          {
            name: 'Alinhamento de direção',
            description: 'Correção da geometria da suspensão',
            price: 60,
          },
        ],
      },
      reparo: {
        name: 'Reparo e Manutenção',
        services: [
          { name: 'Reparo de furos', description: 'Reparo de furos em pneus', price: 20 },
          { name: 'Calibragem de pneus', description: 'Ajuste da pressão dos pneus', price: 10 },
          {
            name: 'Rotação de pneus',
            description: 'Reorganização dos pneus para desgaste uniforme',
            price: 30,
          },
        ],
      },
    },
  },
  loja: {
    categoryName: 'Loja',
    subcategories: {
      acessorios: {
        name: 'Acessórios',
        services: [
          {
            name: 'Instalação de películas',
            description: 'Aplicação de películas de proteção',
            price: 200,
          },
          {
            name: 'Instalação de som automotivo',
            description: 'Instalação completa de sistema de som',
            price: 300,
          },
          {
            name: 'Instalação de alarme',
            description: 'Instalação de sistema de alarme',
            price: 150,
          },
        ],
      },
      pecas: {
        name: 'Peças e Componentes',
        services: [
          { name: 'Venda de óleo e filtros', description: 'Óleos, filtros de óleo e ar', price: 0 },
          { name: 'Venda de velas e cabos', description: 'Velas de ignição e cabos', price: 0 },
          {
            name: 'Venda de pastilhas de freio',
            description: 'Pastilhas dianteiras e traseiras',
            price: 0,
          },
        ],
      },
    },
  },
  patio_atacado: {
    categoryName: 'Pátio Atacado',
    subcategories: {
      recepcao: {
        name: 'Recepção de Veículos',
        services: [
          {
            name: 'Recepção e inspeção inicial',
            description: 'Avaliação inicial do veículo',
            price: 50,
          },
          {
            name: 'Organização no pátio',
            description: 'Posicionamento estratégico no pátio',
            price: 25,
          },
          {
            name: 'Controle de entrada/saída',
            description: 'Registro de movimentação de veículos',
            price: 30,
          },
        ],
      },
      armazenamento: {
        name: 'Armazenamento',
        services: [
          {
            name: 'Armazenamento coberto',
            description: 'Armazenamento protegido da intempérie',
            price: 15,
          },
          {
            name: 'Armazenamento descoberto',
            description: 'Armazenamento em área aberta',
            price: 10,
          },
          {
            name: 'Armazenamento climatizado',
            description: 'Armazenamento com controle de temperatura',
            price: 25,
          },
        ],
      },
    },
  },
};

async function populatePartnerServices() {
  console.log('🚀 Iniciando população de serviços dos parceiros...\n');

  // Buscar todos os parceiros e suas categorias
  const { data: partners, error: partnersError } = await supabase.from(
    'partners_service_categories'
  ).select(`
      partner_id,
      partners!inner(company_name),
      service_categories!inner(key, name)
    `);

  if (partnersError || !partners) {
    console.log('❌ Erro ao buscar parceiros:', partnersError);
    return;
  }

  console.log(`📋 Encontrados ${partners.length} parceiros associados a categorias\n`);

  let totalServicesCreated = 0;

  for (const partnerRelation of partners) {
    const partnerId = partnerRelation.partner_id;
    const partnerName = partnerRelation.partners.company_name;
    const categoryKey = partnerRelation.service_categories.key;
    const categoryName = partnerRelation.service_categories.name;

    console.log(`🔧 Populando serviços para: ${partnerName} (${categoryName})`);

    const categoryServices = servicesByCategory[categoryKey];
    if (!categoryServices) {
      console.log(`⚠️  Serviços não definidos para categoria: ${categoryKey}`);
      continue;
    }

    let partnerServicesCreated = 0;

    // Para cada subcategoria
    for (const [subcategoryKey, subcategory] of Object.entries(categoryServices.subcategories)) {
      console.log(`  📂 Subcategoria: ${subcategory.name}`);

      // Para cada serviço na subcategoria
      for (const service of subcategory.services) {
        try {
          const { error: serviceError } = await supabase.from('partner_services').insert({
            partner_id: partnerId,
            name: service.name,
            description: service.description,
            price: service.price,
            category: subcategory.name,
            category_id: null, // Pode ser usado para referenciar service_categories se necessário
            created_at: new Date().toISOString(),
          });

          if (serviceError) {
            if (serviceError.code === '23505') {
              // Unique constraint violation
              console.log(`    ⚠️  Serviço já existe: ${service.name}`);
            } else {
              console.log(`    ❌ Erro ao criar serviço ${service.name}:`, serviceError.message);
            }
          } else {
            console.log(`    ✅ Criado: ${service.name} - R$ ${service.price}`);
            partnerServicesCreated++;
            totalServicesCreated++;
          }
        } catch (error) {
          console.log(`    ❌ Erro inesperado: ${error.message}`);
        }
      }
    }

    console.log(`📊 ${partnerName}: ${partnerServicesCreated} serviços criados\n`);
  }

  console.log(`🎉 Processo concluído!`);
  console.log(`📊 Total de serviços criados: ${totalServicesCreated}`);

  // Verificar resultado final
  const { data: finalServices, error: finalError } = await supabase
    .from('partner_services')
    .select('partner_id, name, category, price')
    .order('partner_id, category');

  if (!finalError && finalServices) {
    console.log('\n📋 Resumo final dos serviços:');
    const servicesByPartner = {};
    finalServices.forEach(service => {
      if (!servicesByPartner[service.partner_id]) {
        servicesByPartner[service.partner_id] = [];
      }
      servicesByPartner[service.partner_id].push(service);
    });

    Object.entries(servicesByPartner).forEach(([partnerId, services]) => {
      console.log(`\n🏢 Parceiro ${partnerId}:`);
      const servicesByCategory = {};
      services.forEach(service => {
        if (!servicesByCategory[service.category]) {
          servicesByCategory[service.category] = [];
        }
        servicesByCategory[service.category].push(service);
      });

      Object.entries(servicesByCategory).forEach(([category, catServices]) => {
        console.log(`  📂 ${category}: ${catServices.length} serviços`);
      });
    });
  }
}

populatePartnerServices();
