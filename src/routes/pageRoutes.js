'use strict';

const express = require('express');
const pageController = require('../controllers/pageController');
const { requirePageAuth, redirectIfAuthed } = require('../middleware/auth');

const router = express.Router();

router.get('/', redirectIfAuthed, (_req, res) => res.redirect('/login'));
router.get('/login', redirectIfAuthed, pageController.loginPage);
router.get('/dashboard', requirePageAuth, pageController.dashboardPage);
router.get('/qr-codes', requirePageAuth, pageController.qrPage);
router.get('/qr-codes/new', requirePageAuth, pageController.qrFormPage);
router.get('/qr-codes/:id/edit', requirePageAuth, pageController.qrFormPage);
router.get('/qr-codes/:id', requirePageAuth, pageController.qrViewPage);
router.get('/logs', requirePageAuth, pageController.logsPage);
router.get('/settings', requirePageAuth, pageController.settingsPage);

module.exports = router;
