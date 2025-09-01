import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';

export const POST = withAdminAuth(async (req: AuthenticatedRequest) => {
  try {
    console.log('🚀 TEST_ENDPOINT: Called successfully', {
      timestamp: new Date().toISOString(),
      user: req.user?.email,
      method: req.method,
      url: req.url,
    });

    const body = await req.json();

    console.log('📝 TEST_ENDPOINT_BODY:', body);

    return NextResponse.json({
      success: true,
      message: 'Test endpoint working',
      user: req.user?.email,
      body: body,
      timestamp: new Date().toISOString(),
    });
  } catch (e: unknown) {
    const error = e as Error;
    console.error('❌ TEST_ENDPOINT_ERROR:', error?.message);
    return NextResponse.json(
      { success: false, error: error?.message || 'Erro interno' },
      { status: 500 }
    );
  }
});
