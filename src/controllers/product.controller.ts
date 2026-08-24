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

  const pageNum = Number(page);
  const limitNum = Number(limit);
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

//.

// ini buat tugas 4 express dimana kita lakukan get pada endpoint /products/:id untuk mendapatkan detail produk berdasarkan ID.
// Endpoint ini akan mengembalikan informasi produk termasuk kategori dan lokasi terkait. Jika produk tidak ditemukan, akan mengembalikan error 404.

/**
 * @route GET /products/:id
 * @desc Mendapatkan detail produk berdasarkan ID
 * @access Public
 *
 * inti dari kode ini adalah untuk mengambil detail produk berdasarkan ID yang diberikan pada parameter URL.
 * Endpoint ini akan mengembalikan informasi produk termasuk kategori dan lokasi terkait.
 * Jika produk tidak ditemukan, akan mengembalikan error 404.
 *
 * @param {string} id - ID produk yang ingin diambil
 * @returns {object} - Objek JSON berisi detail produk, kategori, dan lokasi
 * @throws {AppError} - Jika produk tidak ditemukan, akan melempar error 404
 *
 * @example
 * // Request
 * GET /products/123e4567-e89b-12d3-a456-426614174000
 *
 * // Response
 * {
 *   "success": true,
 *   "message": "Berhasil mengambil detail produk",
 *   "data": {
 *     "id": "123e4567-e89b-12d3-a456-426614174000",
 *     "name": "Produk A",
 *     "sku": "SKU123",
 *     "description": "Deskripsi produk A",
 *     "stock": 100,
 *     "minimumStock": 10,
 *     "categoryId": "cat123",
 *     "locationId": "loc123",
 *     "category": {
 *       "id": "cat123",
 *       "name": "Kategori A"
 *     },
 *     "location": {
 *       "id": "loc123",
 *       "name": "Lokasi A"
 *     }
 *   }
 * }
 */
export const getProductStock = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as GetProductByIdParams;

  const product = await prisma.products.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      sku: true,
      stock: true,
      minimumStock: true,
    },
  });

  if (!product) {
    throw new AppError('Produk tidak ditemukan', 404);
  }

  /**
   * kode yang ada di bawah ini digunakan untuk menentukan status stok produk berdasarkan jumlah stok saat ini dan minimum stok yang ditentukan.
   * Status dapat berupa 'safe' (aman), 'low' (rendah), atau 'out' (habis).
   * Jika stok produk sama dengan 0, status akan menjadi 'out'.
   * Jika stok produk kurang dari atau sama dengan minimum stok, status akan menjadi 'low'.
   * Jika stok produk lebih besar dari minimum stok, status akan tetap 'safe'.
   *
   * @type {'safe' | 'low' | 'out'}
   * @default 'safe'
   *
   * @example
   * // Jika stok produk adalah 0, status akan menjadi 'out'
   */
  let status: 'safe' | 'low' | 'out' = 'safe';
  if (product.stock === 0) {
    status = 'out';
  } else if (product.stock <= product.minimumStock) {
    status = 'low';
  }

  res.status(200).json({
    success: true,
    message: 'Berhasil mengambil info stok produk',
    data: {
      productId: product.id,
      name: product.name,
      sku: product.sku,
      currentStock: product.stock,
      minimumStock: product.minimumStock,
      status,
    },
  });
});
