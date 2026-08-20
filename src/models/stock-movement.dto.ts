import type { z } from 'zod';
import type {
  CreateInboundSchema,
  CreateOutboundSchema,
  GetMovementHistorySchema,
} from '../validations/stock-movement.validation';

export type CreateInboundRequest = z.infer<typeof CreateInboundSchema>['body'];
export type CreateOutboundRequest = z.infer<typeof CreateOutboundSchema>['body'];
export type GetMovementHistoryQuery = z.infer<typeof GetMovementHistorySchema>['query'];

/**
 * Intinya kamu ambil tipe data dari skema validasi yang sudah dibuat di file stock-movement.validation.ts,
 * kemudian kamu buat tipe data baru yang sesuai dengan kebutuhan di file stock-movement.dto.ts ini.
 *
 * contohnya penggunaaan z.infer & typeof :
 *
 * 1. z.infer: Digunakan untuk mengambil tipe data dari skema validasi yang sudah dibuat di file stock-movement.validation.ts.
 * 2. typeof: Digunakan untuk mengambil tipe data dari skema validasi yang sudah dibuat di file stock-movement.validation.ts.
 *
 * Lengkapya : export type CreateOutboundRequest = z.infer<typeof CreateOutboundSchema>['body'];
 *
 * Bahasa mudahnya, kamu ambil tipe data dari skema validasi CreateOutboundSchema, kemudian kamu ambil properti body dari skema tersebut.
 *
 * Jadi, tipe data CreateOutboundRequest ini akan sesuai dengan properti body dari skema validasi CreateOutboundSchema.
 *
 * Dengan begitu, kamu bisa memastikan bahwa data yang diterima oleh controller sesuai dengan skema validasi yang sudah dibuat.
 * lanjut ke GetMovementHistoryQuery, sama seperti CreateOutboundRequest, kamu ambil tipe data dari skema validasi GetMovementHistorySchema, kemudian kamu ambil properti query dari skema tersebut.
 *
 * //
 * masih bingung query itu apa? query itu adalah parameter yang dikirimkan melalui URL, biasanya digunakan untuk filter data atau pagination.
 *
 * contoh penggunaan query di URL : /api/stock-movements?page=1&limit=10&productId=123&type=INBOUND&startDate=2023-01-01&endDate=2023-01-31
 *
 * kalau body itu adalah data yang dikirimkan melalui request body, biasanya digunakan untuk membuat atau mengupdate data.
 *
 */
