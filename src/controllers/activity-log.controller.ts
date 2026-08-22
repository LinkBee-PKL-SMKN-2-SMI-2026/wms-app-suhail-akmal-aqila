import type { Response } from 'express';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import type { AuthRequest } from '../models/auth.model';
import { catchAsync } from '../utils/catchAsync';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * 1. FUNGSI GET ACTIVITY LOGS (MENGAMBIL RIWAYAT AKTIVITAS SISTEM)
 * Mengambil daftar riwayat log aktivitas pengguna dengan fitur:
 * - Pagination (page, limit)
 * - Filtering dinamis (userId, action, entity, rentang tanggal startDate & endDate)
 * - Relasi data user pelaksana aktivitas
 */
export const getActivityLogs = catchAsync(async (req: AuthRequest, res: Response) => {
  // Ambil parameter pagination dan filter dari URL query
  const { page = 1, limit = 10, userId, action, entity, startDate, endDate } = req.query;

  // Konversi input string URL ke tipe Number
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  // Dynamic filter query
  const where: Record<string, unknown> = {};
  if (userId) {
    where.userId = userId as string;
  }
  if (action) {
    where.action = action as string;
  }
  if (entity) {
    where.entity = entity as string;
  }

  if (startDate || endDate) {
    where.createdAt = {
      ...(startDate && { gte: new Date(startDate as string) }),
      ...(endDate && { lte: new Date(endDate as string) }),
    };
  }

  // Paralel query untuk performa tinggi
  const [logs, total] = await Promise.all([
    // Ambil data log sesuai filter dan pagination, beserta relasi info user
    prisma.activity_Logs.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    }),

    // Hitung total data log berdasarkan filter yang berlaku
    prisma.activity_Logs.count({ where }),
  ]);

  // Kirim respon akhir ke client
  res.status(200).json({
    success: true,
    message: 'Activity logs retrieved successfully',
    data: logs,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});
