import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PUT(request: Request) {
  try {
    const checklistData = await request.json();

    if (!checklistData.inspection_id) {
      return NextResponse.json(
        { success: false, error: 'inspection_id é obrigatório' },
        { status: 400 }
      );
    }

    // Mock submit response
    return NextResponse.json({
      success: true,
      data: {
        ...checklistData,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
