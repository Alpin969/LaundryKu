// Pusat komunikasi dengan backend LaundryKu.
//
// Semua permintaan lewat sini supaya penanganan token, bentuk respons, dan
// pesan kesalahan konsisten di seluruh halaman.
//
// Aturan yang dipegang:
//   - Token hanya dikirim pada permintaan privat, lewat header Authorization.
//   - Token kedaluwarsa/tidak sah -> sesi dibersihkan dan pengguna dikembalikan
//     ke halaman login satu kali saja.
//   - Pesan kesalahan selalu berasal dari `message` backend bila ada, supaya
//     pengguna membaca alasan sebenarnya, bukan "terjadi kesalahan".

(function () {
  const KUNCI_TOKEN = window.RENOVA.TOKEN_KEY;

  // Menandai bahwa pengalihan ke login sudah dijadwalkan, supaya beberapa
  // permintaan yang gagal bersamaan tidak memicu beberapa pengalihan.
  let sedangDialihkan = false;

  class KesalahanApi extends Error {
    constructor(pesan, { status = 0, kode = null, data = null } = {}) {
      super(pesan);
      this.name = 'KesalahanApi';
      this.status = status;
      this.kode = kode;
      this.data = data;
    }
  }

  function ambilToken() {
    return sessionStorage.getItem(KUNCI_TOKEN);
  }

  function simpanToken(token) {
    sessionStorage.setItem(KUNCI_TOKEN, token);
  }

  function hapusToken() {
    sessionStorage.removeItem(KUNCI_TOKEN);
  }

  function alamatApi(jalur) {
    const dasar = window.RENOVA.API_BASE_URL.replace(/\/+$/, '');
    const bersih = jalur.startsWith('/') ? jalur : `/${jalur}`;
    return `${dasar}${bersih}`;
  }

  // Foto disimpan backend sebagai "/uploads/<berkas>", sehingga alamat
  // lengkapnya dibentuk dari alamat API yang sama.
  function alamatFoto(photoUrl) {
    if (!photoUrl) return null;
    if (/^https?:\/\//i.test(photoUrl)) return photoUrl;
    return alamatApi(photoUrl);
  }

  function alihkanKeLogin() {
    if (sedangDialihkan) return;
    sedangDialihkan = true;
    hapusToken();
    window.location.replace('login.html?kedaluwarsa=1');
  }

  /**
   * Mengirim permintaan ke backend.
   *
   * @param {string} jalur    contoh "/api/orders"
   * @param {object} opsi
   * @param {string} [opsi.method]
   * @param {object} [opsi.body]        dikirim sebagai JSON
   * @param {boolean} [opsi.privat]     kirim header Authorization
   * @param {object} [opsi.query]       digabungkan ke query string
   * @param {AbortSignal} [opsi.signal]
   */
  async function permintaan(jalur, opsi = {}) {
    const {
      method = 'GET',
      body = null,
      privat = false,
      query = null,
      signal = null,
    } = opsi;

    let alamat = alamatApi(jalur);

    if (query) {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([kunci, nilai]) => {
        if (nilai !== undefined && nilai !== null && nilai !== '') {
          params.append(kunci, String(nilai));
        }
      });
      const teks = params.toString();
      if (teks) alamat += `?${teks}`;
    }

    const header = { Accept: 'application/json' };

    if (body !== null) header['Content-Type'] = 'application/json';

    if (privat) {
      const token = ambilToken();
      if (!token) {
        alihkanKeLogin();
        throw new KesalahanApi('Sesi Anda sudah berakhir. Silakan masuk kembali.', {
          status: 401,
          kode: 'TOKEN_MISSING',
        });
      }
      header.Authorization = `Bearer ${token}`;
    }

    let respons;
    try {
      respons = await fetch(alamat, {
        method,
        headers: header,
        body: body === null ? undefined : JSON.stringify(body),
        signal,
      });
    } catch (galat) {
      // fetch hanya gagal di tingkat jaringan; server yang menolak tetap
      // menghasilkan respons dan ditangani di bawah.
      if (galat.name === 'AbortError') throw galat;
      throw new KesalahanApi(
        'Tidak bisa menghubungi server. Pastikan backend berjalan dan periksa koneksi Anda.',
        { status: 0, kode: 'NETWORK_ERROR' }
      );
    }

    let isi = null;
    const teks = await respons.text();

    if (teks) {
      try {
        isi = JSON.parse(teks);
      } catch (_) {
        // Balasan bukan JSON (mis. halaman galat HTML). Diperlakukan sebagai
        // kegagalan server, bukan sebagai data.
        isi = null;
      }
    }

    if (respons.ok) {
      return isi;
    }

    const kode = isi && isi.error ? isi.error : null;
    const pesan =
      (isi && isi.message) ||
      (respons.status === 404
        ? 'Alamat yang diminta tidak ditemukan.'
        : 'Permintaan gagal diproses server.');

    // Token bermasalah: sesi tidak bisa dilanjutkan, jadi bersihkan sekali.
    if (
      privat &&
      (kode === 'TOKEN_EXPIRED' ||
        kode === 'TOKEN_INVALID' ||
        kode === 'TOKEN_MISSING' ||
        kode === 'ACCOUNT_NOT_FOUND' ||
        (respons.status === 401 && !kode))
    ) {
      alihkanKeLogin();
    }

    throw new KesalahanApi(pesan, {
      status: respons.status,
      kode,
      data: isi,
    });
  }

  window.Api = {
    KesalahanApi,
    permintaan,
    alamatApi,
    alamatFoto,
    ambilToken,
    simpanToken,
    hapusToken,
  };
})();
