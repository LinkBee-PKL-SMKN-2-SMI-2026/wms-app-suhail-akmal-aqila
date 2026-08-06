import z from 'zod';

export const RegisterSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Nama minimal 3 karakter'),
    email: z.string().email('Format email tidak valid'),
    password: z.string().min(6, 'Password minimal 6 karakter'),
  }),
});

export const LoginSchema = z.object({
  body: z.object({
    email: z.string().email('Format email tidak valid'),
    password: z.string().min(1, 'Password wajib diisi'),
  }),
});

//intinya kode di atas adalah untuk membuat schema validasi untuk request body pada endpoint register dan login,
// dimana schema tersebut menggunakan zod untuk memvalidasi data yang dikirimkan oleh client.
