import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress, Typography } from '@mui/material';

const QrCodeModal = ({ onCapture, closeModal }) => {
    const [qrCode, setQrCode] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        let ws;
        const setupSession = async () => {
            try {
                const res = await api.get('/capture/session');
                const { sessionId, qrCodeDataUrl } = res.data;
                setQrCode(qrCodeDataUrl);
                const wsUrl = `wss://${window.location.hostname}:5001`;
                ws = new WebSocket(wsUrl);
                ws.onopen = () => { ws.send(sessionId); };
                ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    if (data.type === 'image') {
                        onCapture(`data:image/jpeg;base64,${data.payload}`);
                    }
                };
                ws.onerror = () => { setError('Real-time connection failed. Please try again.'); };
            } catch (err) {
                setError('Could not create capture session.');
            }
        };
        setupSession();
        return () => { if (ws) ws.close(); };
    }, [onCapture]);

    return (
        <Dialog open={true} onClose={closeModal}>
            <DialogTitle>Scan with your Phone</DialogTitle>
            <DialogContent sx={{ textAlign: 'center' }}>
                {error && <Typography color="error">{error}</Typography>}
                {qrCode ? (
                    <img src={qrCode} alt="Scan to capture" />
                ) : (
                    <CircularProgress />
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={closeModal}>Cancel</Button>
            </DialogActions>
        </Dialog>
    );
};
export default QrCodeModal;