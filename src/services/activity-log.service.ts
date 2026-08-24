import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { logger } from '../utils/logger';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Interface parameter untuk pencatatan log aktivitas
 */
interface LogActivityParams {
  userId: string;
  action: string; // CREATE, UPDATE, DELETE, LOGIN, LOGOUT
  entity: string; // Categories, Locations, Products, Stock_Movements, Users
  entityId?: string;
  detail?: Record<string, unknown>;
}

/**
 * SERVICE LOG ACTIVITY
 * Fungsi asynchronous untuk mencatat aktivitas/aksi pengguna ke tabel Activity_Logs.
 *
 * Catatan Penting (Non-Blocking / Graceful Failure):
 * Fungsi ini menggunakan blok try-catch tanpa melempar error (throw).
 * Jika pencatatan log gagal, error hanya dicatat ke logger (Pino) agar tidak
 * menggagalkan transaksi atau operasi utama sistem.
 */
export const logActivity = async (params: LogActivityParams): Promise<void> => {
  try {
    await prisma.activity_Logs.create({
      data: {
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        detail: params.detail ? (params.detail as object) : undefined,
        userId: params.userId,
      },
    });
  } catch (error) {
    // Hanya catat di logger (Pino), tapi JANGAN throw error
    logger.error({ event: 'ACTIVITY_LOG_ERROR', error }, 'Gagal mencatat activity log');
  }
};
