import { z } from 'zod';

export const CreateInboundSchema = z.object({
  body: z.object({
    productId: z.uuid({ message: 'Product ID harus UUID valid' }),
    quantity: z.number().int().positive({ message: 'Quantity harus lebih dari 0' }),
    notes: z.string().optional(),
  }),
});

export const CreateOutboundSchema = z.object({
  body: z.object({
    productId: z.uuid({ message: 'Product ID harus UUID valid' }),
    quantity: z.number().int().positive({ message: 'Quantity harus lebih dari 0' }),
    notes: z.string().optional(),
  }),
});

export const GetMovementHistorySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    productId: z.uuid().optional(),
    type: z.enum(['INBOUND', 'OUTBOUND']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

/**
 *  Biarkan aku menjelaskan kode pada file stock-movement.vallidation.ts dimulai dari
 * 
 * 1. Import z dari 'zod': Kode ini mengimpor library zod yang digunakan untuk validasi skema data.
 * 
 * 2. CreateInboundSchema: Skema ini digunakan untuk memvalidasi data yang dikirim saat membuat catatan inbound (barang masuk). 
 * Skema ini mengharuskan adanya productId yang merupakan UUID valid, quantity yang merupakan angka positif, dan notes yang bersifat opsional.
 * 
 * - Penjelsasan lebih detail:
 *   - productId: Harus berupa UUID yang valid. Jika tidak valid, akan muncul pesan error "Product ID harus UUID valid".
 *   - quantity: Harus berupa angka bulat positif. Jika tidak valid, akan muncul pesan error "Quantity harus lebih dari 0".
 * 
 * 3. CreateOutboundSchema: Skema ini digunakan untuk memvalidasi data yang dikirim saat membuat catatan outbound (barang keluar). 
 * Skema ini mengharuskan adanya productId yang merupakan UUID valid, quantity yang merupakan angka positif, dan notes yang bersifat opsional.
 * 
 * - Penjelsasan lebih detail:
 *   - masih sama seperti CreateInboundSchema, productId harus UUID valid dan quantity harus angka positif.
 *   - karna tertulis z.number().int().positive, maka quantity harus berupa angka bulat positif. Jika tidak valid, akan muncul pesan error "Quantity harus lebih dari 0".
 * 
 * 4. GetMovementHistorySchema: Skema ini digunakan untuk memvalidasi parameter query saat mengambil riwayat pergerakan stok. 
 * Skema ini mengharuskan adanya page dan limit yang merupakan angka positif, serta parameter lainnya yang bersifat opsional.
 * 
 * - Penjelsasan lebih detail mengenai kode ini:
 * 
 * page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    productId: z.uuid().optional(),
    type: z.enum(['INBOUND', 'OUTBOUND']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),

    dimulai dari :
 *   - page: Harus berupa angka bulat positif. Jika tidak valid, akan muncul pesan error "Page harus lebih dari 0". Defaultnya adalah 1.
 *   - limit: Harus berupa angka bulat positif dengan maksimum 100. Jika tidak valid, akan muncul pesan error "Limit harus lebih dari 0 dan maksimal 100". Defaultnya adalah 10.
 *  - productId: Harus berupa UUID yang valid jika diberikan. Bersifat opsional.
 *  - type: Harus berupa salah satu dari 'INBOUND' atau 'OUTBOUND' jika diberikan. Bersifat opsional.
 *  - startDate dan endDate: Harus berupa string jika diberikan. Bersifat opsional.
 * 
 */
