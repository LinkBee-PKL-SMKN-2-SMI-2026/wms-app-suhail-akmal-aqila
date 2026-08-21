import type { Response } from 'express';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import type { AuthRequest } from '../models/auth.model';
import type { 
    SummaryResponse, 
    LowStockProduct 
} from '../models/reporting.dto';
import { catchAsync } from '../utils/catchAsync';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const getSummary = catchAsync(async (req: AuthRequest, res: Response) => {
  const { date } = req.query;
  const targetDate = date ? new Date(date as string) : new Date();

  // Gunakan getTime() agar pembuatan instance Date baru benar-benar terpisah
  const startOfDay = new Date(targetDate.getTime());
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate.getTime());
  endOfDay.setHours(23, 59, 59, 999);

  const [totalProducts, totalCategories, totalLocations, totalUsers, inboundToday, outboundToday] =
    await Promise.all([
      prisma.products.count(),
      prisma.categories.count(),
      prisma.locations.count(),
      prisma.users.count(),
      prisma.stock_Movements.aggregate({
        where: {
          type: 'INBOUND',
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
        _sum: { quantity: true },
      }),
      prisma.stock_Movements.aggregate({
        where: {
          type: 'OUTBOUND',
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
        _sum: { quantity: true },
      }),
    ]);

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

export const getLowStock = catchAsync(async (req: AuthRequest, res: Response) => {
  const { threshold = 10, page = 1, limit = 10 } = req.query;

  const thresholdNum = Number(threshold);
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  // 1. Eksekusi query data produk DAN count total items secara parallel
  const [products, totalItems] = await Promise.all([
    prisma.products.findMany({
      where: {
        stock: { lt: thresholdNum },
        isActive: true,
      },
      include: {
        category: { select: { name: true } },
        location: { select: { name: true } },
      },
      orderBy: { stock: 'asc' },
      skip,
      take: limitNum,
    }),
    prisma.products.count({
      where: {
        stock: { lt: thresholdNum },
        isActive: true,
      },
    }),
  ]);

  // 2. Format data sesuai DTO LowStockProduct
  const formattedProducts: LowStockProduct[] = products.map((item) => ({
    id: item.id,
    name: item.name,
    sku: item.sku,
    stock: item.stock,
    minimumStock: item.minimumStock,
    categoryName: item.category.name,
    locationName: item.location.name,
  }));

  // 3. Sertakan metadata pagination agar lolos Acceptance Criteria!
  res.status(200).json({
    success: true,
    message: 'Low stock products retrieved successfully',
    data: formattedProducts,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalItems,
      totalPages: Math.ceil(totalItems / limitNum),
    },
  });
});
