import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import api from '../../services/api';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from '@mui/material';

const WebcamEnrollWithLiveness = ({ onCapture, closeModal }) => {
    const webcamRef = useRef(null);
    const [message, setMessage] = useState('Please look at the camera with your eyes open.');
    const [livenessCheck, setLivenessCheck] = useState('pending');
    const [devices, setDevices] = useState([]);
    const [deviceId, setDeviceId] = useState(null);

    const handleDevices = useCallback(
        mediaDevices =>
            setDevices(mediaDevices.filter(({ kind }) => kind === "videoinput")),
        [setDevices]
    );

    useEffect(() => {
        navigator.mediaDevices.enumerateDevices().then(handleDevices);
    }, [handleDevices]);

    const handleSwitchCamera = useCallback(() => {
        if (devices.length <= 1) return;
        const currentDeviceIndex = devices.findIndex(d => d.deviceId === deviceId);
        const nextDeviceIndex = (currentDeviceIndex + 1) % devices.length;
        setDeviceId(devices[nextDeviceIndex].deviceId);
    }, [devices, deviceId]);

    useEffect(() => {
        if (livenessCheck !== 'pending') return;
        const interval = setInterval(async () => {
            if (webcamRef.current) {
                const imageSrc = webcamRef.current.getScreenshot();
                if (!imageSrc) return;
                try {
                    const base64Image = imageSrc.split(',')[1];
                    const res = await api.post('/ai/check-liveness', { image: base64Image });
                    if (res.data.status === 'BLINK_NOW') setMessage('Blink now!');
                    if (res.data.blink_detected) {
                        setLivenessCheck('success');
                        setMessage('Liveness confirmed! Image captured.');
                        onCapture(`data:image/jpeg;base64,${res.data.live_image}`);
                        clearInterval(interval);
                    }
                } catch (err) {
                    console.error("Liveness check frame failed");
                }
            }
        }, 500);
        return () => clearInterval(interval);
    }, [livenessCheck, onCapture]);

    const getLivenessIndicatorStyle = () => {
        if (livenessCheck === 'success') return { borderColor: 'success.main', boxShadow: `0 0 15px var(--success-color)` };
        return { borderColor: 'warning.main' };
    };

    return (
        <Dialog open={true} onClose={closeModal} maxWidth="sm" fullWidth>
            <DialogTitle>Laptop Webcam Capture</DialogTitle>
            <DialogContent sx={{ textAlign: 'center' }}>
                <Typography color={livenessCheck === 'success' ? 'success.main' : 'text.primary'} sx={{ mb: 2 }}>{message}</Typography>
                <Box sx={{ border: `5px solid`, borderRadius: '8px', display: 'inline-block', ...getLivenessIndicatorStyle() }}>
                    <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" width="100%" style={{ borderRadius: '4px' }} videoConstraints={{ deviceId: deviceId }} />
                </Box>
            </DialogContent>
            <DialogActions>
                {devices.length > 1 && (
                    <Button variant="contained" color="warning" onClick={handleSwitchCamera}>
                        Switch Camera
                    </Button>
                )}
                <Button onClick={closeModal}>Cancel</Button>
            </DialogActions>
        </Dialog>
    );
};
export default WebcamEnrollWithLiveness;