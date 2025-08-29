import React, { useContext, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, IconButton, Link, Box } from '@mui/material';
import { Brightness4, Brightness7, Settings } from '@mui/icons-material';
import { ThemeContext } from '../../context/ThemeContext';
import ChangePasswordModal from '../auth/ChangePasswordModal';

const Navbar = () => {
    const navigate = useNavigate();
    const { mode, toggleTheme } = useContext(ThemeContext);
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <>
            <AppBar position="static" color="default" elevation={1}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        <Link component={RouterLink} to="/" color="inherit" underline="none">
                            Smart Attendance
                        </Link>
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {token ? (
                            <>
                                <Typography sx={{ mr: 2 }}>Welcome, {user?.name}</Typography>
                                <Button variant="contained" color="primary" onClick={handleLogout} sx={{ mr: 2 }}>
                                    Logout
                                </Button>
                                <IconButton onClick={() => setPasswordModalOpen(true)} color="inherit">
                                    <Settings />
                                </IconButton>
                            </>
                        ) : (
                            <Button component={RouterLink} to="/login" color="inherit">
                                Login
                            </Button>
                        )}
                        <IconButton sx={{ ml: 1 }} onClick={toggleTheme} color="inherit">
                            {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
                        </IconButton>
                    </Box>
                </Toolbar>
            </AppBar>
            <ChangePasswordModal 
                open={isPasswordModalOpen}
                handleClose={() => setPasswordModalOpen(false)}
            />
        </>
    );
};

export default Navbar;