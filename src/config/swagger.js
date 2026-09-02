'use strict';

const swaggerJsdoc = require('swagger-jsdoc');
const env = require('./env');

const spec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Dynamic QR Management API',
      version: '1.0.0',
      description:
        'REST API for creating stable QR codes that always encode `{website}/r/{code}`. Destination URLs are resolved at scan time from PostgreSQL.'
    },
    servers: [{ url: env.appBaseUrl }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        cookieAuth: { type: 'apiKey', in: 'cookie', name: env.jwt.cookieName }
      },
      schemas: {
        QrCreate: {
          type: 'object',
          required: ['title', 'code', 'redirect_url'],
          properties: {
            title: { type: 'string', example: 'Google QR' },
            code: { type: 'string', example: 'abc1' },
            redirect_url: { type: 'string', example: 'https://google.com' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['ACTIVE', 'DISABLED'] }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }, { cookieAuth: [] }]
  },
  apis: ['./src/config/swagger.js']
});

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Admin login
 *     security: []
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: admin@example.com }
 *               password: { type: string, example: Admin@123 }
 *     responses:
 *       200: { description: JWT issued }
 */
/**
 * @swagger
 * /api/qr:
 *   get:
 *     summary: List QR codes
 *     tags: [QR]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, DISABLED] }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [newest, oldest, scans, title] }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, enum: [10, 25, 50, 100] }
 *     responses:
 *       200: { description: Paginated QR list }
 *   post:
 *     summary: Create QR (encodes website/r/{code} only)
 *     tags: [QR]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/QrCreate' }
 *     responses:
 *       201: { description: Created }
 */
/**
 * @swagger
 * /api/qr/{id}:
 *   get:
 *     summary: Get one QR
 *     tags: [QR]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: QR record }
 *   put:
 *     summary: Update title, description, redirect_url, status (does not regenerate QR payload)
 *     tags: [QR]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     summary: Delete QR
 *     tags: [QR]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Deleted }
 */
/**
 * @swagger
 * /api/qr/{id}/download/{format}:
 *   get:
 *     summary: Download PNG or SVG
 *     tags: [QR]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: format
 *         required: true
 *         schema: { type: string, enum: [png, svg] }
 */
/**
 * @swagger
 * /api/qr/bulk:
 *   post:
 *     summary: Bulk create QR codes
 *     tags: [QR]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items: { $ref: '#/components/schemas/QrCreate' }
 */
/**
 * @swagger
 * /api/qr/import:
 *   post:
 *     summary: Import QR codes from CSV
 *     tags: [QR]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 */
/**
 * @swagger
 * /api/qr/export.csv:
 *   get:
 *     summary: Export QR codes as CSV
 *     tags: [QR]
 */
/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Dashboard cards
 *     tags: [Dashboard]
 */
/**
 * @swagger
 * /api/dashboard/charts:
 *   get:
 *     summary: Dashboard chart data
 *     tags: [Dashboard]
 */
/**
 * @swagger
 * /api/logs:
 *   get:
 *     summary: Scan logs
 *     tags: [Logs]
 */
/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Get settings
 *     tags: [Settings]
 *   put:
 *     summary: Update site name, website URL, timezone, logo
 *     tags: [Settings]
 */
/**
 * @swagger
 * /r/{code}:
 *   get:
 *     summary: Public redirect. Logs scan and 302s to latest redirect_url
 *     security: []
 *     tags: [Redirect]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema: { type: string, example: abc1 }
 *     responses:
 *       302: { description: Redirect to destination }
 *       404: { description: Unknown code }
 *       410: { description: Disabled }
 */

module.exports = spec;
