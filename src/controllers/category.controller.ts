import type { Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import type {
  CreateCategoryRequest,
  GetAllCategoryQuery,
  GetCategoryByIdParams,
  UpdateCategoryParams,
  UpdateCategoryRequest,
  DeleteCategoryParams,
} from '../models/category.dto';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const createCategory = catchAsync(async (req: Request, res: Response) => {
  const { name, description } = req.body as CreateCategoryRequest;

  const existing = await prisma.categories.findUnique({ where: { name } });
  if (existing) {
    throw new AppError('Nama kategori sudah digunakan', 400);
  }

  const category = await prisma.categories.create({
    data: { name, description },
  });

  res.status(201).json({
    success: true,
    message: 'Kategori berhasil dibuat',
    data: category,
  });
});

export const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const { page = '1', limit = '10', search, sort = 'desc' } = req.query as GetAllCategoryQuery;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, parseInt(limit, 10));
  const skip = (pageNum - 1) * limitNum;

  const where = search ? { name: { contains: search, mode: 'insensitive' as const } } : {};

  const [categories, total] = await Promise.all([
    prisma.categories.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: sort },
    }),
    prisma.categories.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    message: 'Berhasil mengambil daftar kategori',
    data: categories,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

export const getCategoryById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as GetCategoryByIdParams;

  const category = await prisma.categories.findUnique({
    where: { id },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  if (!category) {
    throw new AppError('Kategori tidak ditemukan', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Berhasil mengambil detail kategori',
    data: category,
  });
});

export const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as UpdateCategoryParams;
  const { name, description, isActive } = req.body as UpdateCategoryRequest;

  const existing = await prisma.categories.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Kategori tidak ditemukan', 404);
  }

  if (name && name !== existing.name) {
    const duplicate = await prisma.categories.findUnique({ where: { name } });
    if (duplicate) {
      throw new AppError('Nama kategori sudah digunakan', 400);
    }
  }

  const updated = await prisma.categories.update({
    where: { id },
    data: { name, description, isActive },
  });

  res.status(200).json({
    success: true,
    message: 'Kategori berhasil diperbarui',
    data: updated,
  });
});

export const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as DeleteCategoryParams;

  const category = await prisma.categories.findUnique({
    where: { id },
    include: {
      _count: { select: { products: true } },
    },
  });

  if (!category) {
    throw new AppError('Kategori tidak ditemukan', 404);
  }

  if (category._count.products > 0) {
    throw new AppError('Tidak dapat menghapus kategori yang masih memiliki produk terkait', 400);
  }

  await prisma.categories.delete({ where: { id } });

  res.status(200).json({
    success: true,
    message: 'Kategori berhasil dihapus',
  });
});
