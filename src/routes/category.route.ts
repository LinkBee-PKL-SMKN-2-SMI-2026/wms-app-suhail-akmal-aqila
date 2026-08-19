// Mengimpor fungsi Router dari Express untuk membuat modular routing

import { Router } from 'express';

// Mengimpor middleware kustom

import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/authenticate.middleware';
import { authorize } from '../middlewares/authorize.middleware';

// Mengimpor skema validasi Zod untuk endpoint kategori

import {
  CreateCategorySchema,
  GetAllCategorySchema,
  GetCategoryByIdSchema,
  UpdateCategorySchema,
  DeleteCategorySchema,
} from '../validations/category.validation';

// Mengimpor handler fungsi dari controller yang menangani logika bisnis kategori

import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller';

// Mengimpor class penanganan error kustom untuk melempar error dengan HTTP status code

import { AppError } from '../utils/AppError';

// Membikin instance router Express

const router = Router();

/**
 * Global Middleware untuk Router ini:
 * router.use(authenticate) memastikan bahwa SEMUA endpoint di bawah ini
 * mewajibkan pengguna untuk terotentikasi terlebih dahulu (harus login / membawa token yang valid).
 */

router.use(authenticate);

/**
 * POST /
 * Membuat kategori baru.
 * - authorize('ADMIN'): Hanya user dengan role 'ADMIN' yang diizinkan memanggil endpoint ini.
 * - validate(CreateCategorySchema): Memvalidasi request body sesuai skema CreateCategorySchema.
 * - createCategory: Controller untuk menyimpan data kategori baru.
 */

router.post('/', authorize('ADMIN'), validate(CreateCategorySchema), createCategory);

/**
 * GET /
 * Mengambil semua daftar kategori (bisa dengan query filter/paginasi).
 * - validate(GetAllCategorySchema): Memvalidasi query parameters (page, limit, search, sort).
 * - getAllCategories: Controller untuk mengambil daftar kategori.
 */

router.get('/', validate(GetAllCategorySchema), getAllCategories);

/**
 * GET /:id
 * Mengambil detail satu kategori berdasarkan ID.
 * - validate(GetCategoryByIdSchema): Memvalidasi route parameter :id (harus UUID).
 * - getCategoryById: Controller untuk mengambil detail kategori.
 */

router.get('/:id', validate(GetCategoryByIdSchema), getCategoryById);

/**
 * PUT /:id
 * Memperbarui data kategori berdasarkan ID.
 * - authorize('ADMIN'): Hanya role 'ADMIN' yang diizinkan memperbarui kategori.
 * - validate(UpdateCategorySchema): Memvalidasi route parameter :id dan request body.
 * - updateCategory: Controller untuk memperbarui data kategori.
 */

router.put('/:id', authorize('ADMIN'), validate(UpdateCategorySchema), updateCategory);

/**
 * DELETE /:id
 * Menghapus kategori berdasarkan ID.
 * - authorize('ADMIN'): Hanya role 'ADMIN' yang diizinkan menghapus kategori.
 * - validate(DeleteCategorySchema): Memvalidasi route parameter :id (harus UUID).
 * - deleteCategory: Controller untuk menghapus kategori.
 */

router.delete('/:id', authorize('ADMIN'), validate(DeleteCategorySchema), deleteCategory);

/**
 * Fallback Route Handling (Method Not Allowed)
 * Menangkap seluruh method HTTP yang tidak sesuai/didefinisikan pada path yang masuk di router ini.
 * Mengembalikan error HTTP 405 (Method Not Allowed) melalui middleware error handling Express (`next()`).
 */

router.all('{*path}', (_req, _res, next) => {
  next(new AppError('Method not allowed', 405));
});

// Mengekspor router agar bisa di-mount di file utama aplikasi (misal: app.ts / server.ts)

export default router;

/**
 * PENJELASAN SINGKAT ARSITEKTUR ROUTE KATEGORI:
 *
 * 1. Keamanan Bertingkat: Setiap route dilindungi otentikasi global (`authenticate`), lalu dibatasi lagi oleh hak akses (`authorize('ADMIN')`) untuk aksi mutasi data (POST, PUT, DELETE).
 * 2. Validasi Data Otomatis: Setiap request akan disaring terlebih dahulu oleh middleware `validate()` dengan skema Zod sebelum diteruskan ke fungsi controller.
 * 3. Separation of Concerns: File route ini fokus mendefinisikan UR


L path dan rantai middleware, sedangkan logika penanganan data ditangani terpisah oleh `category.controller`.

*/
