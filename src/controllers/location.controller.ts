import type { Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import type {
  CreateLocationRequest,
  GetAllLocationQuery,
  GetLocationByIdParams,
  UpdateLocationParams,
  UpdateLocationRequest,
  DeleteLocationParams,
} from '../models/location.dto';
// [ACTIVITY LOG] Import AuthRequest untuk mendapatkan req.user.userId & import service logActivity
import type { AuthRequest } from '../models/auth.model';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';
import { logActivity } from '../services/activity-log.service';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// [ACTIVITY LOG] Mengubah tipe req menjadi AuthRequest
export const createLocation = catchAsync(async (req: AuthRequest, res: Response) => {
  const { name, code } = req.body as CreateLocationRequest;

  const existingCode = await prisma.locations.findUnique({ where: { code } });
  if (existingCode) {
    throw new AppError('Kode lokasi sudah digunakan', 400);
  }

  const location = await prisma.locations.create({
    data: { name, code },
  });

  // [ACTIVITY LOG] Catat aktivitas pembuatan lokasi baru
  if (req.user?.userId) {
    await logActivity({
      userId: req.user.userId,
      action: 'CREATE',
      entity: 'Locations',
      entityId: location.id,
      detail: { name: location.name, code: location.code },
    });
  }

  res.status(201).json({
    success: true,
    message: 'Lokasi berhasil dibuat',
    data: location,
  });
});

export const getAllLocations = catchAsync(async (req: Request, res: Response) => {
  const { page = '1', limit = '10', search, sort = 'desc' } = req.query as GetAllLocationQuery;

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { code: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [locations, total] = await Promise.all([
    prisma.locations.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: sort },
    }),
    prisma.locations.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    message: 'Berhasil mengambil daftar lokasi',
    data: locations,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

export const getLocationById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as GetLocationByIdParams;

  const location = await prisma.locations.findUnique({
    where: { id },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  if (!location) {
    throw new AppError('Lokasi tidak ditemukan', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Berhasil mengambil detail lokasi',
    data: location,
  });
});

// [ACTIVITY LOG] Mengubah tipe req menjadi AuthRequest
export const updateLocation = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params as UpdateLocationParams;
  const { name, code, isActive } = req.body as UpdateLocationRequest;

  const existing = await prisma.locations.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Lokasi tidak ditemukan', 404);
  }

  if (code && code !== existing.code) {
    const duplicate = await prisma.locations.findUnique({ where: { code } });
    if (duplicate) {
      throw new AppError('Kode lokasi sudah digunakan', 400);
    }
  }

  const updated = await prisma.locations.update({
    where: { id },
    data: { name, code, isActive },
  });

  // [ACTIVITY LOG] Catat aktivitas pembaruan data lokasi
  if (req.user?.userId) {
    await logActivity({
      userId: req.user.userId,
      action: 'UPDATE',
      entity: 'Locations',
      entityId: updated.id,
      detail: { changes: { name, code, isActive } },
    });
  }

  res.status(200).json({
    success: true,
    message: 'Lokasi berhasil diperbarui',
    data: updated,
  });
});

// [ACTIVITY LOG] Mengubah tipe req menjadi AuthRequest
export const deleteLocation = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params as DeleteLocationParams;

  const location = await prisma.locations.findUnique({
    where: { id },
    include: {
      _count: { select: { products: true } },
    },
  });

  if (!location) {
    throw new AppError('Lokasi tidak ditemukan', 404);
  }

  if (location._count.products > 0) {
    throw new AppError('Tidak dapat menghapus lokasi yang masih memiliki produk terkait', 400);
  }

  await prisma.locations.delete({ where: { id } });

  // [ACTIVITY LOG] Catat aktivitas penghapusan lokasi
  if (req.user?.userId) {
    await logActivity({
      userId: req.user.userId,
      action: 'DELETE',
      entity: 'Locations',
      entityId: id,
    });
  }

  res.status(200).json({
    success: true,
    message: 'Lokasi berhasil dihapus',
  });
});
