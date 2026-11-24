// Pengelolaan sesi admin.
//
// Alurnya mengikuti kebutuhan website admin:
//   1. Login mengirim email dan password ke POST /api/auth/login.
//   2. Token baru disimpan setelah role dipastikan ADMIN, karena website ini
//      tidak boleh dipakai akun pelanggan.
//   3. Setiap halaman privat memanggil pastikanAdmin() sebelum menggambar isi.
//
// Pemeriksaan role di sini hanya untuk pengalaman pengguna. Otorisasi
// sebenarnya tetap dilakukan backend pada setiap permintaan.

(function () {
  let penggunaSekarang = null;

  function sudahMasuk() {
    return Boolean(Api.ambilToken());
  }

  /**
   * Masuk sebagai admin.
   * Melempar Api.KesalahanApi bila kredensial salah atau role bukan ADMIN.
   */
  async function masuk(email, password) {
    const hasil = await Api.permintaan('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });

    const token = hasil && hasil.data ? hasil.data.token : null;
    const pengguna = hasil && hasil.data ? hasil.data.user : null;

    if (!token || !pengguna) {
      throw new Api.KesalahanApi(
        'Balasan login tidak lengkap. Coba lagi atau hubungi pengelola sistem.',
        { kode: 'LOGIN_INVALID_RESPONSE' }
      );
    }

    if (pengguna.role !== 'ADMIN') {
      // Token tidak pernah disimpan, jadi sesi pelanggan tidak ikut terbawa
      // ke website admin.
      throw new Api.KesalahanApi(
        'Akun ini bukan akun admin. Website ini hanya untuk pengelola laundry.',
        { status: 403, kode: 'ROLE_NOT_ALLOWED' }
      );
    }

    Api.simpanToken(token);
    penggunaSekarang = pengguna;
    return pengguna;
  }

  async function keluar() {
    penggunaSekarang = null;
    Api.hapusToken();
    window.location.replace('login.html');
  }

  const selisih = (nilai) => (nilai === undefined ? null : nilai);

  /**
   * Memastikan pengguna yang masuk berperan ADMIN.
   *
   * Mengembalikan data pengguna, atau melempar kesalahan bila sesi tidak sah.
   * Bila pengguna bukan admin, sesi dihapus lalu dilempar dengan kode
   * ROLE_NOT_ALLOWED supaya halaman bisa menampilkan pesan yang tepat.
   */
  async function pastikanAdmin() {
    if (!sudahMasuk()) {
      window.location.replace('login.html');
      throw new Api.KesalahanApi('Belum masuk.', { status: 401 });
    }

    if (penggunaSekarang) return penggunaSekarang;

    const hasil = await Api.permintaan('/api/auth/me', { privat: true });
    const pengguna = hasil && hasil.data ? hasil.data.user : null;

    if (!pengguna) {
      throw new Api.KesalahanApi('Data akun tidak bisa dibaca.', {
        kode: 'ME_INVALID_RESPONSE',
      });
    }

    if (pengguna.role !== 'ADMIN') {
      Api.hapusToken();
      window.location.replace('login.html?bukanAdmin=1');
      throw new Api.KesalahanApi('Bukan akun admin.', {
        status: 403,
        kode: 'ROLE_NOT_ALLOWED',
      });
    }

    penggunaSekarang = pengguna;
    return pengguna;
  }

  function pengguna() {
    return penggunaSekarang;
  }

  window.Auth = {
    masuk,
    keluar,
    pastikanAdmin,
    pengguna,
    sudahMasuk,
    selisih,
  };
})();
