// Detail pesanan.
//
// Tiga aksi mengubah data, semuanya lewat endpoint ADMIN milik backend:
//   PATCH /api/orders/:id/berat-asli  -> berat + total biaya (dihitung server)
//   PATCH /api/orders/:id/status      -> perpindahan status
//   PATCH /api/orders/:id/bayar       -> konfirmasi pembayaran tunai
//
// Harga akhir TIDAK dihitung di browser: setelah setiap perubahan, seluruh
// data pesanan digambar ulang dari balasan server.

(function () {
  const TAHAPAN = [
    'PENDING_CONFIRMATION',
    'CONFIRMED',
    'WASHING',
    'READY_FOR_PICKUP',
    'COMPLETED',
  ];

  let isi = null;
  let id = null;
  let pesanan = null;
  let galat = null;
  let memuat = true;

  function bacaId() {
    const params = new URLSearchParams(window.location.search);
    const teks = params.get('id');
    return teks && /^\d+$/.test(teks) ? Number(teks) : null;
  }

  async function mulai() {
    id = bacaId();

    const kerangka = await Layout.mulai({
      aktif: 'pesanan',
      judul: 'Detail Pesanan',
      keterangan: 'Periksa data pesanan, isi berat asli, dan ubah statusnya.',
      aksi: `<a class="tombol sekunder" href="orders.html">${Ui.ikon('kembali')} Kembali</a>`,
    });

    isi = kerangka.isi;

    if (id === null) {
      memuat = false;
      galat = 'Nomor pesanan tidak ada pada alamat halaman.';
      gambar();
      return;
    }

    await muatUlang();
  }

  async function muatUlang() {
    memuat = true;
    gambar();

    try {
      const hasil = await Api.permintaan(`/api/orders/${id}`, { privat: true });
      pesanan = hasil && hasil.data ? hasil.data : null;
      galat = pesanan ? null : 'Data pesanan tidak lengkap pada balasan server.';
    } catch (kesalahan) {
      galat =
        kesalahan instanceof Api.KesalahanApi
          ? kesalahan.message
          : 'Detail pesanan gagal dimuat.';
      pesanan = null;
    } finally {
      memuat = false;
      gambar();
    }
  }

  /** Menggambar ulang dari data yang baru dikembalikan server. */
  function pakaiDataBaru(data) {
    if (data) pesanan = data;
    gambar();
  }

  function tahapanHtml() {
    if (pesanan.status === 'CANCELLED') {
      return `<div class="kotak-info galat" style="margin:0">
        Pesanan ini dibatalkan, jadi prosesnya tidak dilanjutkan.
      </div>`;
    }

    const posisi = TAHAPAN.indexOf(pesanan.status);

    return `<div class="garis-waktu">
      ${TAHAPAN.map((kode, i) => {
        const info = Ui.statusInfo(kode);
        const kelas = i < posisi ? 'selesai' : i === posisi ? 'aktif' : '';
        const terakhir = i === TAHAPAN.length - 1;
        return `<div class="tahap ${kelas}">
          <div class="tahap-penanda">
            <div class="tahap-titik">${i < posisi ? Ui.ikon('centang') : ''}</div>
            ${terakhir ? '' : '<div class="tahap-garis"></div>'}
          </div>
          <div class="tahap-teks">${info.label}</div>
        </div>`;
      }).join('')}
    </div>
    <p class="kecil samar" style="margin-top:12px">${Ui.esc(
      Ui.statusInfo(pesanan.status).keterangan
    )}</p>`;
  }

  function fotoHtml() {
    const alamat = Api.alamatFoto(pesanan.photo_url);

    if (!alamat) {
      return `<div class="foto-kosong">
        ${Ui.ikon('foto')}
        <span>Pelanggan belum mengunggah foto pakaian.</span>
      </div>`;
    }

    return `<img class="foto-pesanan" id="foto-pesanan" src="${Ui.esc(
      alamat
    )}" alt="Foto pakaian pesanan #${pesanan.id}" />
      <p class="kecil samar" style="margin-top:8px">Klik foto untuk melihat ukuran penuh.</p>`;
  }

  function aksiStatusHtml() {
    const berikutnya = Ui.TRANSISI[pesanan.status] || [];

    if (!berikutnya.length) {
      return `<div class="kotak-aksi">
        <h3>Tidak ada aksi status</h3>
        <p>Pesanan pada status ini sudah final dan tidak bisa diubah lagi.</p>
      </div>`;
    }

    // Tombol untuk tiap status berikutnya yang diizinkan backend.
    const tombol = berikutnya
      .map((kode) => {
        const bahaya = kode === 'CANCELLED';
        const label = bahaya ? 'Batalkan Pesanan' : `Tandai ${Ui.statusInfo(kode).label}`;
        return `<button type="button" class="tombol ${
          bahaya ? 'bahaya' : 'sekunder'
        } kecil" data-status="${kode}">${label}</button>`;
      })
      .join('');

    return `<div class="kotak-aksi">
      <h3>Ubah status</h3>
      <p>Hanya perpindahan yang diizinkan backend yang ditampilkan di sini.</p>
      <div class="baris-tombol">${tombol}</div>
    </div>`;
  }

  function aksiBeratHtml() {
    if (pesanan.status === 'COMPLETED' || pesanan.status === 'CANCELLED') {
      return '';
    }

    return `<div class="kotak-aksi">
      <h3>Berat asli</h3>
      <p>Isi berat setelah pakaian ditimbang. Total biaya dihitung server dari berat × harga per kg pesanan ini.</p>
      <form id="form-berat" class="flex" style="align-items:stretch">
        <input
          class="isian"
          id="isian-berat"
          type="number"
          inputmode="decimal"
          min="0.01"
          step="0.01"
          placeholder="Contoh: 3.5"
          value="${pesanan.actual_weight === null ? '' : Ui.esc(pesanan.actual_weight)}"
          aria-label="Berat asli dalam kilogram"
          style="flex:1"
        />
        <span class="flex" style="padding:0 4px;color:var(--teks-samar)">kg</span>
        <button type="submit" class="tombol kecil">Simpan berat</button>
      </form>
      <p class="pesan-isian" id="galat-berat"></p>
    </div>`;
  }

  function aksiBayarHtml() {
    if (!pesanan.payment_method) {
      return `<div class="kotak-aksi">
        <h3>Pembayaran</h3>
        <p>Pesanan ini tidak mencatat metode pembayaran, jadi tidak ada pembayaran yang perlu dikonfirmasi.</p>
      </div>`;
    }

    if (pesanan.payment_status === 'PAID') {
      return `<div class="kotak-aksi">
        <h3>Pembayaran</h3>
        <p>Pembayaran sudah dikonfirmasi${
          pesanan.paid_at ? ` pada ${Ui.tanggalWaktu(pesanan.paid_at)}` : ''
        }.</p>
      </div>`;
    }

    return `<div class="kotak-aksi">
      <h3>Pembayaran belum diterima</h3>
      <p>Konfirmasi setelah uang tunai benar-benar diterima. Pesanan tidak bisa diselesaikan sebelum lunas.</p>
      <button type="button" class="tombol kecil" id="tombol-bayar">Konfirmasi Pembayaran</button>
    </div>`;
  }

  function gambar() {
    if (!isi) return;

    if (memuat) {
      isi.innerHTML = `<div class="kartu kartu-isi">${Ui.keadaanMemuat(
        'Memuat detail pesanan...'
      )}</div>`;
      return;
    }

    if (galat || !pesanan) {
      isi.innerHTML = `<div class="kartu kartu-isi">
        ${Ui.keadaanGalat(galat || 'Pesanan tidak ditemukan.')}
        <div style="text-align:center;margin-top:12px">
          <button type="button" class="tombol sekunder" id="coba-lagi">Coba lagi</button>
          <a class="tombol" href="orders.html">Kembali ke daftar</a>
        </div>
      </div>`;
      document.getElementById('coba-lagi').addEventListener('click', muatUlang);
      return;
    }

    const hargaBelumFinal = pesanan.total_price === null;

    isi.innerHTML = `
      <div class="flex-antara" style="margin-bottom:16px;flex-wrap:wrap">
        <div class="flex">
          <span style="font-size:20px;font-weight:800">#${pesanan.id}</span>
          ${Ui.lencanaStatus(pesanan.status)}
          ${Ui.lencanaBayar(pesanan)}
        </div>
        <span class="kecil samar">Dibuat ${Ui.tanggalWaktu(pesanan.created_at)}</span>
      </div>

      <div class="detail-grid">
        <div class="tumpuk">
          <section class="kartu">
            <div class="kartu-isi">
              <div class="kartu-judul">Pelanggan &amp; Layanan</div>
              <div class="baris-detail">
                <span class="label">Nama pelanggan</span>
                <span class="nilai">${Ui.esc(pesanan.customer_name)}</span>
              </div>
              <div class="baris-detail">
                <span class="label">Email</span>
                <span class="nilai">${Ui.esc(pesanan.customer_email)}</span>
              </div>
              <div class="baris-detail">
                <span class="label">Layanan</span>
                <span class="nilai">${Ui.esc(pesanan.service_name)}</span>
              </div>
              <div class="baris-detail">
                <span class="label">Estimasi pengerjaan</span>
                <span class="nilai">${Ui.esc(pesanan.service_duration || '—')}</span>
              </div>
              <div class="baris-detail">
                <span class="label">Harga per kg</span>
                <span class="nilai">${Ui.rupiah(pesanan.price_per_kg)}</span>
              </div>
              <div class="baris-detail">
                <span class="label">Berat perkiraan</span>
                <span class="nilai">${Ui.berat(pesanan.estimated_weight)}</span>
              </div>
              <div class="baris-detail">
                <span class="label">Berat aktual</span>
                <span class="nilai">${
                  pesanan.actual_weight === null
                    ? '<span class="samar">Belum ditimbang</span>'
                    : Ui.berat(pesanan.actual_weight)
                }</span>
              </div>
              <div class="baris-detail penting">
                <span class="label">Total biaya</span>
                <span class="nilai">${
                  hargaBelumFinal ? '<span class="samar kecil">Belum dihitung</span>' : Ui.rupiah(pesanan.total_price)
                }</span>
              </div>
              <div class="baris-detail">
                <span class="label">Metode pembayaran</span>
                <span class="nilai">${Ui.metodeLabel(pesanan.payment_method)}</span>
              </div>
            </div>
          </section>

          <section class="kartu">
            <div class="kartu-isi">
              <div class="kartu-judul">Foto Pakaian</div>
              ${fotoHtml()}
            </div>
          </section>
        </div>

        <div class="tumpuk">
          <section class="kartu">
            <div class="kartu-isi">
              <div class="kartu-judul">Tahapan Pesanan</div>
              ${tahapanHtml()}
            </div>
          </section>

          ${aksiBeratHtml()}
          ${aksiBayarHtml()}
          ${aksiStatusHtml()}
        </div>
      </div>`;

    pasangAksi();
  }

  function pasangAksi() {
    // Foto: buka ukuran penuh di tab baru.
    const foto = document.getElementById('foto-pesanan');
    if (foto) {
      foto.addEventListener('click', () => window.open(foto.src, '_blank', 'noopener'));
      foto.addEventListener('error', () => {
        foto.replaceWith(
          Object.assign(document.createElement('div'), {
            className: 'foto-kosong',
            textContent: 'Foto tidak bisa dimuat. Berkasnya mungkin sudah dihapus.',
          })
        );
      });
    }

    const formBerat = document.getElementById('form-berat');
    if (formBerat) {
      formBerat.addEventListener('submit', async (e) => {
        e.preventDefault();

        const isian = document.getElementById('isian-berat');
        const galatBerat = document.getElementById('galat-berat');
        const nilai = Number(String(isian.value).replace(',', '.'));

        galatBerat.textContent = '';
        isian.classList.remove('salah');

        if (!isian.value.trim() || Number.isNaN(nilai) || nilai <= 0) {
          galatBerat.textContent = 'Berat harus lebih besar dari 0 kg.';
          isian.classList.add('salah');
          isian.focus();
          return;
        }

        const tombol = formBerat.querySelector('button[type="submit"]');
        Ui.setSibuk(tombol, true, 'Menyimpan...');

        try {
          const hasil = await Api.permintaan(`/api/orders/${id}/berat-asli`, {
            method: 'PATCH',
            privat: true,
            body: { actual_weight: nilai },
          });
          Ui.toast(hasil.message || 'Berat asli berhasil disimpan.', 'sukses');
          pakaiDataBaru(hasil.data);
        } catch (kesalahan) {
          Ui.setSibuk(tombol, false);
          hasilGalat(kesalahan, galatBerat);
        }
      });
    }

    const tombolBayar = document.getElementById('tombol-bayar');
    if (tombolBayar) {
      tombolBayar.addEventListener('click', async () => {
        const setuju = await Ui.konfirmasi({
          judul: 'Konfirmasi pembayaran?',
          pesan: `Pembayaran ${Ui.metodeLabel(
            pesanan.payment_method
          )} untuk pesanan #${pesanan.id} akan ditandai lunas. Tindakan ini tidak bisa dibatalkan.`,
          labelLanjut: 'Ya, sudah diterima',
        });
        if (!setuju) return;

        Ui.setSibuk(tombolBayar, true, 'Mengonfirmasi...');

        try {
          const hasil = await Api.permintaan(`/api/orders/${id}/bayar`, {
            method: 'PATCH',
            privat: true,
          });
          Ui.toast(hasil.message || 'Pembayaran dikonfirmasi.', 'sukses');
          pakaiDataBaru(hasil.data);
        } catch (kesalahan) {
          Ui.setSibuk(tombolBayar, false);
          Ui.toast(
            kesalahan instanceof Api.KesalahanApi
              ? kesalahan.message
              : 'Konfirmasi pembayaran gagal.',
            'gagal'
          );
        }
      });
    }

    document.querySelectorAll('[data-status]').forEach((tombol) => {
      tombol.addEventListener('click', async () => {
        const statusBaru = tombol.dataset.status;
        const info = Ui.statusInfo(statusBaru);
        const membatalkan = statusBaru === 'CANCELLED';

        const setuju = await Ui.konfirmasi({
          judul: membatalkan ? 'Batalkan pesanan?' : `Ubah status ke "${info.label}"?`,
          pesan: membatalkan
            ? `Pesanan #${pesanan.id} akan dibatalkan dan tidak diproses lagi. Tindakan ini tidak bisa dibatalkan.`
            : `Pesanan #${pesanan.id} akan dipindahkan ke status "${info.label}".`,
          labelLanjut: membatalkan ? 'Ya, batalkan' : 'Ubah status',
          bahaya: membatalkan,
        });
        if (!setuju) return;

        Ui.setSibuk(tombol, true, 'Menyimpan...');

        try {
          const hasil = await Api.permintaan(`/api/orders/${id}/status`, {
            method: 'PATCH',
            privat: true,
            body: { status: statusBaru },
          });
          Ui.toast(hasil.message || 'Status berhasil diubah.', 'sukses');
          pakaiDataBaru(hasil.data);
        } catch (kesalahan) {
          Ui.setSibuk(tombol, false);
          Ui.toast(
            kesalahan instanceof Api.KesalahanApi
              ? kesalahan.message
              : 'Status gagal diubah.',
            'gagal'
          );
        }
      });
    });
  }

  function hasilGalat(kesalahan, tempat) {
    const pesan =
      kesalahan instanceof Api.KesalahanApi
        ? kesalahan.message
        : 'Permintaan gagal diproses.';

    if (tempat) tempat.textContent = pesan;
    Ui.toast(pesan, 'gagal');
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
