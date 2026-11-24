// Kerangka halaman admin: sidebar, kepala halaman, dan tombol menu untuk
// layar kecil.
//
// Setiap halaman privat cukup memanggil Layout.mulai({...}) setelah memastikan
// sesi. Hasilnya adalah elemen tempat isi halaman diletakkan, sehingga susunan
// navigasi tidak perlu diulang di tujuh berkas HTML.

(function () {
  const MENU = [
    { kunci: 'dashboard', label: 'Dashboard', href: 'dashboard.html', ikon: 'dashboard' },
    { kunci: 'pesanan', label: 'Pesanan', href: 'orders.html', ikon: 'pesanan' },
    { kunci: 'layanan', label: 'Layanan', href: 'services.html', ikon: 'layanan' },
    { kunci: 'pengaturan', label: 'Pengaturan', href: 'settings.html', ikon: 'pengaturan' },
  ];

  function logo() {
    return `<svg width="34" height="34" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M24 5C24 5 12 18.4 12 28a12 12 0 0 0 24 0C36 18.4 24 5 24 5Z" fill="#CFFAFE" stroke="#0E7490" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M18.5 25.5 23 22l3 2.6 4.5-4.1" stroke="#0E7490" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M24 40.5V33" stroke="#06B6D4" stroke-width="2.6" stroke-linecap="round"/>
    </svg>`;
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

  function navHtml(aktif) {
    return MENU.map((item) => {
      const kelas = item.kunci === aktif ? ' class="aktif"' : '';
      const aria = item.kunci === aktif ? ' aria-current="page"' : '';
      return `<a href="${item.href}"${kelas}${aria}>${Ui.ikon(item.ikon)}<span>${item.label}</span></a>`;
    }).join('');
  }

  /**
   * Menyiapkan kerangka halaman.
   *
   * @param {object} opsi
   * @param {string} opsi.aktif     kunci menu yang sedang dibuka
   * @param {string} opsi.judul     judul halaman
   * @param {string} [opsi.keterangan]
   * @param {string} [opsi.aksi]    HTML tombol di kanan kepala halaman
   * @returns {Promise<{pengguna: object, isi: HTMLElement}>}
   */
  async function mulai({ aktif, judul, keterangan = '', aksi = '' }) {
    const pengguna = await Auth.pastikanAdmin();

    document.title = `${judul} — ${window.RENOVA.APP_NAME}`;

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="kerangka">
        <aside class="sidebar" id="sidebar" aria-label="Navigasi utama">
          <a class="merek" href="dashboard.html">
            ${logo()}
            <span class="merek-teks">
              <span class="merek-nama">${Ui.esc(window.RENOVA.APP_NAME)}</span>
              <span class="merek-slogan">${Ui.esc(window.RENOVA.APP_TAGLINE)}</span>
            </span>
          </a>
          <nav class="nav">
            <span class="nav-label">Menu Utama</span>
            ${navHtml(aktif)}
          </nav>
          <div class="sidebar-kaki">
            <div class="sidebar-pengguna">
              <span class="avatar">${Ui.esc(inisial(pengguna.name))}</span>
              <span style="min-width:0">
                <span class="pengguna-nama">${Ui.esc(pengguna.name)}</span>
                <span class="pengguna-email">${Ui.esc(pengguna.email)}</span>
              </span>
            </div>
            <button type="button" class="tombol sekunder" id="tombol-keluar" style="width:100%">
              ${Ui.ikon('keluar')} Keluar
            </button>
          </div>
        </aside>

        <div class="lapisan-gelap tersembunyi" id="lapisan"></div>

        <main class="konten">
          <div class="kepala-halaman">
            <div class="flex" style="align-items:flex-start;gap:12px">
              <button type="button" class="tombol-ikon tombol-menu" id="tombol-menu"
                aria-label="Buka menu" aria-expanded="false" aria-controls="sidebar">
                ${Ui.ikon('menu')}
              </button>
              <div>
                <h1>${Ui.esc(judul)}</h1>
                ${keterangan ? `<p>${keterangan}</p>` : ''}
              </div>
            </div>
            ${aksi ? `<div class="flex">${aksi}</div>` : ''}
          </div>
          <div id="isi"></div>
        </main>
      </div>`;

    const sidebar = document.getElementById('sidebar');
    const lapisan = document.getElementById('lapisan');
    const tombolMenu = document.getElementById('tombol-menu');

    function tutupMenu() {
      sidebar.classList.remove('terbuka');
      lapisan.classList.add('tersembunyi');
      tombolMenu.setAttribute('aria-expanded', 'false');
    }

    tombolMenu.addEventListener('click', () => {
      const terbuka = sidebar.classList.toggle('terbuka');
      lapisan.classList.toggle('tersembunyi', !terbuka);
      tombolMenu.setAttribute('aria-expanded', String(terbuka));
    });

    lapisan.addEventListener('click', tutupMenu);

    // Escape menutup menu di layar kecil, sama seperti kebiasaan dialog.
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') tutupMenu();
    });

    document.getElementById('tombol-keluar').addEventListener('click', async () => {
      const setuju = await Ui.konfirmasi({
        judul: 'Keluar dari akun?',
        pesan: 'Anda perlu memasukkan email dan kata sandi lagi untuk masuk kembali.',
        labelLanjut: 'Keluar',
        bahaya: true,
      });
      if (setuju) await Auth.keluar();
    });

    return { pengguna, isi: document.getElementById('isi') };
  }

  // Halaman privat tidak boleh ditampilkan dari cache setelah keluar: tombol
  // Back akan memuat ulang halaman dan memeriksa sesi kembali.
  window.addEventListener('pageshow', (e) => {
    if (e.persisted && !Auth.sudahMasuk()) {
      window.location.replace('login.html');
    }
  });

  window.Layout = { mulai };
})();
