import { NextResponse } from 'next/server';

// Desabilitado temporariamente - imports quebrados
export async function GET() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function POST() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
