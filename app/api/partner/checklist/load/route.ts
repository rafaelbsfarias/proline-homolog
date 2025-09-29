import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const { inspectionId } = await request.json();

    if (!inspectionId) {
      return NextResponse.json(
        { success: false, error: 'inspectionId é obrigatório' },
        { status: 400 }
      );
    }

    // Retornar um checklist mock por enquanto para testar
    const mockChecklist = {
      id: 'mock-checklist-id',
      inspection_id: inspectionId,
      status: 'draft',
      engine_oil_level: 'good',
      engine_oil_condition: 'good',
      coolant_level: 'good',
      brake_fluid_level: 'good',
      battery_condition: 'good',
      tire_condition: 'good',
      lights_functioning: 'all_working',
      brake_system: 'good',
      suspension: 'good',
      exhaust_system: 'good',
      notes: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json({
      ok: true,
      data: mockChecklist,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
