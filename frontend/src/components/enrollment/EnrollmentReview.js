import React, { useState } from 'react';
import api from '../../services/api';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, CircularProgress } from '@mui/material';

const EnrollmentReview = ({ student, closeModal, capturedImage }) => {
    const [error, setError] = useState('');
    const [message, setMessage] = useState('Image received. Click to enroll.');
    const [loading, setLoading] = useState(false);

    const handleEnroll = async () => {
        if (!capturedImage) {
            setError('No image has been captured.');
            return;
        }
        setError('');
        setMessage('Processing and checking for duplicates...');
        setLoading(true);
        try {
            const base64Image = capturedImage.split(',')[1];
            const res = await api.post('/ai/enroll-face', {
                userId: student._id,
                image: base64Image,
            });
            setMessage(res.data.message);
            setTimeout(closeModal, 2500);
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Enrollment failed. Please try again.';
            setError(errorMessage);
            setMessage('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={true} onClose={closeModal} maxWidth="md">
            <DialogTitle>Review & Enroll for {student.name}</DialogTitle>
            <DialogContent sx={{ textAlign: 'center' }}>
                {error && <Typography color="error">{error}</Typography>}
                {message && <Typography color="success.main">{message}</Typography>}
                <Box sx={{ my: 2 }}>
                    <img src={capturedImage} alt="Captured face" width={480} height={360} style={{ borderRadius: '8px' }} />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={closeModal}>Cancel</Button>
                <Button onClick={handleEnroll} variant="contained" disabled={loading}>
                    {loading ? <CircularProgress size={24} /> : 'Enroll This Image'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
export default EnrollmentReview;