import z from 'zod';

export const CreateLocationSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Nama lokasi minimal 3 karakter'),
    code: z.string().min(1, 'Kode wajib diisi').max(10, 'Kode maksimal 10 karakter'),
  }),
});

export const GetAllLocationSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    sort: z.enum(['asc', 'desc']).optional(),
  }),
});

export const GetLocationByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID tidak valid'),
  }),
});

export const UpdateLocationSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID tidak valid'),
  }),
  body: z.object({
    name: z.string().min(3, 'Nama lokasi minimal 3 karakter').optional(),
    code: z.string().max(10, 'Kode maksimal 10 karakter').optional(),
    isActive: z.boolean().optional(),
  }),
});

export const DeleteLocationSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID tidak valid'),
  }),
});

///
