import { NextResponse, type NextRequest } from 'next/server';
import * as original from '@/app/api/test-price-verification/route';

const enabled = process.env.ENABLE_DEV_ROUTES === 'true';

export async function GET(req: NextRequest, ctx: any) {
  if (!enabled || typeof (original as any).GET !== 'function') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return (original as any).GET(req as any, ctx);
}
export async function POST(req: NextRequest, ctx: any) {
  if (!enabled || typeof (original as any).POST !== 'function') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return (original as any).POST(req as any, ctx);
}
