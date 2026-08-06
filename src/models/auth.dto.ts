import { z } from 'zod';
import { RegisterSchema, LoginSchema } from '../validations/auth.validation';

export type RegisterRequest = z.infer<typeof RegisterSchema>['body'];
export type LoginRequest = z.infer<typeof LoginSchema>['body'];

//yah jadi intinya kode di atas adalah untuk membuat tipe data untuk request body pada endpoint register dan login,
// dimana tipe data tersebut diambil dari schema yang sudah dibuat sebelumnya menggunakan zod.
