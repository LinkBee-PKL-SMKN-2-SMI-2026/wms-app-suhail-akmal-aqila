import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import type { RegisterRequest, LoginRequest } from '../models/auth.dto';
import type { AuthRequest, TokenPayload } from '../models/auth.model';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';
import { logger } from '../utils/logger';

// Menghubungkan pg Pool ke Prisma Client dengan adapter PostgreSQL
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * 1. REGISTER USER
 * Menerima nama, email, dan password dari client.
 * Memeriksa keunikan email, meng-hash password dengan bcrypt,
 * menyimpan user baru (role STAFF), dan mengembalikan Access & Refresh Token.
 */
export const register = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password } = req.body as RegisterRequest;

  // Cek apakah email sudah terdaftar
  const existingUser = await prisma.users.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError('Email sudah terdaftar', 400);
  }

  // Hash password (10 salt rounds)
  const hashedPassword = await bcrypt.hash(password, 10);

  // Simpan user baru ke database
  const user = await prisma.users.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: 'STAFF',
    },
  });

  // Buat JWT tokens
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

/**
 * 2. LOGIN USER
 * Memeriksa keberadaan email, status keaktifan user (isActive),
 * dan mencocokkan password hash menggunakan bcrypt.compare.
 * Jika valid, mengembalikan Access & Refresh Token.
 */
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

/**
 * 3. GET ME (PROFILE USER YANG SEDANG LOGIN)
 * Mengambil data profil user berdasarkan userId yang didapat dari JWT Token
 * (ditempelkan oleh middleware authenticate ke req.user).
 * Penting: Password disembunyikan dengan fitur `select`.
 */
export const getMe = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Unauthorized: Token tidak ditemukan', 401);
  }

  const { userId } = req.user as TokenPayload;

  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError('User tidak ditemukan', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Data user berhasil diambil',
    data: user,
  });
});
