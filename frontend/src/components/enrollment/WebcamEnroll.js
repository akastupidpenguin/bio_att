import React, { useState } from 'react';
import api from '../../services/api';

const WebcamEnroll = ({ student, closeModal, capturedImage }) => {
    const [error, setError] = useState('');
    const [message, setMessage] = useState('Image received from phone. Click to enroll.');

    const handleEnroll = async () => {
        if (!capturedImage) {
            setError('No image has been captured.');
            return;
        }
        setError('');
        setMessage('Processing...');
        try {
            const base64Image = capturedImage.split(',')[1];
            const res = await api.post('/ai/enroll-face', {
                userId: student._id,
                image: base64Image,
            });
            setMessage(res.data.message);
            setTimeout(closeModal, 2000);
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Enrollment failed. Please try again.';
            setError(errorMessage);
            setMessage('');
        }
    };

    return (
        <div style={modalStyles.overlay}>
            <div style={modalStyles.modal}>
                <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Enroll Face for {student.name}</h2>
                {error && <p style={{ color: 'var(--danger-color)', textAlign: 'center' }}>{error}</p>}
                {message && <p style={{ color: 'var(--success-color)', textAlign: 'center' }}>{message}</p>}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <img src={capturedImage} alt="Captured face" width={480} height={360} style={{ borderRadius: '8px' }} />
                </div>
                <div style={{ textAlign: 'center' }}>
                    <button style={buttonStyles.primary} onClick={handleEnroll}>Enroll This Image</button>
                    <button style={buttonStyles.cancel} onClick={closeModal}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

const modalStyles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { background: 'var(--background-secondary)', padding: '25px', borderRadius: '8px', boxShadow: '0 5px 15px var(--shadow-color)' }
};
const buttonStyles = {
    primary: { backgroundColor: 'var(--accent-color)', color: 'white', marginRight: '1rem' },
    cancel: { backgroundColor: '#ccc', color: 'black' }
};

export default WebcamEnroll;