// Form tambah/ubah layanan.
//
// Satu halaman dipakai untuk dua mode, dibedakan oleh ?id= pada alamat:
//   tanpa id -> POST /api/services
//   ada id   -> GET /api/services/:id untuk memuat data lama, lalu
//               PUT /api/services/:id
//
// Aturan isian mengikuti validasi backend, supaya kesalahan tertangkap
// sebelum dikirim: nama 1-100 karakter, deskripsi maksimum 2000, harga
// 0.01-99999999, durasi 1-50 karakter.

(function () {
  let isi = null;
  let id = null;

  function bacaId() {
    const params = new URLSearchParams(window.location.search);
    const teks = params.get('id');
    return teks && /^\d+$/.test(teks) ? Number(teks) : null;
  }

  async function mulai() {
    id = bacaId();
    const modeUbah = id !== null;

    const kerangka = await Layout.mulai({
      aktif: 'layanan',
      judul: modeUbah ? 'Ubah Layanan' : 'Tambah Layanan',
      keterangan: modeUbah
        ? 'Perubahan berlaku untuk pesanan baru. Pesanan lama tetap memakai harga saat dibuat.'
        : 'Layanan baru langsung tampil di aplikasi pelanggan begitu disimpan.',
      aksi: `<a class="tombol sekunder" href="services.html">${Ui.ikon('kembali')} Kembali</a>`,
    });

    isi = kerangka.isi;

    if (!modeUbah) {
      gambarForm(null);
      return;
    }

    isi.innerHTML = `<div class="kartu kartu-isi">${Ui.keadaanMemuat(
      'Memuat data layanan...'
    )}</div>`;

    try {
      const hasil = await Api.permintaan(`/api/services/${id}`);
      const data = hasil && hasil.data ? hasil.data : null;

      if (!data) throw new Api.KesalahanApi('Data layanan tidak lengkap pada balasan server.');
      gambarForm(data);
    } catch (kesalahan) {
      isi.innerHTML = `<div class="kartu kartu-isi">
        ${Ui.keadaanGalat(
          kesalahan instanceof Api.KesalahanApi
            ? kesalahan.message
            : 'Data layanan gagal dimuat.'
        )}
        <div style="text-align:center;margin-top:12px">
          <a class="tombol" href="services.html">Kembali ke daftar</a>
        </div>
      </div>`;
    }
  }

  function gambarForm(data) {
    const modeUbah = data !== null;

    isi.innerHTML = `
      <div style="max-width:640px">
        <form class="kartu" id="form-layanan" novalidate>
          <div class="kartu-isi">
            <div class="form-baris">
              <label for="nama">Nama layanan</label>
              <input class="isian" id="nama" name="nama" maxlength="100"
                placeholder="Contoh: Cuci Kering Setrika"
                value="${modeUbah ? Ui.esc(data.name) : ''}" required />
              <span class="pesan-isian" id="galat-nama"></span>
            </div>

            <div class="form-baris">
              <label for="deskripsi">Deskripsi <span class="samar">(opsional)</span></label>
              <textarea class="textarea" id="deskripsi" name="deskripsi" maxlength="2000"
                placeholder="Jelaskan layanan ini untuk pelanggan.">${
                  modeUbah && data.description ? Ui.esc(data.description) : ''
                }</textarea>
              <span class="bantuan">Maksimum 2000 karakter.</span>
              <span class="pesan-isian" id="galat-deskripsi"></span>
            </div>

            <div class="grid grid-dua" style="gap:14px">
              <div class="form-baris">
                <label for="harga">Harga per kg (Rp)</label>
                <input class="isian" id="harga" name="harga" type="number"
                  inputmode="decimal" min="0.01" step="0.01" placeholder="7000"
                  value="${modeUbah ? Ui.esc(data.price_per_kg) : ''}" required />
                <span class="pesan-isian" id="galat-harga"></span>
              </div>

              <div class="form-baris">
                <label for="durasi">Estimasi pengerjaan</label>
                <input class="isian" id="durasi" name="durasi" maxlength="50"
                  placeholder="Contoh: 2 hari"
                  value="${modeUbah ? Ui.esc(data.duration) : ''}" required />
                <span class="pesan-isian" id="galat-durasi"></span>
              </div>
            </div>

            <div class="baris-tombol" style="margin-top:8px">
              <button type="submit" class="tombol" id="tombol-simpan">
                ${modeUbah ? 'Simpan Perubahan' : 'Simpan Layanan'}
              </button>
              <a class="tombol sekunder" href="services.html">Batal</a>
            </div>
          </div>
        </form>
      </div>`;

    document.getElementById('form-layanan').addEventListener('submit', (e) => {
      e.preventDefault();
      simpan(modeUbah);
    });

    // Pesan galat per isian hilang begitu isinya diperbaiki.
    isi.querySelectorAll('.isian, .textarea').forEach((kotak) => {
      kotak.addEventListener('input', () => {
        kotak.classList.remove('salah');
        const teman = kotak.nextElementSibling;
        if (teman && teman.classList.contains('pesan-isian')) teman.textContent = '';
        else {
          const pesan = kotak.parentElement.querySelector('.pesan-isian');
          if (pesan) pesan.textContent = '';
        }
      });
    });
  }

  function tampilkanGalat(kotakId, pesanId, pesan) {
    const kotak = document.getElementById(kotakId);
    const tempat = document.getElementById(pesanId);
    if (kotak) kotak.classList.add('salah');
    if (tempat) tempat.textContent = pesan;
  }

  /** Mengembalikan objek data bila valid, atau null bila ada isian salah. */
  function validasi() {
    const nama = document.getElementById('nama').value.trim();
    const deskripsi = document.getElementById('deskripsi').value.trim();
    const hargaTeks = document.getElementById('harga').value.trim();
    const durasi = document.getElementById('durasi').value.trim();

    let valid = true;

    if (!nama) {
      tampilkanGalat('nama', 'galat-nama', 'Nama layanan wajib diisi.');
      valid = false;
    } else if (nama.length > 100) {
      tampilkanGalat('nama', 'galat-nama', 'Nama layanan maksimum 100 karakter.');
      valid = false;
    }

    if (deskripsi.length > 2000) {
      tampilkanGalat('deskripsi', 'galat-deskripsi', 'Deskripsi maksimum 2000 karakter.');
      valid = false;
    }

    const harga = Number(hargaTeks.replace(',', '.'));
    if (!hargaTeks) {
      tampilkanGalat('harga', 'galat-harga', 'Harga wajib diisi.');
      valid = false;
    } else if (Number.isNaN(harga) || harga <= 0) {
      tampilkanGalat('harga', 'galat-harga', 'Harga harus berupa angka lebih besar dari 0.');
      valid = false;
    } else if (harga > 99999999) {
      tampilkanGalat('harga', 'galat-harga', 'Harga maksimum Rp 99.999.999.');
      valid = false;
    }

    if (!durasi) {
      tampilkanGalat('durasi', 'galat-durasi', 'Estimasi pengerjaan wajib diisi.');
      valid = false;
    } else if (durasi.length > 50) {
      tampilkanGalat('durasi', 'galat-durasi', 'Estimasi maksimum 50 karakter.');
      valid = false;
    }

    if (!valid) {
      const pertama = isi.querySelector('.isian.salah, .textarea.salah');
      if (pertama) pertama.focus();
      return null;
    }

    return {
      name: nama,
      description: deskripsi || null,
      price_per_kg: harga,
      duration: durasi,
    };
  }

  async function simpan(modeUbah) {
    const data = validasi();
    if (!data) return;

    const tombol = document.getElementById('tombol-simpan');
    Ui.setSibuk(tombol, true, 'Menyimpan...');

    try {
      const hasil = await Api.permintaan(
        modeUbah ? `/api/services/${id}` : '/api/services',
        {
          method: modeUbah ? 'PUT' : 'POST',
          privat: true,
          body: data,
        }
      );

      Ui.toast(hasil.message || 'Layanan berhasil disimpan.', 'sukses', 1600);
      setTimeout(() => window.location.replace('services.html'), 500);
    } catch (kesalahan) {
      Ui.setSibuk(tombol, false);
      Ui.toast(
        kesalahan instanceof Api.KesalahanApi
          ? kesalahan.message
          : 'Layanan gagal disimpan.',
        'gagal',
        5000
      );
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    mulai().catch((e) => {
      if (e && e.kode === 'ROLE_NOT_ALLOWED') return;
      if (!Auth.sudahMasuk()) return;
      document.getElementById('app').innerHTML = `<div class="layar-auth">
        <div class="kartu kartu-isi">${Ui.keadaanGalat(e.message || 'Halaman gagal dimuat.')}</div>
      </div>`;
    });
  });
})();
