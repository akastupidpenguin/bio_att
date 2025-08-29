import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Container, Typography, Button, Box } from '@mui/material';

const Landing = () => {
  return (
    <Container maxWidth="md">
        <Box sx={{ my: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <Typography variant="h5" component="h1" color="text.secondary" gutterBottom>
                Welcome to the
            </Typography>
            <Typography variant="h2" component="h1" sx={{ fontWeight: 'bold' }} gutterBottom>
                Smart Attendance System
            </Typography>
            <Typography variant="h6" color="text.secondary" paragraph>
                Automate and enhance your classroom attendance management with AI.
            </Typography>
            <Button component={RouterLink} to="/login" variant="contained" size="large" sx={{ mt: 4 }}>
                Get Started
            </Button>
        </Box>
    </Container>
  );
};
export default Landing;
