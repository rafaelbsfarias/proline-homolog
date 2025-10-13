import { NextResponse } from 'next/server';
import { withAdminAuth, type AuthenticatedRequest } from '@/modules/common/utils/authMiddleware';
import { SupabaseService } from '@/modules/common/services/SupabaseService';
import { getLogger } from '@/modules/logger';

const logger = getLogger('api:admin:partner:service:update');

export const PATCH = withAdminAuth(
  async (
    req: AuthenticatedRequest,
    ctx: { params: Promise<{ partnerId: string; serviceId: string }> }
  ) => {
    try {
      const { partnerId, serviceId } = await ctx.params;
      const body = (await req.json()) as {
        is_active?: boolean;
        action?: 'toggle_active' | 'request_review';
        review_feedback?: string;
      };

      const admin = SupabaseService.getInstance().getAdminClient();

      // Action: Request Review
      if (body.action === 'request_review') {
        logger.info('review_request_received', {
          serviceId,
          partnerId,
          feedbackLength: body.review_feedback?.length,
          adminId: req.user.id,
        });

        if (!body.review_feedback || body.review_feedback.trim() === '') {
          logger.warn('review_feedback_empty', { serviceId, partnerId });
          return NextResponse.json({ error: 'Feedback de revisão é obrigatório' }, { status: 400 });
        }

        const updateData = {
          review_status: 'pending_review',
          review_feedback: body.review_feedback,
          review_requested_at: new Date().toISOString(),
          review_requested_by: req.user.id,
        };

        logger.info('updating_service_review', {
          serviceId,
          partnerId,
          updateData,
        });

        const { data, error } = await admin
          .from('partner_services')
          .update(updateData)
          .eq('id', serviceId)
          .eq('partner_id', partnerId)
          .select();

        if (error) {
          logger.error('failed_request_review', {
            error,
            partnerId,
            serviceId,
            feedback: body.review_feedback,
          });
          return NextResponse.json({ error: 'Erro ao solicitar revisão' }, { status: 500 });
        }

        logger.info('review_requested_success', {
          serviceId,
          partnerId,
          adminId: req.user.id,
          updatedRows: data?.length,
        });

        return NextResponse.json({ success: true, action: 'review_requested', data });
      }

      // Action: Toggle Active (legacy support)
      if (typeof body.is_active !== 'boolean') {
        return NextResponse.json({ error: 'Campo is_active é obrigatório' }, { status: 400 });
      }

      const { error } = await admin
        .from('partner_services')
        .update({ is_active: body.is_active, updated_at: new Date().toISOString() })
        .eq('id', serviceId)
        .eq('partner_id', partnerId);

      if (error) {
        logger.error('failed_update_service', {
          error,
          partnerId,
          serviceId,
          is_active: body.is_active,
        });
        return NextResponse.json({ error: 'Erro ao atualizar serviço' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      logger.error('service_update_error', { error });
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
  }
);
