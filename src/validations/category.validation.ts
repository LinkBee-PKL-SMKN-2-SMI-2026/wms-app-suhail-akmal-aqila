// Mengimpor library Zod untuk membuat skema validasi data
import z from 'zod';

/**
 * CreateCategorySchema
 * Skema validasi untuk membuat kategori baru.
 * Memvalidasi 'body' dari HTTP Request:
 * - name: Berupa string wajib dengan panjang minimal 3 karakter.
 * - description: Berupa string bersifat opsional (boleh kosong).
 */

export const CreateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Nama kategori minimal 3 karakter'),
    description: z.string().optional(),
  }),
});

/**
 * GetAllCategorySchema
 * Skema validasi untuk mengambil seluruh daftar kategori (dengan filter/paginasi).
 * Memvalidasi 'query' parameters dari URL:
 * - page: Nomor halaman (string, opsional).
 * - limit: Jumlah data per halaman (string, opsional).
 * - search: Kata kunci pencarian nama/kategori (string, opsional).
 * - sort: Urutan data, hanya menerima nilai 'asc' atau 'desc' (enum, opsional).
 */

export const GetAllCategorySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    sort: z.enum(['asc', 'desc']).optional(),
  }),
});

/**
 * GetCategoryByIdSchema
 * Skema validasi untuk mengambil detail satu kategori berdasarkan ID.
 * Memvalidasi 'params' dari URL endpoint:
 * - id: Berupa string yang harus memiliki format UUID yang valid.
 */

export const GetCategoryByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID tidak valid'),
  }),
});

/**
 * UpdateCategorySchema
 * Skema validasi untuk memperbarui data kategori.
 * Memvalidasi 'params' dan 'body' dari HTTP Request:
 * - params.id: ID kategori berupa UUID yang valid.
 * - body.name: Nama baru kategori (string min 3 karakter, opsional).
 * - body.description: Deskripsi baru kategori (string, opsional).
 * - body.isActive: Status aktif kategori (boolean, opsional).
 */

export const UpdateCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid('ID tidak valid'),
  }),
  body: z.object({
    name: z.string().min(3, 'Nama kategori minimal 3 karakter').optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

/**
 * DeleteCategorySchema
 * Skema validasi untuk menghapus kategori berdasarkan ID.
 * Memvalidasi 'params' dari URL endpoint:
 * - id: Berupa string yang harus memiliki format UUID yang valid.
 */

export const DeleteCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid('ID tidak valid'),
  }),
});

/**
 * PENJELASAN PENGGUNAAN SKEMA VALIDASI:
 *
 * 1. Skema di atas menggunakan library Zod untuk melakukan validasi runtime pada objek request API (body, query, params).
 * 2. Zod memastikan bahwa data yang dikirim oleh client sesuai dengan struktur dan aturan tipe data yang diharapkan server sebelum diproses oleh controller/service.
 * 3. Jika input tidak sesuai aturan (misal: ID bukan UUID atau nama kurang dari 3 karakter), Zod akan melempar pesan error kustom yang telah ditentukan.
 * 4. Skema ini juga nantinya digunakan bersama `z.infer<typeof Schema>` untuk menghasilkan tipe TypeScript secara otomatis sehingga kode controller tetap type-safe.
 */
