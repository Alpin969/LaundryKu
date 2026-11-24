// Halaman pengaturan: data akun admin dan penggantian kata sandi.
//
// Keduanya memakai PATCH /api/auth/me milik backend:
//   { name }                                  -> ganti nama
//   { current_password, new_password }        -> ganti sandi
//
// Email dan role tidak bisa diubah karena backend tidak menyediakan
// endpointnya.

(function () {
  let isi = null;
  let pengguna = null;

  async function mulai() {
    const kerangka = await Layout.mulai({
      aktif: 'pengaturan',
      judul: 'Pengaturan',
      keterangan: 'Data akun yang sedang dipakai dan penggantian kata sandi.',
    });

    isi = kerangka.isi;
    pengguna = kerangka.pengguna;
    gambar();
  }

  function gambar() {
    isi.innerHTML = `
      <div class="detail-grid">
        <section class="kartu">
          <div class="kartu-isi">
            <div class="kartu-judul">Data Akun</div>

            <div class="flex" style="gap:14px;margin-bottom:18px">
              <span class="avatar" style="width:52px;height:52px;flex:0 0 52px;font-size:17px">
                ${Ui.esc(inisial(pengguna.name))}
              </span>
              <div style="min-width:0">
                <div style="font-weight:700;font-size:15px">${Ui.esc(pengguna.name)}</div>
                <div class="kecil samar">${Ui.esc(pengguna.email)}</div>
                <span class="lencana netral" style="margin-top:6px">${Ui.esc(
                  pengguna.role
                )}</span>
              </div>
            </div>

            <div id="info-akun">
              <div class="baris-detail">
                <span class="label">Nama</span>
                <span class="nilai">${Ui.esc(pengguna.name)}</span>
              </div>
              <div class="baris-detail">
                <span class="label">Email</span>
                <span class="nilai">${Ui.esc(pengguna.email)}</span>
              </div>
              <div class="baris-detail">
                <span class="label">Peran</span>
                <span class="nilai">${Ui.esc(pengguna.role)}</span>
              </div>
              <div class="baris-detail">
                <span class="label">Terdaftar sejak</span>
                <span class="nilai">${Ui.tanggal(pengguna.created_at)}</span>
              </div>
            </div>

            <p class="bantuan" style="margin-top:12px">
              Email dan peran tidak bisa diubah dari sini karena belum tersedia
              endpoint-nya.
            </p>
          </div>
        </section>

        <div class="tumpuk">
          <section class="kartu">
            <div class="kartu-isi">
              <div class="kartu-judul">Ubah Nama</div>
              <form id="form-nama" novalidate>
                <div class="form-baris">
                  <label for="nama-baru">Nama tampilan</label>
                  <input class="isian" id="nama-baru" maxlength="100"
                    value="${Ui.esc(pengguna.name)}" required />
                  <span class="pesan-isian" id="galat-nama"></span>
                </div>
                <button type="submit" class="tombol" id="simpan-nama">Simpan Nama</button>
              </form>
            </div>
          </section>

          <section class="kartu">
            <div class="kartu-isi">
              <div class="kartu-judul">Ganti Kata Sandi</div>
              <form id="form-sandi" novalidate>
                <div class="form-baris">
                  <label for="sandi-lama">Kata sandi saat ini</label>
                  <input class="isian" id="sandi-lama" type="password"
                    autocomplete="current-password" required />
                  <span class="pesan-isian" id="galat-sandi-lama"></span>
                </div>
                <div class="form-baris">
                  <label for="sandi-baru">Kata sandi baru</label>
                  <input class="isian" id="sandi-baru" type="password" minlength="8"
                    autocomplete="new-password" required />
                  <span class="bantuan">Minimal 8 karakter, maksimum 72.</span>
                  <span class="pesan-isian" id="galat-sandi-baru"></span>
                </div>
                <div class="form-baris">
                  <label for="sandi-ulang">Ulangi kata sandi baru</label>
                  <input class="isian" id="sandi-ulang" type="password"
                    autocomplete="new-password" required />
                  <span class="pesan-isian" id="galat-sandi-ulang"></span>
                </div>
                <button type="submit" class="tombol" id="simpan-sandi">Ganti Kata Sandi</button>
              </form>
            </div>
          </section>
        </div>
      </div>`;

    pasangAksi();
  }

  function inisial(nama) {
    const bagian = String(nama || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!bagian.length) return '?';
    if (bagian.length === 1) return bagian[0].slice(0, 2).toUpperCase();
    return (bagian[0][0] + bagian[bagian.length - 1][0]).toUpperCase();
  }

  function pasangAksi() {
    document.getElementById('form-nama').addEventListener('submit', async (e) => {
      e.preventDefault();

      const kotak = document.getElementById('nama-baru');
      const galat = document.getElementById('galat-nama');
      const tombol = document.getElementById('simpan-nama');
      const nama = kotak.value.trim();

      galat.textContent = '';
      kotak.classList.remove('salah');

      if (!nama) {
        galat.textContent = 'Nama tidak boleh kosong.';
        kotak.classList.add('salah');
        kotak.focus();
        return;
      }

      Ui.setSibuk(tombol, true, 'Menyimpan...');

      try {
        const hasil = await Api.permintaan('/api/auth/me', {
          method: 'PATCH',
          privat: true,
          body: { name: nama },
        });

        // Nama di sidebar dan di kartu akun ikut diperbarui tanpa muat ulang
        // halaman.
        pengguna.name = (hasil.data && hasil.data.user && hasil.data.user.name) || nama;
        document.querySelectorAll('.pengguna-nama').forEach((el) => {
          el.textContent = pengguna.name;
        });
        document.querySelectorAll('.avatar').forEach((el) => {
          el.textContent = inisial(pengguna.name);
        });

        Ui.toast(hasil.message || 'Nama berhasil diperbarui.', 'sukses');
        gambar();
      } catch (kesalahan) {
        Ui.setSibuk(tombol, false);
        galat.textContent =
          kesalahan instanceof Api.KesalahanApi ? kesalahan.message : 'Gagal menyimpan nama.';
      }
    });

    document.getElementById('form-sandi').addEventListener('submit', async (e) => {
      e.preventDefault();

      const lama = document.getElementById('sandi-lama');
      const baru = document.getElementById('sandi-baru');
      const ulang = document.getElementById('sandi-ulang');
      const galatLama = document.getElementById('galat-sandi-lama');
      const galatBaru = document.getElementById('galat-sandi-baru');
      const galatUlang = document.getElementById('galat-sandi-ulang');
      const tombol = document.getElementById('simpan-sandi');

      [galatLama, galatBaru, galatUlang].forEach((el) => (el.textContent = ''));
      [lama, baru, ulang].forEach((el) => el.classList.remove('salah'));

      let valid = true;

      if (!lama.value) {
        galatLama.textContent = 'Kata sandi saat ini wajib diisi.';
        lama.classList.add('salah');
        valid = false;
      }

      if (baru.value.length < 8) {
        galatBaru.textContent = 'Kata sandi baru minimal 8 karakter.';
        baru.classList.add('salah');
        valid = false;
      }

      if (ulang.value !== baru.value) {
        galatUlang.textContent = 'Ulangi kata sandi belum sama.';
        ulang.classList.add('salah');
        valid = false;
      }

      if (!valid) return;

      Ui.setSibuk(tombol, true, 'Menyimpan...');

      try {
        const hasil = await Api.permintaan('/api/auth/me', {
          method: 'PATCH',
          privat: true,
          body: {
            current_password: lama.value,
            new_password: baru.value,
          },
        });

        Ui.toast(hasil.message || 'Kata sandi berhasil diperbarui.', 'sukses');
        document.getElementById('form-sandi').reset();
      } catch (kesalahan) {
        Ui.setSibuk(tombol, false);

        const pesan =
          kesalahan instanceof Api.KesalahanApi
            ? kesalahan.message
            : 'Kata sandi gagal diperbarui.';

        // INVALID_CURRENT_PASSWORD berasal dari backend dan berlaku untuk
        // isian kata sandi saat ini.
        if (kesalahan.kode === 'INVALID_CURRENT_PASSWORD') {
          galatLama.textContent = pesan;
          lama.classList.add('salah');
          lama.focus();
        } else {
          galatBaru.textContent = pesan;
        }
      }
    });
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
