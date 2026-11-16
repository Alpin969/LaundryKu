// Register, login, dan data akun yang sedang masuk.
//
// Catatan keamanan penting:
//   - Password TIDAK PERNAH disimpan apa adanya, hanya hash bcrypt-nya.
//   - Kolom password_hash tidak pernah ikut dikirim ke client.
//   - Role pada register selalu dipaksa CUSTOMER. Kalau role boleh dikirim
//     dari body, siapa pun bisa mendaftar sebagai ADMIN.
const bcrypt = require('bcryptjs');

const { query } = require('../config/database');
const AppError = require('../utils/AppError');
const { asString, asEmail } = require('../utils/validate');
const { terjemahkanDenganConstraint } = require('../utils/pgError');
const { buatToken, siapDipakai } = require('../utils/jwt');

// 10 putaran adalah nilai yang umum dipakai: cukup lambat untuk menyulitkan
// penebakan, tetapi masih cepat untuk dijalankan server saat login.
const PUTARAN_BCRYPT = 10;

// Bcrypt hanya memakai 72 byte pertama password. Membatasinya di sini lebih
// jujur daripada menerima password panjang yang ujungnya dipotong diam-diam.
const PANJANG_PASSWORD_MIN = 8;
const PANJANG_PASSWORD_MAX = 72;

// Daftar kolom yang aman dikirim ke client. password_hash sengaja tidak ada.
const KOLOM_AMAN = 'id, name, email, role, created_at';

function pastikanJwtSiap() {
  if (!siapDipakai()) {
    throw AppError.serviceUnavailable(
      'Fitur autentikasi belum aktif: isi JWT_SECRET pada berkas .env dengan nilai rahasia acak, lalu jalankan ulang server.',
      'JWT_NOT_CONFIGURED'
    );
  }
}

// POST /api/auth/register
async function register(req, res) {
  pastikanJwtSiap();

  const nama = asString(req.body.name, 'name', { min: 1, max: 100 });
  const email = asEmail(req.body.email, 'email');
  const password = asString(req.body.password, 'password', {
    min: PANJANG_PASSWORD_MIN,
    max: PANJANG_PASSWORD_MAX,
  });

  const passwordHash = await bcrypt.hash(password, PUTARAN_BCRYPT);

  try {
    const hasil = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'CUSTOMER')
       RETURNING ${KOLOM_AMAN};`,
      [nama, email, passwordHash]
    );

    const user = hasil.rows[0];

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil. Simpan token ini untuk mengakses API.',
      data: {
        user,
        token: buatToken(user),
      },
    });
  } catch (error) {
    // Email sudah dipakai -> 409 dengan pesan yang jelas.
    const appError = terjemahkanDenganConstraint(error);
    if (appError) throw appError;
    throw error;
  }
}

// POST /api/auth/login
async function login(req, res) {
  pastikanJwtSiap();

  const email = asEmail(req.body.email, 'email');
  const password = asString(req.body.password, 'password', { min: 1, max: 200 });

  const hasil = await query(
    `SELECT id, name, email, password_hash, role, created_at
       FROM users
      WHERE LOWER(email) = LOWER($1);`,
    [email]
  );

  const user = hasil.rows[0];

  // Satu pesan yang sama untuk "email tidak ada" dan "password salah".
  // Kalau dibedakan, orang bisa memakai halaman login untuk mencari tahu
  // email mana saja yang terdaftar.
  const pesanGagal = 'Email atau kata sandi salah.';

  if (!user || !user.password_hash) {
    throw AppError.unauthorized(pesanGagal, 'INVALID_CREDENTIALS');
  }

  const cocok = await bcrypt.compare(password, user.password_hash);
  if (!cocok) {
    throw AppError.unauthorized(pesanGagal, 'INVALID_CREDENTIALS');
  }

  delete user.password_hash;

  res.status(200).json({
    success: true,
    message: 'Login berhasil.',
    data: {
      user,
      token: buatToken(user),
    },
  });
}

// GET /api/auth/me - data akun yang sedang masuk
async function me(req, res) {
  res.status(200).json({
    success: true,
    message: 'Data akun yang sedang masuk.',
    data: { user: req.user },
  });
}

module.exports = {
  register,
  login,
  me,
};
