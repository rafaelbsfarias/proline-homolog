import { NextRequest, NextResponse } from 'next/server';
import { SupabaseService } from '@/modules/common/services/SupabaseService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const supabase = SupabaseService.getInstance().getClient();

    // Get user from token
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No auth token' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Simple vehicle insert
    const { data: vehicle, error: insertError } = await supabase
      .from('vehicles')
      .insert({
        client_id: user.id,
        plate: body.plate || 'TEST-123',
        brand: body.brand || 'TestBrand',
        model: body.model || 'TestModel',
        color: body.color || 'TestColor',
        year: body.year || 2024,
        status: 'active',
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        {
          error: 'Insert failed',
          details: insertError.message,
          code: insertError.code,
          hint: insertError.hint,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, vehicle });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'General error',
        details: error instanceof Error ? error.message : 'Unknown',
      },
      { status: 500 }
    );
  }
}
