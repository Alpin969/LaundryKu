// Utilitas tampilan bersama: format angka/tanggal, lencana status, toast,
// dialog konfirmasi, dan kumpulan ikon.
//
// Dikumpulkan di satu tempat supaya semua halaman memakai istilah dan warna
// status yang sama persis.

(function () {
  const IKON = {
    dashboard:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
    pesanan:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6v3H9z"/><path d="M6 6h12a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"/><path d="M9 12h6M9 16h4"/></svg>',
    layanan:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.6"/><path d="M8.5 8.5l1.6 1.6M15.5 15.5l-1.6-1.6M8.5 15.5l1.6-1.6M15.5 8.5l-1.6 1.6"/></svg>',
    pengaturan:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    keluar:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>',
    menu: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
    cari: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    tambah:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    ubah: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
    hapus:
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>',
    lihat:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 12S5 5.5 12 5.5 22.5 12 22.5 12 19 18.5 12 18.5 1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    'lihat-mati':
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18"/><path d="M10.6 6.2A9.9 9.9 0 0 1 12 6c7 0 10.5 6 10.5 6a17.6 17.6 0 0 1-3.6 4.1"/><path d="M6.3 6.4C3.4 8.3 1.5 12 1.5 12S5 18 12 18a10 10 0 0 0 4.2-.9"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
    foto: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="m21 16-5-5L5 20"/></svg>',
    kembali:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
    centang:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    silang:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
    peringatan:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
    jam: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    berat:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l2.5 13h-17z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>',
    uang: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 10v4M18 10v4"/></svg>',
    pengguna:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    kotak: '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/></svg>',
    segarkan:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/></svg>',
  };

  const STATUS = {
    PENDING_CONFIRMATION: {
      label: 'Menunggu Konfirmasi',
      kelas: 'menunggu',
      keterangan: 'Pesanan baru masuk dan menunggu dikonfirmasi admin.',
      urut: 0,
    },
    CONFIRMED: {
      label: 'Dikonfirmasi',
      kelas: 'dikonfirmasi',
      keterangan: 'Pesanan sudah diterima dan akan segera diproses.',
      urut: 1,
    },
    WASHING: {
      label: 'Sedang Dicuci',
      kelas: 'dicuci',
      keterangan: 'Pakaian sedang dalam proses pencucian.',
      urut: 2,
    },
    READY_FOR_PICKUP: {
      label: 'Siap Diambil',
      kelas: 'siap',
      keterangan: 'Pakaian sudah selesai dan siap diambil pelanggan.',
      urut: 3,
    },
    COMPLETED: {
      label: 'Selesai',
      kelas: 'selesai',
      keterangan: 'Pesanan sudah diambil dan transaksi tuntas.',
      urut: 4,
    },
    CANCELLED: {
      label: 'Dibatalkan',
      kelas: 'batal',
      keterangan: 'Pesanan dibatalkan dan tidak diproses.',
      urut: 5,
    },
  };

  // Urutan perpindahan status mengikuti aturan backend.
  const TRANSISI = {
    PENDING_CONFIRMATION: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['WASHING', 'CANCELLED'],
    WASHING: ['READY_FOR_PICKUP', 'CANCELLED'],
    READY_FOR_PICKUP: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
  };

  const METODE = {
    CASH: 'Tunai',
    QRIS: 'QRIS',
    BANK_TRANSFER: 'Transfer Bank',
    EWALLET: 'E-Wallet',
  };

  const BULAN = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  function ikon(nama) {
    return IKON[nama] || '';
  }

  function rupiah(nilai) {
    const angka = Number(nilai);
    if (nilai === null || nilai === undefined || Number.isNaN(angka)) {
      return '—';
    }

    return 'Rp ' + angka.toLocaleString('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  function angka(nilai, digit = 2) {
    const n = Number(nilai);
    if (nilai === null || nilai === undefined || Number.isNaN(n)) return '—';
    return n.toLocaleString('id-ID', { maximumFractionDigits: digit });
  }

  function berat(nilai) {
    if (nilai === null || nilai === undefined) return '—';
    return `${angka(nilai)} kg`;
  }

  function tanggal(nilai) {
    if (!nilai) return '—';
    const d = new Date(nilai);
    if (Number.isNaN(d.getTime())) return '—';
    return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
  }

  function tanggalWaktu(nilai) {
    if (!nilai) return '—';
    const d = new Date(nilai);
    if (Number.isNaN(d.getTime())) return '—';
    const jam = String(d.getHours()).padStart(2, '0');
    const menit = String(d.getMinutes()).padStart(2, '0');
    return `${tanggal(nilai)}, ${jam}.${menit}`;
  }

  function statusInfo(status) {
    return (
      STATUS[status] || {
        label: status || 'Tidak diketahui',
        kelas: 'netral',
        keterangan: '',
        urut: 99,
      }
    );
  }

  function lencanaStatus(status) {
    const info = statusInfo(status);
    return `<span class="lencana ${info.kelas}">${esc(info.label)}</span>`;
  }

  function lencanaBayar(pesanan) {
    if (!pesanan.payment_method) {
      return '<span class="lencana netral">Tidak dicatat</span>';
    }

    if (pesanan.payment_status === 'PAID') {
      return '<span class="lencana lunas">Lunas</span>';
    }

    return '<span class="lencana belum">Belum Dibayar</span>';
  }

  function metodeLabel(metode) {
    return metode ? METODE[metode] || metode : '—';
  }

  // Mencegah teks dari database terbaca sebagai HTML.
  function esc(teks) {
    return String(teks === null || teks === undefined ? '' : teks)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ---------- Toast ----------

  function wadahToast() {
    let wadah = document.querySelector('.wadah-toast');
    if (!wadah) {
      wadah = document.createElement('div');
      wadah.className = 'wadah-toast';
      wadah.setAttribute('role', 'status');
      wadah.setAttribute('aria-live', 'polite');
      document.body.appendChild(wadah);
    }
    return wadah;
  }

  function toast(pesan, jenis = 'info', durasi = 3600) {
    const wadah = wadahToast();
    const kotak = document.createElement('div');
    kotak.className = `toast ${jenis}`;

    const ikonJenis =
      jenis === 'sukses' ? 'centang' : jenis === 'gagal' ? 'peringatan' : 'info';

    kotak.innerHTML = `${ikon(ikonJenis)}<span>${esc(pesan)}</span>`;
    wadah.appendChild(kotak);

    setTimeout(() => {
      kotak.style.opacity = '0';
      kotak.style.transition = 'opacity .2s';
      setTimeout(() => kotak.remove(), 220);
    }, durasi);
  }

  // ---------- Dialog konfirmasi ----------

  function konfirmasi({ judul, pesan, labelLanjut = 'Lanjutkan', bahaya = false }) {
    return new Promise((selesai) => {
      const dialog = document.createElement('dialog');
      dialog.className = 'dialog';
      dialog.innerHTML = `
        <div class="dialog-isi">
          <div class="dialog-judul">${esc(judul)}</div>
          <p class="dialog-teks">${esc(pesan)}</p>
          <div class="dialog-aksi">
            <button type="button" class="tombol sekunder" data-batal>Batal</button>
            <button type="button" class="tombol ${
              bahaya ? 'bahaya' : ''
            }" data-lanjut>${esc(labelLanjut)}</button>
          </div>
        </div>`;

      document.body.appendChild(dialog);

      const tutup = (hasil) => {
        dialog.close();
        dialog.remove();
        selesai(hasil);
      };

      dialog.querySelector('[data-batal]').addEventListener('click', () => tutup(false));
      dialog.querySelector('[data-lanjut]').addEventListener('click', () => tutup(true));
      dialog.addEventListener('cancel', (e) => {
        e.preventDefault();
        tutup(false);
      });

      dialog.showModal();
      dialog.querySelector('[data-lanjut]').focus();
    });
  }

  // ---------- Keadaan memuat / kosong / galat ----------

  function keadaanMemuat(pesan = 'Memuat data...') {
    return `<div class="keadaan"><div class="pemuat"></div><span>${esc(pesan)}</span></div>`;
  }

  function keadaanKosong(judul, pesan) {
    return `<div class="keadaan">
      <div class="keadaan-ikon">${ikon('kotak')}</div>
      <div class="keadaan-judul">${esc(judul)}</div>
      <div>${esc(pesan)}</div>
    </div>`;
  }

  function keadaanGalat(pesan) {
    return `<div class="keadaan galat">
      <div class="keadaan-ikon">${ikon('peringatan')}</div>
      <div class="keadaan-judul">Data gagal dimuat</div>
      <div>${esc(pesan)}</div>
    </div>`;
  }

  // Tombol "sesuai" untuk isian yang sedang disimpan, supaya klik ganda tidak
  // mengirim dua permintaan.
  function setSibuk(tombol, sibuk, teksSibuk = 'Memproses...') {
    if (!tombol) return;
    if (sibuk) {
      tombol.dataset.teksAsli = tombol.innerHTML;
      tombol.disabled = true;
      tombol.innerHTML = `<span class="pemuat" style="width:15px;height:15px;border-width:2px"></span> ${esc(
        teksSibuk
      )}`;
    } else {
      tombol.disabled = false;
      if (tombol.dataset.teksAsli) {
        tombol.innerHTML = tombol.dataset.teksAsli;
        delete tombol.dataset.teksAsli;
      }
    }
  }

  window.Ui = {
    ikon,
    rupiah,
    angka,
    berat,
    tanggal,
    tanggalWaktu,
    statusInfo,
    lencanaStatus,
    lencanaBayar,
    metodeLabel,
    esc,
    toast,
    konfirmasi,
    keadaanMemuat,
    keadaanKosong,
    keadaanGalat,
    setSibuk,
    STATUS,
    TRANSISI,
    METODE,
  };
})();
