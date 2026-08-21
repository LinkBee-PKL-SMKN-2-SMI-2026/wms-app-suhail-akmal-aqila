import type { z } from 'zod';
import type {
  GetDashboardStatsSchema,
  GetRecentMovementsSchema,
} from '../validations/dashboard.validation';

export type GetDashboardStatsQuery = z.infer<typeof GetDashboardStatsSchema>['query'];
export type GetRecentMovementsQuery = z.infer<typeof GetRecentMovementsSchema>['query'];
