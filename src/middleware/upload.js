'use strict';

const path = require('path');
const multer = require('multer');

const logoStorage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads/logo'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `logo${ext}`);
  }
});

const csvStorage = multer.memoryStorage();

function imageFilter(_req, file, cb) {
  const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('Logo must be PNG, JPG, WEBP, or SVG'));
  }
  cb(null, true);
}

const uploadLogo = multer({
  storage: logoStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 }
});

const uploadCsv = multer({
  storage: csvStorage,
  limits: { fileSize: 2 * 1024 * 1024 }
});

module.exports = { uploadLogo, uploadCsv };
