import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Container, Box, Card, Typography, TextField, Button, Alert } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School'; // Icon for branding

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { email, password } = formData;

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.msg || 'Login Failed');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Card sx={{ 
            padding: 4, 
            width: '100%', 
            border: '1px solid', 
            borderColor: 'divider',
            boxShadow: (theme) => theme.palette.mode === 'dark' 
                ? `0 0 20px rgba(76, 175, 80, 0.2)` // Green glow for dark mode
                : `0 4px 20px rgba(0, 0, 0, 0.1)`
        }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 1 }}>
                <SchoolIcon color="primary" sx={{ mr: 1 }}/>
                <Typography component="h1" variant="h6" >
                    Smart Attendance
                </Typography>
            </Box>
            <Typography component="h1" variant="h4" align="center" sx={{ fontWeight: 'bold' }}>
                Sign In
            </Typography>
            
            {error && <Alert severity="error" sx={{ mt: 2, mb: 2 }}>{error}</Alert>}

            <Box component="form" onSubmit={onSubmit} noValidate sx={{ mt: 3 }}>
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={onChange}
                />
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type="password"
                    id="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={onChange}
                />
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    color="primary"
                    sx={{ mt: 3, mb: 2, py: 1.5 }}
                >
                    Sign In
                </Button>
            </Box>
        </Card>
      </Box>
    </Container>
  );
};
export default Login;