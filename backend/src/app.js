// Menyusun aplikasi Express: keamanan, parser, route, lalu handler error.
// Berkas ini hanya membuat aplikasi; menjalankannya ada di server.js.
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const healthRoutes = require('./routes/health.routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Menyembunyikan header "X-Powered-By: Express" dari response.
app.disable('x-powered-by');

// Helmet menambah header keamanan standar pada setiap response.
app.use(helmet());

// CORS: pada tahap pengembangan website admin dan aplikasi Flutter boleh
// mengakses API dari mana saja. Batasi origin-nya saat sudah di-deploy.
app.use(cors());

// Parser JSON dengan batas ukuran agar body raksasa tidak dihabiskan di memori.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// GET /
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'LaundryKu REST API is running',
  });
});

// Endpoint pemeriksaan kondisi server dan database.
app.use('/api/health', healthRoutes);

// URL tidak dikenal -> 404, lalu error lain -> error handler.
app.use(notFound);
app.use(errorHandler);

module.exports = app;
