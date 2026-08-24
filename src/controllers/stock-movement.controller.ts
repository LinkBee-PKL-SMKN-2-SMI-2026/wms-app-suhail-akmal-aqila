import type { Response } from 'express';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import type { AuthRequest, TokenPayload } from '../models/auth.model';
import type {
  CreateInboundRequest,
  CreateOutboundRequest,
  GetMovementHistoryQuery,
} from '../models/stock-movement.dto';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * 1. FUNGSI CREATE INBOUND (BARANG MASUK)
 * Fungsi ini digunakan untuk mencatat penambahan stok barang di gudang.
 *
 * Alur Kerja:
 * - Mengambil productId, quantity, dan notes dari body request, serta userId dari token JWT terautentikasi.
 * - Memastikan produk tersedia di database.
 * - Menjalankan database transaction (prisma.$transaction) untuk menjaga sifat atomik:
 *   a. Mengubah jumlah stok produk (increment/menambah stok).
 *   b. Mencatat riwayat pergerakan barang pada tabel `stock_Movements`.
 */
export const createInbound = catchAsync(async (req: AuthRequest, res: Response) => {
  const { productId, quantity, notes } = req.body as CreateInboundRequest;
  const { userId } = req.user as TokenPayload;

  // Cek keberadaan produk terlebih dahulu di database
  const product = await prisma.products.findUnique({ where: { id: productId } });
  if (!product) {
    throw new AppError('Produk tidak ditemukan', 404);
  }

  // Gunakan database transaction agar update stok & pencatatan riwayat bersifat atomik
  const result = await prisma.$transaction(async (tx) => {
    // 1. Update stok produk dengan menambahkan jumlah barang masuk (increment)
    const updatedProduct = await tx.products.update({
      where: { id: productId },
      data: { stock: { increment: quantity } },
    });

    /**
     * Penjelasan spesifik pembuat entri riwayat stok (Stock Movement):
     * Bagian kode di bawah berfungsi untuk mencatat log transaksi ke tabel `stock_Movements`.
     * - `type: 'INBOUND'`: Menandai bahwa transaksi ini adalah barang masuk.
     * - `quantity`: Jumlah unit barang yang ditambahkan.
     * - `notes`: Catatan opsional terkait transaksi barang masuk (misal: "Barang dari Supplier A").
     * - `userId`: Mengikat transaksi dengan ID staf/admin yang sedang login (diambil dari JWT token).
     * - `productId`: Mengikat transaksi dengan produk yang bersangkutan.
     */
    const movement = await tx.stock_Movements.create({
      data: {
        type: 'INBOUND',
        quantity,
        notes,
        userId,
        productId,
      },
    });

    // Mengembalikan objek berisi riwayat movement dan data produk yang sudah diperbarui stoknya
    return { movement, updatedProduct };
  });

  res.status(201).json({
    success: true,
    message: 'Barang masuk berhasil dicatat',
    data: result,
  });
});

/**
 * 2. FUNGSI CREATE OUTBOUND (BARANG KELUAR)
 * Fungsi ini digunakan untuk mencatat pengurangan stok barang yang keluar dari gudang.
 *
 * Alur Kerja:
 * - Memeriksa kecukupan stok produk (stok tidak boleh kurang dari jumlah yang diminta).
 * - Menjalankan database transaction (prisma.$transaction) untuk:
 *   a. Mengurangi stok produk (decrement).
 *   b. Mencatat riwayat pergerakan pada tabel `stock_Movements` dengan type 'OUTBOUND'.
 */
export const createOutbound = catchAsync(async (req: AuthRequest, res: Response) => {
  const { productId, quantity, notes } = req.body as CreateOutboundRequest;
  const { userId } = req.user as TokenPayload;

  const product = await prisma.products.findUnique({ where: { id: productId } });
  if (!product) {
    throw new AppError('Produk tidak ditemukan', 404);
  }

  // Cek kecukupan stok sebelum melakukan transaksi
  if (product.stock < quantity) {
    throw new AppError('Stok tidak mencukupi', 400);
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Update stok produk dengan mengurangi jumlah barang keluar (decrement)
    const updatedProduct = await tx.products.update({
      where: { id: productId },
      data: { stock: { decrement: quantity } },
    });

    // 2. Catat riwayat transaksi barang keluar ke tabel stock_Movements
    const movement = await tx.stock_Movements.create({
      data: {
        type: 'OUTBOUND',
        quantity,
        notes,
        userId,
        productId,
      },
    });

    return { movement, updatedProduct };
  });

  res.status(201).json({
    success: true,
    message: 'Barang keluar berhasil dicatat',
    data: result,
  });
});

/**
 * 3. FUNGSI GET MOVEMENT HISTORY (RIWAYAT PERGERAKAN STOK)
 * Fungsi ini digunakan untuk mengambil seluruh riwayat transaksi barang (INBOUND/OUTBOUND)
 * dengan dukungan pagination, pencarian berdasarkan produk, tipe, dan rentang tanggal.
 */
export const getMovementHistory = catchAsync(async (req: AuthRequest, res: Response) => {
  // Ambil parameter filter & pagination dari query string (URL)
  const {
    page = 1,
    limit = 10,
    productId,
    type,
    startDate,
    endDate,
  } = req.query as unknown as GetMovementHistoryQuery;

  // Konversi tipe data query param ke number untuk kalkulasi pagination
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  // Inisialisasi objek filter dinamis untuk kueri Prisma
  const where: Record<string, unknown> = {};

  // Filter berdasarkan ID produk (jika disertakan)
  if (productId) {
    where.productId = productId;
  }

  // Filter berdasarkan tipe transaksi INBOUND / OUTBOUND (jika disertakan)
  if (type) {
    where.type = type;
  }

  // Filter rentang tanggal transaksi (jika disertakan)
  if (startDate || endDate) {
    where.createdAt = {
      ...(startDate ? { gte: new Date(startDate) } : {}),
      ...(endDate ? { lte: new Date(endDate) } : {}),
    };
  }

  /**
   * Variabel where adalah objek kriteria pencarian dinamis. Prisma menggunakan where untuk menyaring data riwayat stok berdasarkan kriteria yang dikirim user
   * via Query String URL:Jika user mengirim productId > Cari riwayat khusus produk tersebut.
   * Jika user mengirim type > Cari yang tipe-nya saja (INBOUND atau OUTBOUND).
   * Jika user mengirim startDate / endDate > Cari transaksi pada rentang tanggal tersebut.
   * Jika user tidak mengirim filter apa pun, objek where bernilai kosong {} yang berarti Prisma akan mengambil seluruh data riwayat stok.
   */
  const [movements, total] = await Promise.all([
    prisma.stock_Movements.findMany({
      where, // ini nyarinya ke sini const where: Record<string, unknown> = {};
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' }, // Urutkan dari transaksi terbaru
      include: {
        product: {
          select: { name: true, sku: true }, // Ambil data nama & SKU produk terkait
        },
        user: {
          select: { name: true }, // Ambil nama user yang mencatat transaksi
        },
      },
    }),
    prisma.stock_Movements.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    message: 'Berhasil mengambil riwayat pergerakan stok',
    data: movements,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});
