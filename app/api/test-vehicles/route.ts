import { NextResponse } from 'next/server';
import { SupabaseService } from '@/modules/common/services/SupabaseService';

export async function GET() {
  try {
    const supabase = SupabaseService.getInstance().getAdminClient();

    // Testar se a tabela vehicles existe
    const { data, error } = await supabase.from('vehicles').select('id').limit(1);

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        hint: error.hint,
        details: error.details,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Vehicles table exists and is accessible',
      vehicleCount: data?.length || 0,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
