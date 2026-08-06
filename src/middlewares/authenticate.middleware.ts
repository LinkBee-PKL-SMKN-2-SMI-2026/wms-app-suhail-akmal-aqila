import type { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import type { AuthRequest } from '../models/auth.model';

//kode untuk memeriksa apakah request yang masuk memiliki token akses yang valid. Jika token valid, maka payload dari token akan disimpan di req.user untuk digunakan di middleware atau route handler berikutnya. Jika token tidak valid atau tidak ada, maka akan mengembalikan error Unauthorized.
export const authenticate = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Unauthorized: Token tidak ditemukan', 401));
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return next(new AppError('Unauthorized: Token tidak valid', 401));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    return next(new AppError('Unauthorized: Token tidak valid atau kedaluwarsa', 401));
  }
};

// Di TypeScript / JavaScript modern, jika kamu menggunakan
// try...catch dan tidak membutuhkan variabel error-nya,
// kamu tidak perlu menuliskan nama variabelnya sama sekali (optional catch binding).
//   try {
//     const payload = verifyAccessToken(token);
//     req.user = payload;
//     next();
//   } catch (_error) { // <-- Error di sini karena _error tidak dipakai
//     return next(new AppError('Unauthorized: Token tidak valid atau kedaluwarsa', 401));
//   }
