import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import api from '../../services/api';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, List, ListItem, ListItemText, Grid } from '@mui/material';

const TakeAttendanceWebcam = ({ classId, close, onSessionEnd }) => {
    const webcamRef = useRef(null);
    const [isSessionActive, setSessionActive] = useState(false);
    const [recognizedStudents, setRecognizedStudents] = useState(new Map());
    const [message, setMessage] = useState('Start the session to begin marking attendance.');
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
        if (!isSessionActive) return;
        const interval = setInterval(async () => {
            if (webcamRef.current) {
                const imageSrc = webcamRef.current.getScreenshot();
                if (!imageSrc) return;
                try {
                    const base64Image = imageSrc.split(',')[1];
                    const res = await api.post('/ai/recognize-live', { classId, image: base64Image });
                    if (res.data.recognized_students.length > 0) {
                        setRecognizedStudents(prev => {
                            const newMap = new Map(prev);
                            res.data.recognized_students.forEach(student => {
                                if (!newMap.has(student._id)) newMap.set(student._id, student.name);
                            });
                            return newMap;
                        });
                    }
                } catch (err) {
                    console.error("Recognition frame failed:", err);
                }
            }
        }, 2000);
        return () => clearInterval(interval);
    }, [isSessionActive, classId]);

    const handleStopSession = () => {
        setSessionActive(false);
        const presentStudentIds = Array.from(recognizedStudents.keys());
        onSessionEnd(presentStudentIds);
    };

    return (
        <Dialog open={true} onClose={close} fullWidth maxWidth="lg">
            <DialogTitle>Live Attendance Session (Webcam)</DialogTitle>
            <DialogContent>
                {message && <Typography color="success.main" align="center">{message}</Typography>}
                <Grid container spacing={2}>
                    <Grid item xs={12} md={8} sx={{ textAlign: 'center' }}>
                        <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" width="100%" style={{ borderRadius: '8px' }} videoConstraints={{ deviceId: deviceId }} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Typography variant="h6">Recognized Students ({recognizedStudents.size})</Typography>
                        <List sx={{ height: '480px', overflowY: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                            {Array.from(recognizedStudents.entries()).map(([id, name]) => <ListItem key={id}><ListItemText primary={name} /></ListItem>)}
                        </List>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                {!isSessionActive ? (
                    <Button variant="contained" onClick={() => { setSessionActive(true); setMessage('Session active...'); }}>Start Session</Button>
                ) : (
                    <Button variant="contained" color="error" onClick={handleStopSession}>Stop & Review</Button>
                )}
                {devices.length > 1 && <Button variant="contained" color="warning" onClick={handleSwitchCamera}>Switch Camera</Button>}
                <Button onClick={close}>Cancel</Button>
            </DialogActions>
        </Dialog>
    );
};
export default TakeAttendanceWebcam;