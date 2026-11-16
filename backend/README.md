# LaundryKu Backend

REST API untuk sistem pemesanan dan manajemen laundry LaundryKu.
Dipakai bersama oleh Website Admin (HTML/CSS/JS) dan Aplikasi Mobile (Flutter).

## Teknologi

| Bagian | Dipakai |
|---|---|
| Runtime | Node.js 18 atau lebih baru |
| Framework | Express 5 |
| Database | PostgreSQL (Aiven) lewat driver `pg` |
| Bahasa | JavaScript CommonJS (`require`) |
| Autentikasi | JWT (`jsonwebtoken`) + hash password (`bcryptjs`) |
| Upload foto | `multer` |
| Keamanan | `helmet`, `cors`, `express-rate-limit` |

## Menjalankan

```bash
cd backend
npm install
```

Siapkan berkas `.env` (lihat bagian Konfigurasi di bawah), lalu:

```bash
npm run dev
```

Server berjalan di `http://localhost:3000`.

## Konfigurasi

Salin `.env.example` menjadi `.env`, lalu isi nilainya.

| Variabel | Keterangan |
|---|---|
| `PORT` | Port server, contoh `3000` |
| `DB_HOST` | Host PostgreSQL Aiven |
| `DB_PORT` | Port PostgreSQL Aiven |
| `DB_NAME` | Nama database, contoh `laundryku` |
| `DB_USER` | User database, umumnya `avnadmin` |
| `DB_PASSWORD` | Kata sandi database |
| `DB_SSL_CA` | Lokasi CA Certificate Aiven, contoh `./certs/ca.pem` |
| `JWT_SECRET` | Kunci rahasia penanda tangan token |
| `JWT_EXPIRES_IN` | Masa berlaku token, contoh `1d` |

Dua berkas berikut **tidak pernah masuk Git** (lihat `.gitignore`):

- `.env` — berisi kredensial database dan kunci JWT.
- `certs/ca.pem` — CA Certificate dari Aiven.

Membuat `JWT_SECRET` acak yang kuat:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

## Struktur database

Skema ada di `database/schema.sql` dan berisi tiga tabel: `users`, `services`,
`orders`. Untuk menerapkannya ke database kosong:

```bash
psql "$DATABASE_URL" -f database/schema.sql
```

Berkas itu hanya membuat tabel bila belum ada (`IF NOT EXISTS`), jadi aman
dijalankan berulang.

## Membuat akun admin

Registrasi lewat API hanya bisa membuat akun CUSTOMER. Itu disengaja: kalau
role boleh dikirim dari body permintaan, siapa pun bisa mendaftar sebagai
ADMIN. Akun admin dibuat lewat skrip:

```bash
npm run create-admin -- "Nama Admin" admin@laundryku.test "KataSandi123"
```

Kalau email tersebut sudah terdaftar, akunnya dinaikkan menjadi ADMIN dan
kata sandinya diperbarui.

## Endpoint

### Publik (tanpa login)

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/` | Memastikan API berjalan |
| GET | `/api/health` | Kondisi server |
| GET | `/api/health/db` | Uji koneksi database |
| POST | `/api/auth/register` | Daftar akun baru (role CUSTOMER) |
| POST | `/api/auth/login` | Masuk dan dapatkan token |
| GET | `/api/services` | Daftar layanan (bisa `?search=`) |
| GET | `/api/services/:id` | Detail satu layanan |

### Perlu login

Sertakan header `Authorization: Bearer <token>`.

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/auth/me` | Data akun yang sedang masuk |
| POST | `/api/orders` | Buat pesanan (khusus CUSTOMER) |
| GET | `/api/orders` | Daftar pesanan (bisa `?status=` dan `?limit=`) |
| GET | `/api/orders/:id` | Detail pesanan |
| PATCH | `/api/orders/:id/batal` | Batalkan pesanan |
| PATCH | `/api/orders/:id/foto` | Unggah foto (`multipart/form-data`, field `photo`) |

Customer hanya melihat pesanannya sendiri. Admin melihat semua pesanan.

### Khusus ADMIN

| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/api/services` | Tambah layanan |
| PUT | `/api/services/:id` | Ubah layanan |
| DELETE | `/api/services/:id` | Hapus layanan |
| PATCH | `/api/orders/:id/status` | Ubah status pesanan |
| PATCH | `/api/orders/:id/berat-asli` | Isi berat asli, harga akhir dihitung otomatis |

## Alur status pesanan

```
PENDING_CONFIRMATION -> CONFIRMED -> WASHING -> READY_FOR_PICKUP -> COMPLETED
        |                                    |
        +--------------> CANCELLED <---------+
```

Pesanan bisa dibatalkan selama belum `COMPLETED`. Customer hanya boleh
membatalkan pesanannya sendiri saat masih `PENDING_CONFIRMATION` atau
`CONFIRMED`; admin boleh membatalkan kapan saja sebelum selesai.

Pesanan hanya bisa menjadi `COMPLETED` setelah berat asli diisi, karena
tanpa itu harga akhirnya belum diketahui.

## Bentuk response

Response yang berhasil:

```json
{
  "success": true,
  "message": "Keterangan singkat",
  "data": {}
}
```

Response yang gagal:

```json
{
  "success": false,
  "message": "Penjelasan yang bisa dibaca pengguna",
  "error": "KODE_ERROR"
}
```

Kode HTTP yang dipakai: `200` berhasil, `201` data dibuat, `400` data tidak
sesuai aturan, `401` belum login atau token tidak sah, `403` tidak punya hak,
`404` data tidak ada, `409` bentrok dengan keadaan data saat ini,
`429` terlalu banyak percobaan, `500` kesalahan server, `503` database belum
siap.

## Catatan keamanan

- Password disimpan sebagai hash bcrypt, tidak pernah sebagai teks biasa.
- `password_hash` tidak pernah ikut dikirim ke client.
- Semua query memakai parameter (`$1`, `$2`), sehingga aman dari SQL Injection.
- Token JWT berisi id dan role; datanya dibaca ulang dari database pada setiap
  permintaan, jadi akun yang dihapus langsung tidak bisa dipakai lagi.
- Koneksi database memakai SSL dengan CA Certificate dan
  `rejectUnauthorized: true`.
- Endpoint register dan login dibatasi 20 percobaan per 15 menit per alamat IP.
- Nama berkas foto dibuat acak oleh server; nama dari pengguna tidak dipakai.
