// Konfigurasi alamat backend.
//
// Satu-satunya tempat yang perlu diubah bila alamat API berbeda. Jangan
// menaruh kredensial apa pun di sini: berkas ini dikirim apa adanya ke
// browser.
window.RENOVA = Object.freeze({
  // Alamat backend saat pengembangan.
  API_BASE_URL: 'http://localhost:3000',

  // Token disimpan di sessionStorage supaya hilang saat tab ditutup, dan
  // tidak ikut terbawa ke tab lain.
  TOKEN_KEY: 'renova_admin_token',

  // Nama aplikasi untuk judul halaman dan kepala sidebar.
  APP_NAME: 'RENOVA',
  APP_TAGLINE: 'Laundry Management Platform',
});
