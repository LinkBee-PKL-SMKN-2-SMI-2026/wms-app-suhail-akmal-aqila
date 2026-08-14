import type { z } from 'zod';
import type {
  CreateCategorySchema,
  GetAllCategorySchema,
  GetCategoryByIdSchema,
  UpdateCategorySchema,
  DeleteCategorySchema,
} from '../validations/category.validation';

export type CreateCategoryRequest = z.infer<typeof CreateCategorySchema>['body'];
export type GetAllCategoryQuery = z.infer<typeof GetAllCategorySchema>['query'];
export type GetCategoryByIdParams = z.infer<typeof GetCategoryByIdSchema>['params'];
export type UpdateCategoryParams = z.infer<typeof UpdateCategorySchema>['params'];
export type UpdateCategoryRequest = z.infer<typeof UpdateCategorySchema>['body'];
export type DeleteCategoryParams = z.infer<typeof DeleteCategorySchema>['params'];

/**
 * createCategorySchema: Tipe data untuk request body saat membuat kategori baru.
 * getAllCategoriesSchema: Tipe data untuk query parameters saat mengambil daftar kategori.
 * getCategoryByIdSchema: Tipe data untuk route parameters saat mengambil detail kategori berdasarkan ID.
 * updateCategorySchema: Tipe data untuk route parameters dan request body saat mengupdate kategori.
 * deleteCategorySchema: Tipe data untuk route parameters saat menghapus kategori.
 *
 * param adalah tipe data untuk route parameters, query adalah tipe data untuk query parameters, dan body adalah tipe data untuk request body.
 *
 * Gunakan z.infer<typeof schema> untuk mengekstrak tipe data dari skema validasi Zod.
 * Gunakan ['body'], ['query'], atau ['params'] untuk mengakses tipe data yang sesuai dari skema validasi.
 *
 * Contoh: z.infer<typeof createCategorySchema>['body'] akan memberikan tipe data untuk request body saat membuat kategori baru.
 * Contoh: z.infer<typeof getAllCategoriesSchema>['query'] akan memberikan tipe data untuk query parameters saat mengambil daftar kategori.
 * Contoh: z.infer<typeof getCategoryByIdSchema>['params'] akan memberikan tipe data untuk route parameters saat mengambil detail kategori berdasarkan ID.
 * Contoh: z.infer<typeof updateCategorySchema>['params'] dan z.infer<typeof updateCategorySchema>['body'] akan memberikan tipe data untuk route parameters dan request body saat mengupdate kategori.
 * Contoh: z.infer<typeof deleteCategorySchema>['params'] akan memberikan tipe data untuk route parameters saat menghapus kategori.
 *
 * Gunakan tipe data ini di controller untuk memastikan bahwa data yang diterima sesuai dengan skema validasi yang telah ditentukan.
 * Dengan menggunakan tipe data ini, kita dapat memanfaatkan fitur TypeScript seperti autocompletion dan type checking untuk meningkatkan kualitas kode dan mengurangi potensi bug.
 * Pastikan untuk selalu memperbarui tipe data ini jika ada perubahan pada skema validasi Zod.
 * Dengan cara ini, kita dapat menjaga konsistensi antara skema validasi dan tipe data yang digunakan di seluruh aplikasi.
 * Ini juga membantu dalam dokumentasi kode, karena tipe data ini memberikan informasi yang jelas tentang struktur data yang diharapkan oleh setiap endpoint API.
 */
