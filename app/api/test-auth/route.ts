import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const POST = withAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const { clientId, addressId } = body;

    console.log('🔍 AUTH_TEST: Endpoint reached successfully', {
      user: req.user?.email,
      clientId,
      addressId,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Authentication test successful',
      user: req.user?.email,
      data: { clientId, addressId },
    });
  } catch (e: unknown) {
    const error = e as Error;
    console.error('AUTH_TEST_ERROR:', error?.message);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
});
