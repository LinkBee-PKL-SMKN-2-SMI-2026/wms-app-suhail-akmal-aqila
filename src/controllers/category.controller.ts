/**
 * Penjelasan Import Module & Tipe Data:
 * File ini mengimpor beberapa modul utama untuk kebutuhan controller Express.
 * - 'Request' dan 'Response' dari Express digunakan sebagai tipe data parameter handler HTTP.
 * - 'PrismaClient' dari Prisma yang di-generate digunakan untuk menjalankan kueri ke database.
 * - 'PrismaPg' dan 'pg' digunakan untuk mengonfigurasi koneksi PostgreSQL via adapter pool.
 * - Tipe DTO ('CreateCategoryRequest', 'GetAllCategoryQuery', 'GetCategoryByIdParams', 'UpdateCategoryParams', 'UpdateCategoryRequest', 'DeleteCategoryParams') digunakan untuk type casting parameter request (body, query, params) agar sesuai dengan skema validasi Zod.
 * - 'AppError' adalah kelas custom penanganan error HTTP, sedangkan 'catchAsync' adalah wrapper fungsi asynchronous untuk mengalirkan error otomatis ke middleware Express.
 */

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

/**
 * Konfigurasi Database & Prisma Client:
 * 1. pool: Membuat koneksi pool PostgreSQL menggunakan library 'pg' berdasarkan DATABASE_URL dari environment variable.
 * 2. adapter: Menggunakan adapter PrismaPg untuk mengintegrasikan driver pg dengan Prisma Client.
 * 3. prisma: Inisialisasi instance PrismaClient dengan adapter PostgreSQL yang telah dikonfigurasi.
 */

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * createCategory Controller
 * Fungsi untuk membuat kategori baru.
 * 
 * - Menerima data name dan description dari req.body.
 * - Memeriksa apakah nama kategori sudah terdaftar di database untuk menghindari duplikasi.
 * - Jika nama sudah ada, melempar AppError dengan status code 400 (Bad Request).
 * - Jika belum ada, membuat record kategori baru di database melalui Prisma Client.
 * - Mengembalikan response HTTP 201 (Created) beserta data kategori yang berhasil dibuat.
 */

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

/**
 * getAllCategories Controller
 * Fungsi untuk mengambil seluruh daftar kategori dengan fitur pagination, pencarian, dan pengurutan.
 * 
 * - Mengambil query parameter: page (halaman), limit (jumlah item per halaman), search (kata kunci pencarian), dan sort (urutan ascending/descending).
 * - Menghitung nilai offset (skip) dan batasan data (take) untuk pagination.
 * - Membuat filter 'where' untuk pencarian nama kategori yang bersifat case-insensitive (jika search diberikan).
 * - Menggunakan Promise.all untuk menjalankan kueri data kategori dan kueri total hitungan secara paralel agar lebih efisien.
 * - Mengembalikan response HTTP 200 (OK) beserta data kategori dan informasi pagination (page, limit, total, totalPages).
 */

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

/**
 * getCategoryById Controller
 * Fungsi untuk mengambil detail kategori spesifik berdasarkan ID.
 * 
 * - Mengambil parameter 'id' dari req.params.
 * - Mencari data kategori menggunakan Prisma findUnique sekaligus menghitung jumlah produk terkait (_count.products).
 * - Jika kategori tidak ditemukan, melempar AppError dengan status code 404 (Not Found).
 * - Mengembalikan response HTTP 200 (OK) beserta data detail kategori dan jumlah produknya.
 */

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

/**
 * updateCategory Controller
 * Fungsi untuk memperbarui data kategori yang sudah ada.
 * 
 * - Mengambil 'id' dari req.params dan field yang ingin diubah (name, description, isActive) dari req.body.
 * - Memeriksa keberadaan kategori berdasarkan ID; jika tidak ada, lempar AppError 404.
 * - Jika nama kategori diubah, dilakukan pengecekan apakah nama baru tersebut sudah digunakan oleh kategori lain (pengecekan duplikasi).
 * - Melakukan pembaruan data kategori pada database menggunakan prisma.categories.update.
 * - Mengembalikan response HTTP 200 (OK) beserta data kategori yang telah diperbarui.
 */

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

/**
 * deleteCategory Controller
 * Fungsi untuk menghapus kategori dari database.
 * 
 * - Mengambil parameter 'id' dari req.params.
 * - Mencari data kategori beserta jumlah produk (_count.products) yang terhubung.
 * - Jika kategori tidak ditemukan, melempar AppError 404.
 * - Memvalidasi Integritas Data: Jika kategori masih memiliki produk terkait (_count.products > 0),
 *   proses penghapusan dibatalkan dengan melempar AppError 400 untuk mencegah orphaned data.
 * - Jika tidak ada produk terkait, menghapus data kategori dari database.
 * - Mengembalikan response HTTP 200 (OK) dengan pesan konfirmasi berhasil.
 */

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
