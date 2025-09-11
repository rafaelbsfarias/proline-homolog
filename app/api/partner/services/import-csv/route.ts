import { NextResponse } from 'next/server';
import { withPartnerAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { handleApiError } from '@/lib/utils/apiErrorHandlers';
import { DatabaseError, ValidationError } from '@/lib/utils/errors';

// Função para fazer o parse de um texto CSV simples
function parseCsv(content: string): Record<string, string>[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];

  const header = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const row: Record<string, string> = {};
    header.forEach((h, i) => {
      row[h] = values[i];
    });
    return row;
  });
  return rows;
}

async function importServicesFromCsv(req: AuthenticatedRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('csvFile') as File | null;

    if (!file) {
      throw new ValidationError('Nenhum arquivo CSV foi enviado.');
    }

    const csvContent = await file.text();
    const servicesToImport = parseCsv(csvContent);

    if (servicesToImport.length === 0) {
      throw new ValidationError('O arquivo CSV está vazio ou em formato inválido.');
    }

    const supabase = SupabaseService.getInstance().getAdminClient();
    const partnerId = req.user.id;
    let failedCount = 0;

    const servicesForDb = servicesToImport
      .map(service => {
        const { name, description, price, category } = service;
        if (!name || !description || !price) {
          failedCount++;
          return null;
        }

        const serviceData: any = {
          name,
          description,
          price: Number(price),
          partner_id: partnerId,
        };

        // Adiciona a categoria como texto livre se ela existir no CSV
        if (category && typeof category === 'string' && category.trim() !== '') {
          serviceData.category = category.trim();
        }

        return serviceData;
      })
      .filter(Boolean); // Remove nulos (falhas de validação)

    if (servicesForDb.length > 0) {
      const { error: insertError } = await supabase.from('partner_services').insert(servicesForDb);

      if (insertError) {
        throw new DatabaseError(`Falha ao importar serviços: ${insertError.message}`);
      }
    }

    return NextResponse.json({ addedCount: servicesForDb.length, failedCount });
  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withPartnerAuth(importServicesFromCsv);
