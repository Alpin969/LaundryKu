// Daftar pesanan.
//
// Filter status memakai query ?status= milik backend. Pencarian dilakukan di
// sisi browser atas hasil yang sudah dimuat karena backend belum menyediakan
// pencarian pesanan; batasannya ditulis di halaman.
//
// Pagination: backend mendukung limit & offset, tetapi belum mengirim total
// keseluruhan. Yang dipakai adalah tombol "Muat lagi" berbasis offset, bukan
// nomor halaman yang tidak bisa dipastikan jumlahnya.

(function () {
  const BATAS = 50;

  let isi = null;
  let pesanan = [];
  let offset = 0;
  let adaLagi = false;
  let memuat = false;
  let galat = null;
  let status = '';
  let kataCari = '';
  let sudahPernahMemuat = false;

  function bacaQuery() {
    const params = new URLSearchParams(window.location.search);
    status = params.get('status') || '';
  }

  async function mulai() {
    bacaQuery();

    const kerangka = await Layout.mulai({
      aktif: 'pesanan',
      judul: 'Pesanan',
      keterangan:
        'Kelola pesanan pelanggan: periksa detail, isi berat asli, ubah status, dan konfirmasi pembayaran.',
    });

    isi = kerangka.isi;
    gambarKerangka();
    await muatUlang();
  }

  function gambarKerangka() {
    const opsiStatus = Object.entries(Ui.STATUS)
      .map(
        ([kode, info]) =>
          `<option value="${kode}"${kode === status ? ' selected' : ''}>${info.label}</option>`
      )
      .join('');

    isi.innerHTML = `
      <div class="alat">
        <div class="kotak-cari">
          ${Ui.ikon('cari')}
          <input
            class="isian"
            id="cari"
            type="search"
            placeholder="Cari ID, nama pelanggan, atau layanan"
            aria-label="Cari pesanan"
          />
        </div>
        <select class="select-kecil" id="saring-status" aria-label="Saring berdasarkan status">
          <option value="">Semua status</option>
          ${opsiStatus}
        </select>
        <button type="button" class="tombol-ikon" id="segarkan" title="Segarkan" aria-label="Segarkan">
          ${Ui.ikon('segarkan')}
        </button>
      </div>

      <section class="kartu">
        <div id="wadah-pesanan"></div>
      </section>

      <p class="kecil samar" style="margin-top:12px">
        Pencarian hanya menyaring pesanan yang sudah dimuat di halaman ini.
      </p>`;

    document.getElementById('cari').addEventListener('input', (e) => {
      kataCari = e.target.value.trim().toLowerCase();
      gambarTabel();
    });

    const pilih = document.getElementById('saring-status');
    pilih.value = status;
    pilih.addEventListener('change', () => {
      status = pilih.value;

      // Alamat ikut diperbarui supaya penyaring bisa dibagikan/di-bookmark
      // dan tombol Back kembali ke daftar yang sama.
      const alamat = new URL(window.location.href);
      if (status) alamat.searchParams.set('status', status);
      else alamat.searchParams.delete('status');
      window.history.replaceState({}, '', alamat);

      muatUlang();
    });

    document.getElementById('segarkan').addEventListener('click', () => muatUlang());
  }

  async function muatUlang() {
    memuat = true;
    galat = null;
    offset = 0;
    gambarTabel();

    await ambilData(false);
  }

  async function muatLagi() {
    if (memuat) return;
    memuat = true;
    gambarTabel();
    await ambilData(true);
  }

  async function ambilData(lanjutan) {
    try {
      const hasil = await Api.permintaan('/api/orders', {
        privat: true,
        query: { status, limit: BATAS, offset },
      });

      const data = Array.isArray(hasil && hasil.data) ? hasil.data : [];
      pesanan = lanjutan ? pesanan.concat(data) : data;
      offset = pesanan.length;
      adaLagi = data.length === BATAS;
      sudahPernahMemuat = true;
    } catch (kesalahan) {
      galat =
        kesalahan instanceof Api.KesalahanApi
          ? kesalahan.message
          : 'Daftar pesanan gagal dimuat.';
      if (!lanjutan) pesanan = [];
    } finally {
      memuat = false;
      gambarTabel();
    }
  }

  function tersaring() {
    if (!kataCari) return pesanan;

    return pesanan.filter((p) => {
      const teks = [
        `#${p.id}`,
        String(p.id),
        p.customer_name,
        p.customer_email,
        p.service_name,
      ]
        .join(' ')
        .toLowerCase();
      return teks.includes(kataCari);
    });
  }

  function gambarTabel() {
    const wadah = document.getElementById('wadah-pesanan');
    if (!wadah) return;

    if (galat) {
      wadah.innerHTML = `${Ui.keadaanGalat(galat)}
        <div style="text-align:center;margin-top:12px">
          <button type="button" class="tombol sekunder" id="coba-lagi">Coba lagi</button>
        </div>`;
      document.getElementById('coba-lagi').addEventListener('click', () => muatUlang());
      return;
    }

    if (memuat && !pesanan.length) {
      wadah.innerHTML = Ui.keadaanMemuat('Memuat pesanan...');
      return;
    }

    const daftar = tersaring();

    if (!sudahPernahMemuat) {
      wadah.innerHTML = Ui.keadaanMemuat('Memuat pesanan...');
      return;
    }

    if (!daftar.length) {
      wadah.innerHTML = kataCari
        ? Ui.keadaanKosong(
            'Tidak ada yang cocok',
            `Tidak ada pesanan yang cocok dengan "${kataCari}". Coba kata kunci lain.`
          )
        : Ui.keadaanKosong(
            'Belum ada pesanan',
            status
              ? 'Belum ada pesanan dengan status ini.'
              : 'Pesanan dari pelanggan akan muncul di sini setelah dibuat lewat aplikasi.'
          );
      return;
    }

    const baris = daftar
      .map(
        (p) => `<tr>
          <td data-label="ID" class="utama">#${p.id}</td>
          <td data-label="Pelanggan">
            ${Ui.esc(p.customer_name)}
            <div class="kecil samar">${Ui.esc(p.customer_email)}</div>
          </td>
          <td data-label="Layanan">${Ui.esc(p.service_name)}</td>
          <td data-label="Tanggal">${Ui.tanggal(p.created_at)}</td>
          <td data-label="Berat" class="angka">
            ${p.actual_weight === null ? Ui.berat(p.estimated_weight) + ' <span class="kecil samar">(perkiraan)</span>' : Ui.berat(p.actual_weight)}
          </td>
          <td data-label="Total" class="angka">
            ${p.total_price === null ? '<span class="kecil samar">Belum dihitung</span>' : Ui.rupiah(p.total_price)}
          </td>
          <td data-label="Status">${Ui.lencanaStatus(p.status)}</td>
          <td data-label="Aksi">
            <a class="tombol kecil" href="order-detail.html?id=${encodeURIComponent(p.id)}">Detail</a>
          </td>
        </tr>`
      )
      .join('');

    wadah.innerHTML = `<div class="pembungkus-tabel">
      <table class="tabel tabel-responsif">
        <thead>
          <tr>
            <th>ID</th>
            <th>Pelanggan</th>
            <th>Layanan</th>
            <th>Tanggal</th>
            <th class="kanan">Berat</th>
            <th class="kanan">Total</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${baris}</tbody>
      </table>
    </div>
    ${
      adaLagi && !kataCari
        ? `<div style="text-align:center;padding:16px">
            <button type="button" class="tombol sekunder" id="muat-lagi"
              ${memuat ? 'disabled' : ''}>${memuat ? 'Memuat...' : 'Muat lagi'}</button>
          </div>`
        : ''
    }`;

    const tombolLagi = document.getElementById('muat-lagi');
    if (tombolLagi) tombolLagi.addEventListener('click', muatLagi);
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
