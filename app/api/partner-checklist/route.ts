import { NextResponse } from 'next/server';
import type { AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { withAnyAuth } from '@/modules/common/utils/authMiddleware';
import {
  handleGetPartnerChecklist,
  toHttpError,
  toHttpResponse,
} from '@/modules/partner/checklist/controller/partnerChecklistController';

export const GET = withAnyAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const result = await handleGetPartnerChecklist(searchParams);
    const http = toHttpResponse(result);
    return NextResponse.json(http.body, { status: http.status });
  } catch (err) {
    const http = toHttpError(err);
    return NextResponse.json(http.body, { status: http.status });
  }
});
