import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { handleApiError } from '@/lib/utils/apiErrorHandlers';
import { CreateUserUseCase, CreateUserInput } from '@/modules/admin/application/CreateUserUseCase';
import { getLogger, ILogger } from '@/modules/logger';
import { z } from 'zod';
import { SupabaseService } from '@/modules/common/services/SupabaseService';

const logger: ILogger = getLogger('AdminAddPartnerAPI');

// Headers para garantir runtime Node.js e comportamento dinâmico na Vercel
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function handleAddPartner(request: AuthenticatedRequest): Promise<Response> {
  const adminUser = request.user;
  logger.info(`Handler started by admin: ${adminUser?.email} (${adminUser?.id})`);

  try {
    const rawData = await request.json();
    logger.debug('Received raw data for new partner:', rawData);

    // Backward-compat: some clients send `document` instead of `cnpj`
    const normalized = {
      ...rawData,
      cnpj: rawData?.cnpj ?? rawData?.document,
    } as Record<string, any>;

    // Validate payload with Zod (early validation)
    const schema = z.object({
      name: z.preprocess(
        v => (v ?? '').toString().trim(),
        z.string({ required_error: 'Nome é obrigatório' }).min(2, 'Nome muito curto')
      ),
      email: z.preprocess(
        v => (v ?? '').toString().trim(),
        z.string({ required_error: 'E-mail é obrigatório' }).email('E-mail inválido')
      ),
      phone: z.preprocess(
        v => (v ?? '').toString().trim(),
        z
          .string({ required_error: 'Telefone é obrigatório' })
          .min(8, 'Telefone inválido')
          .max(32, 'Telefone inválido')
      ),
      cnpj: z.preprocess(
        v => (v ?? '').toString().trim(),
        z.string({ required_error: 'CNPJ é obrigatório' }).min(14, 'CNPJ inválido')
      ),
      companyName: z.preprocess(
        v => (v ?? '').toString().trim(),
        z
          .string({ required_error: 'Razão Social é obrigatória' })
          .min(2, 'Razão Social muito curta')
      ),
      contractValue: z.coerce.number().nonnegative().optional(),
      categoryKey: z.preprocess(v => (v ?? '').toString().trim(), z.string()).optional(),
      newCategoryName: z.preprocess(v => (v ?? '').toString().trim(), z.string()).optional(),
    });

    const parsed = schema.safeParse(normalized);
    if (!parsed.success) {
      const first = parsed.error.issues?.[0];
      const message = first?.message || 'Dados inválidos';
      return NextResponse.json({ error: message, code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    // Mapear os dados da requisição para o formato esperado pelo CreateUserUseCase
    const input: CreateUserInput = {
      name: parsed.data.name, // Representante da Empresa
      email: parsed.data.email,
      role: 'partner',
      phone: parsed.data.phone,
      documentType: 'CNPJ', // Assumindo CNPJ para parceiros
      document: parsed.data.cnpj,
      companyName: parsed.data.companyName, // Razão Social
    };
    logger.info(`Attempting to create new partner with email: ${input.email}`);

    const createUserUseCase = new CreateUserUseCase();
    const result = await createUserUseCase.execute(input);

    if (parsed.data.contractValue !== undefined) {
      const supabase = (
        await import('@/modules/common/services/SupabaseService')
      ).SupabaseService.getInstance().getAdminClient();
      await supabase
        .from('contract_partners')
        .upsert({ partner_id: result.userId!, contract_value: parsed.data.contractValue });
    }

    // Optional: link category
    const { categoryKey, newCategoryName } = parsed.data as any;
    if (categoryKey || newCategoryName) {
      const supabase = SupabaseService.getInstance().getAdminClient();
      let categoryId: string | null = null;
      if (newCategoryName) {
        const key = newCategoryName
          .toLowerCase()
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '')
          .slice(0, 40);
        const { data: existing } = await supabase
          .from('service_categories')
          .select('id')
          .eq('key', key)
          .maybeSingle();
        if (existing) categoryId = existing.id;
        else {
          const { data: created } = await supabase
            .from('service_categories')
            .insert({ key, name: newCategoryName })
            .select('id')
            .single();
          if (created) categoryId = created.id;
        }
      } else if (categoryKey) {
        const { data: cat } = await supabase
          .from('service_categories')
          .select('id')
          .eq('key', categoryKey)
          .maybeSingle();
        if (cat) categoryId = cat.id;
      }
      if (categoryId) {
        await supabase
          .from('partners_service_categories')
          .upsert({ partner_id: result.userId!, category_id: categoryId });
      }
    }

    logger.info(`Partner ${result.userId} created successfully.`);
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    logger.error('Error in handleAddPartner:', error);
    return handleApiError(error);
  }
}

export const POST = withAdminAuth(handleAddPartner);
