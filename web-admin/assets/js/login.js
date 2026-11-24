// Halaman login admin.

(function () {
  const form = document.getElementById('form-login');
  const email = document.getElementById('email');
  const password = document.getElementById('password');
  const pesanGalat = document.getElementById('pesan-galat');
  const tombolMasuk = document.getElementById('tombol-masuk');
  const tombolLihat = document.getElementById('lihat-sandi');
  const ikonLihat = document.getElementById('ikon-lihat');

  const PARAM = new URLSearchParams(window.location.search);

  // Pesan dari pengalihan sesi, bukan dari percobaan login.
  if (PARAM.get('kedaluwarsa') === '1') {
    tampilkanInfo(
      'Sesi Anda sudah berakhir. Silakan masuk kembali untuk melanjutkan.',
      false
    );
  } else if (PARAM.get('bukanAdmin') === '1') {
    tampilkanInfo(
      'Akun yang dipakai bukan akun admin. Website ini hanya untuk pengelola laundry.',
      true
    );
  }

  // Sudah memiliki sesi admin: langsung ke dashboard.
  if (Auth.sudahMasuk()) {
    Auth.pastikanAdmin()
      .then(() => window.location.replace('dashboard.html'))
      .catch(() => {
        // Sesi lama tidak sah; biarkan halaman login tampil.
      });
  }

  tombolLihat.addEventListener('click', () => {
    const tersembunyi = password.type === 'password';
    password.type = tersembunyi ? 'text' : 'password';
    ikonLihat.innerHTML = Ui.ikon(tersembunyi ? 'lihat-mati' : 'lihat');
    tombolLihat.setAttribute(
      'aria-label',
      tersembunyi ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'
    );
    tombolLihat.setAttribute('aria-pressed', String(tersembunyi));
  });

  function tampilkanInfo(pesan, bahaya) {
    pesanGalat.textContent = pesan;
    pesanGalat.className = `kotak-info${bahaya ? ' galat' : ''}`;
    pesanGalat.hidden = false;
  }

  function sembunyikanInfo() {
    pesanGalat.hidden = true;
    pesanGalat.textContent = '';
  }

  function tandaiIsian(kotak, adaGalat) {
    kotak.classList.toggle('salah', adaGalat);
  }

  // Validasi sebelum mengirim, supaya kesalahan isian sederhana tidak perlu
  // menunggu balasan server.
  function validasi() {
    const emailKosong = email.value.trim() === '';
    const sandiKosong = password.value === '';

    tandaiIsian(email, emailKosong);
    tandaiIsian(password, sandiKosong);

    if (emailKosong || sandiKosong) {
      tampilkanInfo('Email dan kata sandi wajib diisi.', true);
      (emailKosong ? email : password).focus();
      return false;
    }

    // Cukup memeriksa bentuk dasarnya di sini; aturan lengkap tetap milik
    // backend.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
      tandaiIsian(email, true);
      tampilkanInfo('Format email belum benar. Contoh: nama@email.com.', true);
      email.focus();
      return false;
    }

    return true;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validasi()) return;

    sembunyikanInfo();
    Ui.setSibuk(tombolMasuk, true, 'Memeriksa...');

    try {
      const pengguna = await Auth.masuk(email.value.trim(), password.value);
      Ui.toast(`Selamat datang, ${pengguna.name}.`, 'sukses', 1800);
      // Pengalihan singkat supaya pesan sambutan sempat terbaca.
      setTimeout(() => window.location.replace('dashboard.html'), 450);
    } catch (galat) {
      Ui.setSibuk(tombolMasuk, false);
      tampilkanInfo(
        galat instanceof Api.KesalahanApi
          ? galat.message
          : 'Login gagal. Coba lagi.',
        true
      );
      password.value = '';
      password.focus();
    }
  });

  // Menghapus penanda galat begitu pengguna mulai memperbaiki isian.
  [email, password].forEach((kotak) => {
    kotak.addEventListener('input', () => {
      kotak.classList.remove('salah');
      sembunyikanInfo();
    });
  });
})();
