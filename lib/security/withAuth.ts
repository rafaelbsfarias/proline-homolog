import { NextRequest } from 'next/server';
import { handleApiError } from '@/lib/utils/apiErrorHandlers';
import { getAuthenticatedUser } from './session';
import { User } from '@supabase/supabase-js';

type Ctx = { params?: Record<string, string> };
type ApiRouteHandler = (req: NextRequest, ctx: Ctx, user: User) => Promise<Response>;

export const withAuth = (handler: ApiRouteHandler) => {
  return async (req: NextRequest, ctx: Ctx): Promise<Response> => {
    try {
      const user = await getAuthenticatedUser();
      return handler(req, ctx, user);
    } catch (error) {
      return handleApiError(error);
    }
  };
};
