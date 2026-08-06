import type { Response, NextFunction } from 'express';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg'; //tambahan untuk menghubungkan ke database PostgreSQL
import type { AuthRequest } from '../models/auth.model';
import { AppError } from '../utils/AppError';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// kode untuk memeriksa apakah user yang melakukan request memiliki role yang sesuai dengan role yang
// diizinkan untuk mengakses resource tertentu. Jika user tidak memiliki role yang sesuai, maka akan mengembalikan error Forbidden.
export const authorize = (...roles: string[]) => {
  return async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      return next(new AppError('Unauthorized: Silakan login terlebih dahulu', 401));
    }

    try {
      const user = await prisma.users.findUnique({
        where: { id: req.user.userId },
        select: { role: true, isActive: true },
      });

      if (!user || !user.isActive) {
        return next(new AppError('Forbidden: Akun tidak ditemukan atau tidak aktif', 403));
      }

      if (!roles.includes(user.role)) {
        return next(new AppError('Forbidden: Anda tidak memiliki akses ke resource ini', 403));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
