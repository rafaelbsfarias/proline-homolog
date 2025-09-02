import { NextResponse } from 'next/server';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:test:check-supabase-images');

export const GET = async () => {
  try {
    const supabase = SupabaseService.getInstance().getAdminClient();

    // Verificar se existem imagens no storage do Supabase
    const { data: files, error } = await supabase.storage.from('vehicle-media').list('', {
      limit: 10,
      sortBy: { column: 'created_at', order: 'desc' },
    });

    if (error) {
      logger.error('Error checking Supabase storage:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao verificar storage do Supabase',
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Verificar se existem registros na tabela inspection_media
    const { data: mediaRecords, error: mediaError } = await supabase
      .from('inspection_media')
      .select('id, storage_path, inspection_id, created_at')
      .limit(10)
      .order('created_at', { ascending: false });

    if (mediaError) {
      logger.error('Error checking inspection_media table:', mediaError);
    }

    return NextResponse.json({
      success: true,
      storage: {
        hasFiles: files && files.length > 0,
        fileCount: files?.length || 0,
        recentFiles:
          files?.slice(0, 5).map((f: any) => ({
            // eslint-disable-line @typescript-eslint/no-explicit-any
            name: f.name,
            size: f.metadata?.size || 'unknown',
            created_at: f.created_at,
          })) || [],
      },
      database: {
        hasRecords: mediaRecords && mediaRecords.length > 0,
        recordCount: mediaRecords?.length || 0,
        recentRecords:
          mediaRecords?.slice(0, 5).map((r: any) => ({
            // eslint-disable-line @typescript-eslint/no-explicit-any
            id: r.id,
            storage_path: r.storage_path,
            inspection_id: r.inspection_id,
            created_at: r.created_at,
          })) || [],
        error: mediaError?.message,
      },
    });
  } catch (error) {
    logger.error('Unexpected error checking Supabase images:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
};
