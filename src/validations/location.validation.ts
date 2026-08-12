import z from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(3, { message: 'Nama kategori tidak boleh kosong' }),
    description: z.string().optional(),
  }),
});

export const getAllCategoriesSchema = z.object({
  query: z.object({
    page: z.number().int().min(1).optional(),
    limit: z.number().int().min(1).optional(),
    search: z.string().optional(),
    sort: z.enum(['asc', 'desc']).optional(),
  }),
});

export const getCategoryByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'ID kategori tidak valid' }),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'ID kategori tidak valid' }),
  }),
  body: z.object({
    name: z.string().min(3, { message: 'Nama kategori tidak boleh kosong' }).optional(),
    description: z.string().optional(),
  }),
});

export const deleteCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'ID kategori tidak valid' }),
  }),
});
