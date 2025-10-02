import { NextResponse, type NextRequest } from 'next/server';

const enabled = process.env.ENABLE_DEV_ROUTES === 'true';

export async function POST(req: NextRequest, ctx: any) {
  if (!enabled) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const original = await import('@/app/api/test-full-flow/route');
  if (typeof (original as any).POST !== 'function') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return (original as any).POST(req as any, ctx);
}
