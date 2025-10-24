import type { NotificationPort } from '@/modules/delivery/domain/ports';
import type { UUID } from '@/modules/delivery/domain/types';

export class DevNotificationPort implements NotificationPort {
  async send(toProfileId: UUID, template: string, payload: Record<string, unknown>): Promise<void> {
    // Ambiente de desenvolvimento: apenas loga (poderia usar um logger do projeto)
    if (process.env.NODE_ENV !== 'test') {
      // eslint-disable-next-line no-console
      console.log('[DevNotificationPort]', { toProfileId, template, payload });
    }
  }
}
