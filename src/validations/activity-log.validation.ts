import z from 'zod';

/**
 * SKEMA VALIDASI QUERY GET ACTIVITY LOGS
 * Memvalidasi query parameter URL untuk pengambilan data log aktivitas:
 * - 'page' & 'limit': Mengubah string query ke integer positif untuk pagination
 * - 'userId': Memastikan string berformat UUID (opsional)
 * - 'action': Membatasi hanya pada aksi 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', atau 'LOGOUT'
 * - 'entity', 'startDate', 'endDate': String opsional untuk filter pencarian
 */
export const GetActivityLogsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    userId: z.string().uuid().optional(),
    action: z.enum(['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT']).optional(),
    entity: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});
