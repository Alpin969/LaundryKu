// Dashboard admin.
//
// Menjawab pertanyaan "pesanan mana yang perlu saya kerjakan sekarang?".
//
// Catatan tentang angka: backend hanya menyediakan daftar pesanan dengan
// limit/offset, tanpa endpoint hitungan. Karena itu dashboard memuat 100
// pesanan terbaru (batas maksimum backend) lalu menghitung statusnya di
// browser. Artinya angka ini mencerminkan 100 pesanan terbaru, bukan seluruh
// riwayat. Keterbatasan itu ditulis apa adanya di halaman, bukan disembunyikan.

(function () {
  const BATAS = 100;

  let isi = null;
  let semua = [];
  let galat = null;
  let memuat = true;

  async function mulai() {
    const kerangka = await Layout.mulai({
      aktif: 'dashboard',
      judul: 'Dashboard',
      keterangan: 'Ringkasan pesanan dan pekerjaan yang perlu ditangani.',
      aksi: `<button type="button" class="tombol sekunder" id="tombol-segarkan">
        ${Ui.ikon('segarkan')} Segarkan
      </button>
      <a class="tombol" href="orders.html">${Ui.ikon('pesanan')} Lihat Pesanan</a>`,
    });

    isi = kerangka.isi;
    document.getElementById('tombol-segarkan').addEventListener('click', () => muatUlang());

    await muatUlang();
  }

  async function muatUlang() {
    memuat = true;
    galat = null;
    gambar();

    try {
      const hasil = await Api.permintaan('/api/orders', {
        privat: true,
        query: { limit: BATAS },
      });
      semua = Array.isArray(hasil && hasil.data) ? hasil.data : [];
    } catch (kesalahan) {
      galat =
        kesalahan instanceof Api.KesalahanApi
          ? kesalahan.message
          : 'Data pesanan gagal dimuat.';
      semua = [];
    } finally {
      memuat = false;
      gambar();
    }
  }

  function jumlah(status) {
    return semua.filter((p) => p.status === status).length;
  }

  function statistik(kunci, label, nilai, ikonNama, kelas = '') {
    return `<article class="statistik ${kelas}">
      <span class="statistik-ikon">${Ui.ikon(ikonNama)}</span>
      <span class="statistik-angka">${nilai}</span>
      <span class="statistik-label">${label}</span>
    </article>`;
  }

  function kartuStatus() {
    return Object.entries(Ui.STATUS)
      .map(([kode, info]) => {
        return `<a class="statistik" href="orders.html?status=${encodeURIComponent(kode)}"
          style="text-decoration:none">
          <span class="statistik-label" style="display:flex;justify-content:space-between;align-items:center">
            ${Ui.lencanaStatus(kode)}
          </span>
          <span class="statistik-angka">${jumlah(kode)}</span>
          <span class="statistik-label">${Ui.esc(info.keterangan)}</span>
        </a>`;
      })
      .join('');
  }

  function perluDikerjakan() {
    // Yang paling mendesak: menunggu konfirmasi, lalu siap diambil.
    const daftar = semua
      .filter(
        (p) => p.status === 'PENDING_CONFIRMATION' || p.status === 'READY_FOR_PICKUP'
      )
      .slice(0, 6);

    if (!daftar.length) {
      return Ui.keadaanKosong(
        'Tidak ada yang menunggu',
        'Tidak ada pesanan yang menunggu konfirmasi atau siap diambil saat ini.'
      );
    }

    const baris = daftar
      .map(
        (p) => `<tr>
          <td class="utama">
            <a href="order-detail.html?id=${encodeURIComponent(p.id)}" style="color:inherit">#${p.id}</a>
            <div class="kecil samar">${Ui.esc(p.customer_name)}</div>
          </td>
          <td>${Ui.esc(p.service_name)}</td>
          <td>${Ui.lencanaStatus(p.status)}</td>
          <td class="kecil samar">${Ui.tanggalWaktu(p.created_at)}</td>
          <td class="kanan">
            <a class="tombol kecil" href="order-detail.html?id=${encodeURIComponent(p.id)}">Proses</a>
          </td>
        </tr>`
      )
      .join('');

    return `<div class="pembungkus-tabel">
      <table class="tabel tabel-responsif">
        <thead>
          <tr>
            <th>Pesanan</th><th>Layanan</th><th>Status</th><th>Masuk</th><th></th>
          </tr>
        </thead>
        <tbody>${baris}</tbody>
      </table>
    </div>`;
  }

  function terbaru() {
    const daftar = semua.slice(0, 8);

    if (!daftar.length) {
      return Ui.keadaanKosong(
        'Belum ada pesanan',
        'Pesanan yang dibuat pelanggan lewat aplikasi akan muncul di sini.'
      );
    }

    const baris = daftar
      .map(
        (p) => `<tr>
          <td class="utama">#${p.id}</td>
          <td>${Ui.esc(p.customer_name)}</td>
          <td>${Ui.esc(p.service_name)}</td>
          <td>${Ui.lencanaStatus(p.status)}</td>
          <td class="angka">${Ui.rupiah(p.total_price)}</td>
          <td class="kanan">
            <a class="tombol-ikon" href="order-detail.html?id=${encodeURIComponent(p.id)}"
              aria-label="Lihat pesanan #${p.id}" title="Lihat detail">${Ui.ikon('lihat')}</a>
          </td>
        </tr>`
      )
      .join('');

    return `<div class="pembungkus-tabel">
      <table class="tabel tabel-responsif">
        <thead>
          <tr>
            <th>ID</th><th>Pelanggan</th><th>Layanan</th><th>Status</th>
            <th class="kanan">Total</th><th></th>
          </tr>
        </thead>
        <tbody>${baris}</tbody>
      </table>
    </div>`;
  }

  function gambar() {
    if (!isi) return;

    if (galat) {
      isi.innerHTML = `<div class="kartu kartu-isi">
        ${Ui.keadaanGalat(galat)}
        <div style="text-align:center;margin-top:12px">
          <button type="button" class="tombol sekunder" id="coba-lagi">Coba lagi</button>
        </div>
      </div>`;
      document.getElementById('coba-lagi').addEventListener('click', muatUlang);
      return;
    }

    const aktif = semua.filter(
      (p) => p.status !== 'COMPLETED' && p.status !== 'CANCELLED'
    ).length;

    isi.innerHTML = `
      <div class="grid grid-statistik">
        ${statistik('total', 'Total pesanan termuat', memuat ? '…' : semua.length, 'pesanan')}
        ${statistik(
          'menunggu',
          'Menunggu konfirmasi',
          memuat ? '…' : jumlah('PENDING_CONFIRMATION'),
          'jam',
          'peringatan'
        )}
        ${statistik('dicuci', 'Sedang dicuci', memuat ? '…' : jumlah('WASHING'), 'layanan')}
        ${statistik('siap', 'Siap diambil', memuat ? '…' : jumlah('READY_FOR_PICKUP'), 'kotak')}
        ${statistik(
          'selesai',
          'Selesai',
          memuat ? '…' : jumlah('COMPLETED'),
          'centang',
          'sukses'
        )}
      </div>

      <p class="kecil samar" style="margin-top:10px">
        Angka di atas dihitung dari ${BATAS} pesanan terbaru (batas maksimum API),
        bukan seluruh riwayat. Pesanan yang masih berjalan: ${aktif}.
      </p>

      <div class="tumpuk" style="margin-top:22px">
        <section class="kartu">
          <div class="kartu-isi">
            <div class="flex-antara" style="margin-bottom:14px">
              <h2 style="font-size:16px">Perlu Dikerjakan</h2>
              <a class="kecil" href="orders.html">Semua pesanan</a>
            </div>
            ${memuat ? Ui.keadaanMemuat('Memuat pesanan...') : perluDikerjakan()}
          </div>
        </section>

        <section class="kartu">
          <div class="kartu-isi">
            <h2 style="font-size:16px;margin-bottom:14px">Pesanan Terbaru</h2>
            ${memuat
              ? Ui.keadaanMemuat('Memuat pesanan...')
              : terbaru()}
          </div>
        </section>

        <section>
          <h2 style="font-size:16px;margin-bottom:12px">Jumlah per Status</h2>
          <div class="grid grid-statistik">
            ${memuat ? Ui.keadaanMemuat() : kartuStatus()}
          </div>
        </section>
      </div>`;
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
