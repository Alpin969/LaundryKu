// Centralized error handler.
//
// Wajib punya empat parameter (err, req, res, next) supaya Express
// mengenalinya sebagai error handler. Dipasang paling akhir di app.js.
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    // Response sudah terkirim sebagian, serahkan ke handler bawaan Express
    // supaya koneksi tidak menggantung.
    return next(err);
  }

  const statusCode = err.statusCode || err.status || 500;

  // Stack lengkap hanya masuk ke log server, tidak pernah ke response HTTP.
  console.error(
    '[error]',
    req.method,
    req.originalUrl,
    '->',
    statusCode,
    '\n',
    err.stack || err.message
  );

  const body = {
    success: false,
    message:
      statusCode === 500
        ? 'Terjadi kesalahan pada server.'
        : err.message || 'Permintaan tidak dapat diproses.',
    error: err.code || (statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR'),
  };

  // Stack trace TIDAK pernah dikirim ke client, karena bisa memuat path server,
  // nama tabel, atau isi query. Detailnya hanya masuk ke log server di atas.
  res.status(statusCode).json(body);
}

module.exports = errorHandler;
