import { Router } from 'express';
import authRoute from './auth.route';

const router = Router();

router.use('/auth', authRoute);

export default router;

//ini kode buat manggil doang lebih tepatnya mah
//jadi intinya kode di atas adalah untuk membuat route utama (index route) yang menggabungkan semua route yang ada di dalam aplikasi.
// Dalam hal ini, route utama akan menggunakan route auth.route.ts untuk menangani endpoint terkait autentikasi (register dan login).
