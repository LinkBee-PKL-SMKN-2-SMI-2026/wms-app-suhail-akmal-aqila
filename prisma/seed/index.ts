import 'dotenv/config';
import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { genSaltSync, hashSync } from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
const salt = genSaltSync(10);

async function main() {
  console.log('🌱 Mulai melakukan seeding data...');

  // 1. Seed Admin User
  const hashedPassword = hashSync('admin123', salt);
  const admin = await prisma.users.create({
    data: {
      name: 'Admin WMS',
      email: 'admin@wms.com',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  // 2. Seed Categories (3 Kategori)
  const categoryElektronik = await prisma.categories.create({
    data: { name: 'Elektronik', description: 'Peralatan dan perangkat elektronik' },
  });
  const categoryFurniture = await prisma.categories.create({
    data: { name: 'Furniture', description: 'Perabot kantor dan rumah tangga' },
  });
  const categoryATK = await prisma.categories.create({
    data: { name: 'ATK', description: 'Alat Tulis Kantor' },
  });

  // 3. Seed Locations (3 Lokasi)
  const locA1 = await prisma.locations.create({
    data: { name: 'Rak A1', code: 'RAK-A1' },
  });
  const locA2 = await prisma.locations.create({
    data: { name: 'Rak A2', code: 'RAK-A2' },
  });
  const locB1 = await prisma.locations.create({
    data: { name: 'Gudang B1', code: 'GDG-B1' },
  });

  // 4. Seed Products (5 Produk)
  await prisma.products.createMany({
    data: [
      {
        name: 'Laptop ASUS ROG',
        sku: 'ELEK-001',
        description: 'Laptop Gaming High Performance',
        stock: 15,
        minimumStock: 5,
        categoryId: categoryElektronik.id,
        locationId: locA1.id,
      },
      {
        name: 'Monitor LG 24 Inch',
        sku: 'ELEK-002',
        description: 'Monitor FHD IPS',
        stock: 20,
        minimumStock: 5,
        categoryId: categoryElektronik.id,
        locationId: locA1.id,
      },
      {
        name: 'Kursi Kerja Ergonomis',
        sku: 'FURN-001',
        description: 'Kursi kantor jaring adjustable',
        stock: 10,
        minimumStock: 3,
        categoryId: categoryFurniture.id,
        locationId: locB1.id,
      },
      {
        name: 'Meja Lipat Kayu',
        sku: 'FURN-002',
        description: 'Meja serbaguna kayu jati belanda',
        stock: 8,
        minimumStock: 2,
        categoryId: categoryFurniture.id,
        locationId: locB1.id,
      },
      {
        name: 'Kertas HVS A4 80gr',
        sku: 'ATK-001',
        description: 'Kertas print A4 1 rim',
        stock: 50,
        minimumStock: 10,
        categoryId: categoryATK.id,
        locationId: locA2.id,
      },
    ],
  });

  console.log('✅ Seeding selesai! Data yang dibuat:');
  console.log({ user: admin, categories: [categoryElektronik, categoryFurniture, categoryATK], locations: [locA1, locA2, locB1] });
}

main()
  .catch((e) => {
    console.error('❌ Error saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


// // Seed Example 1
// const example1 = await prisma.example.upsert({
//   where: { name: 'Laptop Asus ROG' },
//   update: {},
//   create: {
//     name: 'Laptop Asus ROG',
//     description: 'Laptop gaming performa tinggi',
//     isActive: true,
//     items: {
//       create: [
//         { productName: 'Laptop ROG Strix G16', quantity: 5, price: 18000000 },
//         { productName: 'Mouse ROG Gladius', quantity: 10, price: 850000 },
//         { productName: 'Keyboard ROG Falchion', quantity: 8, price: 1200000 },
//       ],
//     },
//   },
//   include: { items: true },
// });

// // Seed Example 2
// const example2 = await prisma.example.upsert({
//   where: { name: 'Printer Epson L3210' },
//   update: {},
//   create: {
//     name: 'Printer Epson L3210',
//     description: 'Printer multifungsi untuk kantor',
//     isActive: true,
//     items: {
//       create: [
//         { productName: 'Printer Epson L3210', quantity: 3, price: 3500000 },
//         { productName: 'Tinta Botol 664', quantity: 20, price: 75000 },
//       ],
//     },
//   },
//   include: { items: true },
// });

// // Seed Example 3
// const example3 = await prisma.example.upsert({
//   where: { name: 'Monitor Samsung 24 inch' },
//   update: {},
//   create: {
//     name: 'Monitor Samsung 24 inch',
//     description: 'Monitor LED full HD',
//     isActive: false,
//     items: {
//       create: [
//         { productName: 'Samsung Odyssey G3 24"', quantity: 7, price: 2800000 },
//       ],
//     },
//   },
//   include: { items: true },
// });
