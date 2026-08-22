import { z } from 'zod';
import { GetActivityLogsSchema } from '../validations/activity-log.validation';

export type GetActivityLogsQuery = z.infer<typeof GetActivityLogsSchema>['query'];

/**
 * Interface untuk struktur data tunggal Activity Log
 * yang dikembalikan dalam respon API (termasuk objek relasi user)
 */
export interface ActivityLogResponse {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  detail: Record<string, unknown> | null;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
}
