import React, { useState } from 'react';
import api from '../../services/api';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Alert,
    CircularProgress,
    Box,
    IconButton,
    InputAdornment,
    Typography,
    Divider,
    Fade,
} from '@mui/material';
import { Visibility, VisibilityOff, LockReset } from '@mui/icons-material';

const ChangePasswordModal = ({ open, handleClose }) => {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
    });
    const [showPassword, setShowPassword] = useState({
        current: false,
        new: false,
        confirm: false,
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const { currentPassword, newPassword, confirmNewPassword } = formData;

    const onChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleClickShowPassword = (field) => {
        setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmNewPassword) {
            setError('New passwords do not match.');
            return;
        }
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            const res = await api.post('/auth/change-password', {
                currentPassword,
                newPassword,
            });
            setSuccess(res.data.msg);
            setTimeout(() => {
                handleClose();
                setSuccess('');
                setFormData({
                    currentPassword: '',
                    newPassword: '',
                    confirmNewPassword: '',
                });
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to update password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="xs"
            PaperProps={{
                sx: { borderRadius: 3, p: 0, overflow: 'hidden' },
            }}
            TransitionComponent={Fade}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', p: 2, pb: 0 }}>
                <LockReset color="primary" sx={{ mr: 1 }} />
                <DialogTitle sx={{ p: 0, fontWeight: 600, fontSize: 20, flex: 1 }}>
                    Change Password
                </DialogTitle>
            </Box>
            <Divider />
            <DialogContent sx={{ pt: 2, pb: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    For your security, please enter your current password and choose a new one.
                </Typography>
                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    noValidate
                    sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                >
                    {error && (
                        <Alert severity="error" sx={{ mb: 1 }}>
                            {error}
                        </Alert>
                    )}
                    {success && (
                        <Alert severity="success" sx={{ mb: 1 }}>
                            {success}
                        </Alert>
                    )}
                    <TextField
                        name="currentPassword"
                        label="Current Password"
                        type={showPassword.current ? 'text' : 'password'}
                        fullWidth
                        variant="outlined"
                        value={currentPassword}
                        onChange={onChange}
                        autoFocus
                        required
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle current password visibility"
                                        onClick={() => handleClickShowPassword('current')}
                                        onMouseDown={handleMouseDownPassword}
                                        edge="end"
                                        size="small"
                                    >
                                        {showPassword.current ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        name="newPassword"
                        label="New Password"
                        type={showPassword.new ? 'text' : 'password'}
                        fullWidth
                        variant="outlined"
                        value={newPassword}
                        onChange={onChange}
                        required
                        helperText="At least 8 characters, with a mix of letters and numbers."
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle new password visibility"
                                        onClick={() => handleClickShowPassword('new')}
                                        onMouseDown={handleMouseDownPassword}
                                        edge="end"
                                        size="small"
                                    >
                                        {showPassword.new ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        name="confirmNewPassword"
                        label="Confirm New Password"
                        type={showPassword.confirm ? 'text' : 'password'}
                        fullWidth
                        variant="outlined"
                        value={confirmNewPassword}
                        onChange={onChange}
                        required
                        helperText="Re-enter your new password."
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle confirm password visibility"
                                        onClick={() => handleClickShowPassword('confirm')}
                                        onMouseDown={handleMouseDownPassword}
                                        edge="end"
                                        size="small"
                                    >
                                        {showPassword.confirm ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
                <Button onClick={handleClose} color="inherit" disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                    sx={{ minWidth: 150 }}
                >
                    {loading ? <CircularProgress size={22} /> : 'Update Password'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ChangePasswordModal;