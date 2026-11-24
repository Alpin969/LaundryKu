// Kelola layanan: daftar, cari, tambah, ubah, hapus.
//
// Pencarian memakai ?search= milik backend, jadi yang disaring adalah data
// dari server, bukan salinan di browser.

(function () {
  let isi = null;
  let layanan = [];
  let memuat = true;
  let galat = null;
  let kataCari = '';
  let jedaCari = null;

  async function mulai() {
    const kerangka = await Layout.mulai({
      aktif: 'layanan',
      judul: 'Layanan',
      keterangan:
        'Daftar layanan yang tampil di aplikasi pelanggan. Mengubah harga hanya berlaku untuk pesanan baru.',
      aksi: `<a class="tombol" href="service-form.html">${Ui.ikon('tambah')} Tambah Layanan</a>`,
    });

    isi = kerangka.isi;
    gambarKerangka();
    await muatUlang();
  }

  function gambarKerangka() {
    isi.innerHTML = `
      <div class="alat">
        <div class="kotak-cari">
          ${Ui.ikon('cari')}
          <input class="isian" id="cari" type="search"
            placeholder="Cari nama atau deskripsi layanan"
            aria-label="Cari layanan" />
        </div>
        <button type="button" class="tombol-ikon" id="segarkan" title="Segarkan" aria-label="Segarkan">
          ${Ui.ikon('segarkan')}
        </button>
      </div>
      <div id="wadah-layanan"></div>`;

    const cari = document.getElementById('cari');

    // Pencarian ditunda ~300 ms supaya tidak mengirim permintaan untuk setiap
    // ketukan huruf.
    cari.addEventListener('input', (e) => {
      kataCari = e.target.value.trim();
      clearTimeout(jedaCari);
      jedaCari = setTimeout(() => muatUlang(), 300);
    });

    document.getElementById('segarkan').addEventListener('click', () => muatUlang());
  }

  async function muatUlang() {
    memuat = true;
    galat = null;
    gambar();

    try {
      const hasil = await Api.permintaan('/api/services', {
        query: kataCari ? { search: kataCari } : null,
      });
      layanan = Array.isArray(hasil && hasil.data) ? hasil.data : [];
    } catch (kesalahan) {
      galat =
        kesalahan instanceof Api.KesalahanApi
          ? kesalahan.message
          : 'Daftar layanan gagal dimuat.';
      layanan = [];
    } finally {
      memuat = false;
      gambar();
    }
  }

  function kartu(item) {
    return `<article class="kartu kartu-layanan">
      <div class="flex-antara" style="align-items:flex-start">
        <h3>${Ui.esc(item.name)}</h3>
        <span class="lencana netral">${Ui.esc(item.duration)}</span>
      </div>
      <p class="deskripsi">${
        item.description ? Ui.esc(item.description) : '<span class="samar">Tanpa deskripsi.</span>'
      }</p>
      <span class="harga"><strong>${Ui.rupiah(item.price_per_kg)}</strong><span>per kg</span></span>
      <div class="kaki-kartu">
        <a class="tombol sekunder kecil" href="service-form.html?id=${encodeURIComponent(item.id)}">
          ${Ui.ikon('ubah')} Edit
        </a>
        <button type="button" class="tombol bahaya kecil" data-hapus="${item.id}"
          data-nama="${Ui.esc(item.name)}">${Ui.ikon('hapus')} Hapus</button>
      </div>
    </article>`;
  }

  function gambar() {
    const wadah = document.getElementById('wadah-layanan');
    if (!wadah) return;

    if (galat) {
      wadah.innerHTML = `<div class="kartu kartu-isi">
        ${Ui.keadaanGalat(galat)}
        <div style="text-align:center;margin-top:12px">
          <button type="button" class="tombol sekunder" id="coba-lagi">Coba lagi</button>
        </div>
      </div>`;
      document.getElementById('coba-lagi').addEventListener('click', () => muatUlang());
      return;
    }

    if (memuat && !layanan.length) {
      wadah.innerHTML = `<div class="kartu kartu-isi">${Ui.keadaanMemuat(
        'Memuat daftar layanan...'
      )}</div>`;
      return;
    }

    if (!layanan.length) {
      wadah.innerHTML = `<div class="kartu kartu-isi">${
        kataCari
          ? Ui.keadaanKosong(
              'Tidak ada yang cocok',
              `Tidak ada layanan yang cocok dengan "${kataCari}".`
            )
          : Ui.keadaanKosong(
              'Belum ada layanan',
              'Tambahkan layanan pertama supaya pelanggan bisa memesan lewat aplikasi.'
            )
      }</div>`;
      return;
    }

    wadah.innerHTML = `<div class="grid grid-dua">${layanan.map(kartu).join('')}</div>`;

    wadah.querySelectorAll('[data-hapus]').forEach((tombol) => {
      tombol.addEventListener('click', () =>
        hapus(Number(tombol.dataset.hapus), tombol.dataset.nama, tombol)
      );
    });
  }

  async function hapus(id, nama, tombol) {
    const setuju = await Ui.konfirmasi({
      judul: 'Hapus layanan?',
      pesan: `Layanan "${nama}" akan dihapus permanen. Layanan yang sudah dipakai pada pesanan tidak bisa dihapus.`,
      labelLanjut: 'Hapus',
      bahaya: true,
    });
    if (!setuju) return;

    Ui.setSibuk(tombol, true, 'Menghapus...');

    try {
      const hasil = await Api.permintaan(`/api/services/${id}`, {
        method: 'DELETE',
        privat: true,
      });
      Ui.toast(hasil.message || `Layanan "${nama}" berhasil dihapus.`, 'sukses');
      await muatUlang();
    } catch (kesalahan) {
      Ui.setSibuk(tombol, false);
      // Pesan SERVICE_IN_USE dari backend sudah menjelaskan sebabnya
      // ("masih dipakai pada pesanan"), jadi ditampilkan apa adanya.
      Ui.toast(
        kesalahan instanceof Api.KesalahanApi
          ? kesalahan.message
          : 'Layanan gagal dihapus.',
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
