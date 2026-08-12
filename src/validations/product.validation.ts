import z from 'zod';

export const CreateProductSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Nama produk minimal 3 karakter'),
    sku: z.string().min(1, 'SKU wajib diisi'),
    description: z.string().optional(),
    stock: z.number().int().min(0, 'Stok minimal 0').default(0),
    minimumStock: z.number().int().min(0, 'Minimal stok minimal 0').default(0),
    categoryId: z.string().uuid('ID kategori tidak valid'),
    locationId: z.string().uuid('ID lokasi tidak valid'),
  }),
});

export const GetAllProductSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    sort: z.enum(['asc', 'desc']).optional(),
    categoryId: z.string().uuid().optional(),
    locationId: z.string().uuid().optional(),
  }),
});

export const GetProductByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID tidak valid'),
  }),
});

export const UpdateProductSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID tidak valid'),
  }),
  body: z.object({
    name: z.string().min(3, 'Nama produk minimal 3 karakter').optional(),
    sku: z.string().min(1, 'SKU wajib diisi').optional(),
    description: z.string().optional(),
    minimumStock: z.number().int().min(0).optional(),
    categoryId: z.string().uuid('ID kategori tidak valid').optional(),
    locationId: z.string().uuid('ID lokasi tidak valid').optional(),
    isActive: z.boolean().optional(),
  }),
});

export const DeleteProductSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID tidak valid'),
  }),
});
