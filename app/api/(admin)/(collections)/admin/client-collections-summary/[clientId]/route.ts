import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { getClientCollectionsSummary } from '@/modules/admin/services/clientCollectionsSummary';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function handler(req: AuthenticatedRequest, ctx: any) {
  try {
    const { clientId } = await (ctx as any).params;
    if (!clientId) {
      return NextResponse.json({ success: false, error: 'Cliente inválido' }, { status: 400 });
    }

    const data = await getClientCollectionsSummary(String(clientId));
    return NextResponse.json({ success: true, ...data });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request, context: any) {
  const wrapped = withAdminAuth(handler);
  return wrapped(request as any, context as any);
}
