import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg'; //tambahan untuk menghubungkan ke database PostgreSQL
import type { RegisterRequest, LoginRequest } from '../models/auth.dto';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';
import { logger } from '../utils/logger';

// const prisma = new PrismaClient();//menggunakan PrismaClient tanpa adapter PostgreSQL
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! }); //kode yang ditambahkan untuk menghubungkan ke database PostgreSQL
const prisma = new PrismaClient({ adapter }); //dideklarasikan prisma dengan adapter PostgreSQL

// ... kode register & login

export const register = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password } = req.body as RegisterRequest;

  const existingUser = await prisma.users.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError('Email sudah terdaftar', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.users.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: 'STAFF',
    },
  });

  const payload = { userId: user.id, email: user.email };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  logger.info(`User registered successfully: ${user.email}`);

  res.status(201).json({
    status: 'success',
    message: 'Registrasi berhasil',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    },
  });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginRequest;

  const user = await prisma.users.findUnique({ where: { email } });
  if (!user) {
    throw new AppError('Email atau password salah', 401);
  }

  if (!user.isActive) {
    throw new AppError('Akun kamu tidak aktif, silakan hubungi admin', 403);
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) {
    throw new AppError('Email atau password salah', 401);
  }

  const payload = { userId: user.id, email: user.email };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  logger.info(`User logged in successfully: ${user.email}`);

  res.status(200).json({
    status: 'success',
    message: 'Login berhasil',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    },
  });
});
