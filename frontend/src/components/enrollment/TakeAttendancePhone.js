import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, List, ListItem, ListItemText, CircularProgress, Grid } from '@mui/material';

const TakeAttendancePhone = ({ classId, close, onSessionEnd }) => {
    const [qrCode, setQrCode] = useState('');
    const [error, setError] = useState('');
    const [recognizedStudents, setRecognizedStudents] = useState(new Map());
    const liveImageRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        let ws;
        const setupSession = async () => {
            try {
                const res = await api.get('/capture/live-session');
                const { sessionId, qrCodeDataUrl } = res.data;
                setQrCode(qrCodeDataUrl);
                const wsUrl = `wss://${window.location.hostname}:5001`;
                ws = new WebSocket(wsUrl);
                ws.onopen = () => { ws.send(JSON.stringify({ type: 'register_session', payload: sessionId })); };
                ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    if (data.type === 'image_frame') {
                        setIsConnected(true);
                        if (liveImageRef.current) {
                            liveImageRef.current.src = `data:image/jpeg;base64,${data.payload}`;
                        }
                        recognizeFrame(data.payload);
                    }
                };
            } catch (err) {
                setError('Could not create capture session.');
            }
        };
        const recognizeFrame = async (base64Image) => {
            try {
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
        };
        setupSession();
        return () => { if (ws) ws.close(); };
    }, [classId]);

    const handleFinish = () => {
        const presentStudentIds = Array.from(recognizedStudents.keys());
        onSessionEnd(presentStudentIds);
    };

    return (
        <Dialog open={true} onClose={close} fullWidth maxWidth="lg">
            <DialogTitle>Live Attendance via Phone</DialogTitle>
            <DialogContent>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={8} sx={{ textAlign: 'center' }}>
                        {!isConnected ? (
                            <>
                                <Typography variant="h6">Scan with Phone to Start Camera</Typography>
                                {error && <Typography color="error">{error}</Typography>}
                                {qrCode ? <img src={qrCode} alt="Scan to start session" /> : <CircularProgress />}
                            </>
                        ) : (
                            <>
                                <Typography variant="h6">Live Feed from Phone</Typography>
                                <img ref={liveImageRef} alt="Live feed" style={{ width: '100%', height: 'auto', background: '#eee', borderRadius: '8px', border: '2px solid', borderColor: 'primary.main' }} />
                            </>
                        )}
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
                <Button onClick={close}>Cancel</Button>
                <Button onClick={handleFinish} variant="contained" color="error">Stop & Review</Button>
            </DialogActions>
        </Dialog>
    );
};
export default TakeAttendancePhone;