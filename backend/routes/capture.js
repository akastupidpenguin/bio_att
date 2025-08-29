const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const qrcode = require('qrcode');
const crypto = require('crypto');

const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || 'https://localhost:3000';

// This route is for single-image capture (enrollment)
router.get('/session', auth, async (req, res) => {
    const sessionId = crypto.randomBytes(16).toString('hex');
    const captureUrl = `${FRONTEND_BASE_URL}/mobile-capture.html?sessionId=${sessionId}`;
    try {
        const qrCodeDataUrl = await qrcode.toDataURL(captureUrl);
        res.json({ sessionId, qrCodeDataUrl });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// This route is for the new live attendance session
router.get('/live-session', auth, async (req, res) => {
    const sessionId = crypto.randomBytes(16).toString('hex');
    const captureUrl = `${FRONTEND_BASE_URL}/mobile-live.html?sessionId=${sessionId}`;
    try {
        const qrCodeDataUrl = await qrcode.toDataURL(captureUrl);
        res.json({ sessionId, qrCodeDataUrl });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});


router.post('/upload/:sessionId', (req, res) => {
    const sessionId = req.params.sessionId;
    const { image } = req.body;
    const sessions = req.app.get('sessions');
    const teacherWs = sessions.get(sessionId);

    if (teacherWs) {
        teacherWs.send(JSON.stringify({ type: 'image', payload: image }));
        res.json({ msg: 'Image uploaded successfully. You can close this window.' });
    } else {
        res.status(404).json({ msg: 'Session not found or has expired.' });
    }
});

module.exports = router;