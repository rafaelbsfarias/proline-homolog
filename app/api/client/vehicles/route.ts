// app/api/client/vehicles/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:client:vehicles');

export async function GET(request: NextRequest) {
  try {
    logger.info('vehicles:list:start');

    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('vehicles:list:no-auth-header');
      return NextResponse.json(
        { success: false, error: 'Token de autenticação não fornecido' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Create Supabase client with the token
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn('vehicles:list:unauthorized', { error: authError?.message });
      return NextResponse.json(
        { success: false, error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Get client profile
    const { data: clientProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', user.id)
      .single();

    if (profileError || !clientProfile) {
      logger.warn('vehicles:list:profile-not-found', {
        userId: user.id,
        error: profileError?.message,
      });
      return NextResponse.json(
        { success: false, error: 'Perfil do cliente não encontrado' },
        { status: 404 }
      );
    }

    logger.info('vehicles:list:fetching', {
      clientId: clientProfile.id,
      userId: user.id.slice(0, 8),
    });

    // Get vehicles for this client
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select(
        `
        id,
        brand,
        model,
        year,
        plate,
        color,
        status,
        pickup_address_id,
        estimated_arrival_date,
        created_at,
        updated_at
      `
      )
      .eq('client_id', clientProfile.id)
      .order('created_at', { ascending: false });

    if (vehiclesError) {
      logger.error('vehicles:list:db-error', {
        error: vehiclesError.message,
        clientId: clientProfile.id,
      });
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar veículos' },
        { status: 500 }
      );
    }

    logger.info('vehicles:list:success', {
      clientId: clientProfile.id,
      vehiclesCount: vehicles?.length || 0,
    });

    return NextResponse.json({
      success: true,
      vehicles: vehicles || [],
      count: vehicles?.length || 0,
      client: {
        id: clientProfile.id,
        name: clientProfile.full_name,
        email: clientProfile.email,
      },
    });
  } catch (error) {
    logger.error('vehicles:list:unexpected-error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
