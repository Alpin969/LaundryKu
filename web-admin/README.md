# RENOVA — Website Admin

Website admin RENOVA untuk mengelola layanan dan pesanan laundry. Dibangun
dengan HTML, CSS, dan JavaScript murni (tanpa framework), dan seluruh datanya
diambil dari REST API backend RENOVA yang sudah ada.

## Menjalankan

1. Jalankan backend di `backend/` (default `http://localhost:3000`).
2. Sajikan folder `web-admin/` sebagai berkas statis, misalnya:

```bash
npx serve -l 5500
```

3. Buka `http://localhost:5500/`.

Alamat API diatur di `assets/js/config.js` (`API_BASE_URL`). Tidak ada
kredensial, JWT_SECRET, atau kata sandi database di berkas frontend mana pun.

## Akun

Halaman ini hanya menerima akun dengan role `ADMIN`. Akun pelanggan yang
mencoba masuk akan ditolak dan tokennya tidak disimpan. Akun admin tidak bisa
didaftarkan dari sini.

## Halaman

| Berkas | Isi |
| --- | --- |
| `index.html` | Pintu masuk: mengarahkan ke dashboard atau login sesuai sesi. |
| `login.html` | Form masuk admin, tampil/sembunyikan sandi, validasi, pesan galat. |
| `dashboard.html` | Total pesanan, hitungan per status, pesanan yang perlu dikerjakan, pesanan terbaru. |
| `orders.html` | Tabel pesanan dengan pencarian, filter status, dan "muat lagi". |
| `order-detail.html` | Detail pesanan, foto pakaian, isi berat asli, ubah status, konfirmasi pembayaran. |
| `services.html` | Daftar layanan, pencarian, tambah/edit/hapus. |
| `service-form.html` | Form tambah dan ubah layanan (satu halaman, dibedakan `?id=`). |
| `settings.html` | Data akun admin, ubah nama, ganti kata sandi, keluar. |

## Endpoint yang dipakai

| Method | Endpoint | Dipakai di |
| --- | --- | --- |
| POST | `/api/auth/login` | login |
| GET | `/api/auth/me` | layout, pengaturan |
| PATCH | `/api/auth/me` | pengaturan |
| GET | `/api/orders` | dashboard, orders |
| GET | `/api/orders/:id` | order-detail |
| PATCH | `/api/orders/:id/berat-asli` | order-detail |
| PATCH | `/api/orders/:id/status` | order-detail |
| PATCH | `/api/orders/:id/bayar` | order-detail |
| GET | `/api/services` | services, service-form |
| GET | `/api/services/:id` | service-form |
| POST | `/api/services` | service-form |
| PUT | `/api/services/:id` | service-form |
| DELETE | `/api/services/:id` | services |
| GET | `/uploads/<berkas>` | foto pesanan |

## Batasan yang perlu diketahui

- **Hitungan dashboard** dibuat dari 100 pesanan terbaru (batas maksimum
  `limit` backend), bukan seluruh riwayat. Angka "Total pesanan" dan hitungan
  per status adalah hitungan dari data yang termuat itu. API belum punya
  endpoint hitungan/agregat.
- **Pencarian pesanan** menyaring data yang sudah dimuat di halaman, karena
  backend belum menyediakan pencarian pesanan. Pencarian layanan memakai
  `?search=` asli dari backend.
- **Pagination** memakai `limit`/`offset` dengan tombol "Muat lagi", karena
  backend tidak mengirim total baris.
- **Harga akhir** selalu dihitung backend (`berat asli × harga per kg` pesanan
  itu). Browser tidak pernah menghitung nilai yang menjadi kebenaran akhir.
- Tidak ada tombol hapus pesanan karena backend tidak menyediakan endpointnya.
- Email dan role akun tidak bisa diubah dari website karena belum ada
  endpoint-nya.

## Keamanan

- Token JWT disimpan di `sessionStorage` dan dihapus saat logout.
- Setiap halaman privat memanggil `GET /api/auth/me` lalu memastikan role
  `ADMIN` sebelum menampilkan data.
- Pemeriksaan di frontend hanya untuk pengalaman pengguna; otorisasi sebenarnya
  tetap dilakukan backend pada setiap permintaan.
