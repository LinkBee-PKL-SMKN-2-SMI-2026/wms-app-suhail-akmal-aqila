import type { Response } from 'express';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import type { AuthRequest } from '../models/auth.model';
import type { LowStockProduct, SummaryResponse } from '../models/reporting.dto';
import { catchAsync } from '../utils/catchAsync';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * 1. FUNGSI GET SUMMARY (REKAP DATA GUDANG HARIAN)
 * Mengambil ringkasan total data master (produk, kategori, lokasi, user)
 * serta total akumulasi barang masuk (inbound) dan keluar (outbound) khusus pada hari ini.
 */
export const getSummary = catchAsync(async (req: AuthRequest, res: Response) => {
  // Ambil parameter tanggal dari URL query (opsional). Jika tidak ada, gunakan tanggal hari ini.
  const { date } = req.query;
  const targetDate = date ? new Date(date as string) : new Date();

  // Menentukan batas awal hari (jam 00:00:00.000) untuk filter database
  const startOfDay = new Date(targetDate.getTime());
  startOfDay.setHours(0, 0, 0, 0);

  // Menentukan batas akhir hari (jam 23:59:59.999) untuk filter database
  const endOfDay = new Date(targetDate.getTime());
  endOfDay.setHours(23, 59, 59, 999);

  // Promise.all digunakan untuk menjalankan 6 query database sekaligus secara bersamaan (paralel)
  // agar proses fetching data jauh lebih cepat daripada query satu per satu.
  const [totalProducts, totalCategories, totalLocations, totalUsers, inboundToday, outboundToday] =
    await Promise.all([
      prisma.products.count(), // 1. Hitung total semua produk
      prisma.categories.count(), // 2. Hitung total semua kategori
      prisma.locations.count(), // 3. Hitung total semua lokasi
      prisma.users.count(), // 4. Hitung total semua user terdaftar

      // 5. Hitung total jumlah barang MASUK (INBOUND) hari ini menggunakan fungsi aggregate (_sum)
      prisma.stock_Movements.aggregate({
        where: {
          type: 'INBOUND',
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
        _sum: { quantity: true },
      }),

      // 6. Hitung total jumlah barang KELUAR (OUTBOUND) hari ini
      prisma.stock_Movements.aggregate({
        where: {
          type: 'OUTBOUND',
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
        _sum: { quantity: true },
      }),
    ]);

  // Menyusun data respon. Menggunakan "|| 0" untuk memastikan jika belum ada transaksi (hasil _sum null),
  // nilainya akan otomatis bernilai 0 dan tidak menyebabkan error.
  const summaryData: SummaryResponse = {
    totalProducts,
    totalCategories,
    totalLocations,
    totalStockInboundToday: inboundToday._sum.quantity || 0,
    totalStockOutboundToday: outboundToday._sum.quantity || 0,
    totalUsers,
  };

  res.status(200).json({
    success: true,
    message: 'Summary retrieved successfully',
    data: summaryData,
  });
});

/**
 * 2. FUNGSI GET LOW STOCK (PERINGATAN STOK TIPIS)
 * Mengambil daftar produk yang jumlah stoknya berada di bawah batas tertentu (threshold).
 * Dilengkapi dengan pagination dan menyertakan nama kategori & nama lokasi produk.
 */
export const getLowStock = catchAsync(async (req: AuthRequest, res: Response) => {
  // Ambil parameter dari URL query, berikan nilai default jika client tidak mengirimkannya
  const { threshold = 10, page = 1, limit = 10 } = req.query;

  // Konversi input dari string URL menjadi tipe data Number untuk kalkulasi matematika
  const thresholdNum = Number(threshold);
  const pageNum = Number(page);
  const limitNum = Number(limit);

  // Kalkulasi data yang harus dilewati (skip) berdasarkan halaman (page) yang diminta
  const skip = (pageNum - 1) * limitNum;

  // Jalankan query pencarian produk dan kalkulasi total item secara paralel (bersamaan)
  const [products, totalItems] = await Promise.all([
    prisma.products.findMany({
      where: {
        stock: { lt: thresholdNum }, // lt = Less Than (stok kurang dari threshold)
        isActive: true, // Hanya ambil produk yang masih aktif
      },
      include: {
        category: { select: { name: true } }, // Ambil nama kategori terkait
        location: { select: { name: true } }, // Ambil nama lokasi terkait
      },
      orderBy: { stock: 'asc' }, // Urutkan dari stok yang paling sedikit
      skip, // Untuk pagination
      take: limitNum, // Batasi jumlah data yang diambil per halaman
    }),

    // Query untuk menghitung total seluruh produk stok tipis (digunakan untuk totalPages pagination)
    prisma.products.count({
      where: {
        stock: { lt: thresholdNum },
        isActive: true,
      },
    }),
  ]);

  // merubah/memformat bentuk data agar sesuai dengan DTO LowStockProduct
  // (Mengubah relasi objek category/location menjadi string categoryName/locationName langsung)
  const formattedProducts: LowStockProduct[] = products.map((item) => ({
    id: item.id,
    name: item.name,
    sku: item.sku,
    stock: item.stock,
    minimumStock: item.minimumStock,
    categoryName: item.category.name,
    locationName: item.location.name,
  }));

  // Mengembalikan respon JSON beserta metadata pagination
  res.status(200).json({
    success: true,
    message: 'Low stock products retrieved successfully',
    data: formattedProducts,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalItems,
      totalPages: Math.ceil(totalItems / limitNum), // Hitung total halaman
    },
  });
});
