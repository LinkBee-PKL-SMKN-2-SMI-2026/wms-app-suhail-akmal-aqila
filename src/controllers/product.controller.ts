// Product Controller

import type { Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import type {
  CreateProductRequest,
  GetAllProductQuery,
  GetProductByIdParams,
  UpdateProductParams,
  UpdateProductRequest,
  DeleteProductParams,
} from '../models/product.dto';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const createProduct = catchAsync(async (req: Request, res: Response) => {
  const { name, sku, description, stock, minimumStock, categoryId, locationId } =
    req.body as CreateProductRequest;

  // Cek duplikat SKU
  const existingSku = await prisma.products.findUnique({ where: { sku } });
  if (existingSku) {
    throw new AppError('SKU produk sudah digunakan', 400);
  }

  // Cek keberadaan categoryId dan locationId
  const [category, location] = await Promise.all([
    prisma.categories.findUnique({ where: { id: categoryId } }),
    prisma.locations.findUnique({ where: { id: locationId } }),
  ]);

  if (!category) {
    throw new AppError('Kategori tidak ditemukan', 404);
  }
  if (!location) {
    throw new AppError('Lokasi tidak ditemukan', 404);
  }

  const product = await prisma.products.create({
    data: {
      name,
      sku,
      description,
      stock,
      minimumStock,
      categoryId,
      locationId,
    },
    include: {
      category: true,
      location: true,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Produk berhasil dibuat',
    data: product,
  });
});

export const getAllProducts = catchAsync(async (req: Request, res: Response) => {
  const {
    page = '1',
    limit = '10',
    search,
    sort = 'desc',
    categoryId,
    locationId,
  } = req.query as GetAllProductQuery;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, parseInt(limit, 10));
  const skip = (pageNum - 1) * limitNum;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }
  if (locationId) {
    where.locationId = locationId;
  }

  const [products, total] = await Promise.all([
    prisma.products.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: sort },
      include: {
        category: true,
        location: true,
      },
    }),
    prisma.products.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    message: 'Berhasil mengambil daftar produk',
    data: products,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

export const getProductById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as GetProductByIdParams;

  const product = await prisma.products.findUnique({
    where: { id },
    include: {
      category: true,
      location: true,
    },
  });

  if (!product) {
    throw new AppError('Produk tidak ditemukan', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Berhasil mengambil detail produk',
    data: product,
  });
});

export const updateProduct = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as UpdateProductParams;
  const { name, sku, description, minimumStock, categoryId, locationId, isActive } =
    req.body as UpdateProductRequest;

  const existing = await prisma.products.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Produk tidak ditemukan', 404);
  }

  if (sku && sku !== existing.sku) {
    const duplicate = await prisma.products.findUnique({ where: { sku } });
    if (duplicate) {
      throw new AppError('SKU produk sudah digunakan', 400);
    }
  }

  if (categoryId) {
    const category = await prisma.categories.findUnique({ where: { id: categoryId } });
    if (!category) {
      throw new AppError('Kategori tidak ditemukan', 404);
    }
  }

  if (locationId) {
    const location = await prisma.locations.findUnique({ where: { id: locationId } });
    if (!location) {
      throw new AppError('Lokasi tidak ditemukan', 404);
    }
  }

  const updated = await prisma.products.update({
    where: { id },
    data: { name, sku, description, minimumStock, categoryId, locationId, isActive },
    include: {
      category: true,
      location: true,
    },
  });

  res.status(200).json({
    success: true,
    message: 'Produk berhasil diperbarui',
    data: updated,
  });
});

export const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as DeleteProductParams;

  const product = await prisma.products.findUnique({
    where: { id },
    include: {
      _count: { select: { stockMovements: true } },
    },
  });

  if (!product) {
    throw new AppError('Produk tidak ditemukan', 404);
  }

  if (product._count.stockMovements > 0) {
    throw new AppError(
      'Tidak dapat menghapus produk yang sudah memiliki riwayat pergerakan stok',
      400,
    );
  }

  await prisma.products.delete({ where: { id } });

  res.status(200).json({
    success: true,
    message: 'Produk berhasil dihapus',
  });
});

//
