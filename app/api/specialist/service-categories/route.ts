import { NextResponse } from 'next/server';
import { withAnyAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';

export const dynamic = 'force-dynamic';

// CHANGED: Wrapped with withAnyAuth to allow any authenticated user to fetch categories
export const GET = withAnyAuth(async (req: AuthenticatedRequest) => {
  const supabase = SupabaseService.getInstance().getAdminClient();

  try {
    const { data: categories, error } = await supabase
      .from('service_categories')
      .select('id, key, name, type')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching service categories:', { message: error.message });
      throw new Error('Failed to fetch service categories from database.');
    }

    return NextResponse.json({ categories });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error('API Error in /service-categories:', { error: errorMessage });
    return NextResponse.json(
      { error: 'Internal Server Error', details: errorMessage },
      { status: 500 }
    );
  }
});
