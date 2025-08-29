import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

const ChoiceModal = ({ onSelectWebcam, onSelectPhone, onClose }) => {
    return (
        <Dialog open={true} onClose={onClose}>
            <DialogTitle>Choose Capture Method</DialogTitle>
            <DialogContent sx={{ display: 'flex', gap: 2, justifyContent: 'center', p: 4 }}>
                <Button variant="contained" onClick={onSelectWebcam}>Use Laptop Webcam</Button>
                <Button variant="contained" onClick={onSelectPhone}>Use Phone Camera</Button>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
            </DialogActions>
        </Dialog>
    );
};
export default ChoiceModal;