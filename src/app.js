'use strict';

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const env = require('./config/env');
const swaggerSpec = require('./config/swagger');
const Setting = require('./models/Setting');
const { apiLimiter } = require('./middleware/rateLimiter');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const qrRoutes = require('./routes/qrRoutes');
const redirectRoutes = require('./routes/redirectRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const scanLogRoutes = require('./routes/scanLogRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const pageRoutes = require('./routes/pageRoutes');

function createApp() {
  const app = express();

  if (env.trustProxy) {
    app.set('trust proxy', 1);
  }

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '../views'));

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'script-src': ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
          'style-src': ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://fonts.googleapis.com'],
          'font-src': ["'self'", 'https://fonts.gstatic.com', 'https://cdn.jsdelivr.net', 'data:'],
          'img-src': ["'self'", 'data:', 'blob:'],
          'connect-src': ["'self'", 'https://cdn.jsdelivr.net'],
          'frame-src': ["'self'", 'trust:', 'https://link.trustwallet.com'],
          'upgrade-insecure-requests': null
        }
      }
    })
  );
  app.use(cors({ origin: env.appBaseUrl, credentials: true }));
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  app.use('/public', express.static(path.join(__dirname, '../public')));
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  app.use(async (_req, res, next) => {
    try {
      res.locals.settings = (await Setting.get()) || {
        site_name: 'Dynamic QR',
        website_url: env.appBaseUrl,
        logo_path: null,
        timezone: 'UTC'
      };
    } catch {
      res.locals.settings = {
        site_name: 'Dynamic QR',
        website_url: env.appBaseUrl,
        logo_path: null,
        timezone: 'UTC'
      };
    }
    next();
  });

  app.get('/health', (_req, res) => {
    res.json({ success: true, status: 'ok' });
  });

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
  app.get('/docs.json', (_req, res) => res.json(swaggerSpec));

  app.use('/api', apiLimiter);
  app.use('/api', authRoutes);
  app.use('/api/qr', qrRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/logs', scanLogRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/r', redirectRoutes);
  app.use(pageRoutes);

  app.use((req, res) => {
    if (req.path.startsWith('/api')) {
      return notFound(req, res, () => {});
    }
    return res.status(404).render('errors/404', { title: 'Not found', code: null });
  });

  app.use(errorHandler);
  return app;
}

module.exports = createApp;
