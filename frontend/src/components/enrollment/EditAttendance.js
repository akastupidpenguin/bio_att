import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Divider,
    Grid,
    Paper,
    List,
    ListItem,
    ListItemText,
    IconButton,
    useTheme,
    CircularProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';

const EditAttendance = ({ attendanceId, classId, initialPresentIds, close }) => {
    const [presentStudents, setPresentStudents] = useState([]);
    const [absentStudents, setAbsentStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const theme = useTheme();

    useEffect(() => {
        const setupAttendance = async () => {
            try {
                if (attendanceId) { // Editing an existing record
                    const res = await api.get(`/attendance/${attendanceId}`);
                    setPresentStudents(res.data.presentStudents);
                    setAbsentStudents(res.data.absentStudents);
                } else { // Reviewing a new session
                    const res = await api.get(`/classes/${classId}/students`);
                    const allStudents = res.data;
                    const present = allStudents.filter(s => initialPresentIds.includes(s._id));
                    const absent = allStudents.filter(s => !initialPresentIds.includes(s._id));
                    setPresentStudents(present);
                    setAbsentStudents(absent);
                }
                setLoading(false);
            } catch (err) {
                console.error("Failed to set up attendance details", err);
                setLoading(false);
            }
        };
        setupAttendance();
    }, [attendanceId, classId, initialPresentIds]);

    const moveToPresent = (student) => {
        setAbsentStudents(absentStudents.filter(s => s._id !== student._id));
        setPresentStudents([...presentStudents, student].sort((a, b) => a.name.localeCompare(b.name)));
    };

    const moveToAbsent = (student) => {
        setPresentStudents(presentStudents.filter(s => s._id !== student._id));
        setAbsentStudents([...absentStudents, student].sort((a, b) => a.name.localeCompare(b.name)));
    };

    const handleSaveChanges = async () => {
        try {
            const presentStudentIds = presentStudents.map(s => s._id);
            if (attendanceId) { // Update existing record
                await api.put(`/attendance/${attendanceId}`, { presentStudents: presentStudentIds });
            } else { // Create new record
                await api.post('/attendance/finalize', { classId, presentStudents: presentStudentIds });
            }
            close();
        } catch (err) {
            console.error("Failed to save changes", err);
            alert(err.response?.data?.msg || "Failed to save changes.");
        }
    };

    return (
        <Dialog open={true} onClose={close} maxWidth="md" fullWidth>
            <DialogTitle sx={{ fontWeight: 600, fontSize: 22, pb: 1, bgcolor: 'grey.900', color: 'grey.100' }}>
                Review & Edit Attendance
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ bgcolor: 'grey.900', p: { xs: 1, sm: 3 } }}>
                <Grid container spacing={3}>
                    {/* Present Students */}
                    <Grid item xs={12} md={6}>
                        <Paper
                            elevation={1}
                            sx={{
                                p: 2,
                                bgcolor: 'grey.800',
                                borderRadius: 2,
                                minHeight: 350,
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            <Typography
                                variant="subtitle1"
                                sx={{
                                    fontWeight: 600,
                                    color: theme.palette.success.main,
                                    mb: 1,
                                    letterSpacing: 0.5,
                                }}
                            >
                                Present ({presentStudents.length})
                            </Typography>
                            <Divider sx={{ mb: 1 }} />
                            <Box sx={{ flex: 1, overflowY: 'auto' }}>
                                <List dense>
                                    {presentStudents.length === 0 ? (
                                        <Typography color="grey.500" align="center" sx={{ mt: 4 }}>
                                            No students marked present yet.
                                        </Typography>
                                    ) : (
                                        presentStudents.map(student => (
                                            <ListItem
                                                key={student._id}
                                                secondaryAction={
                                                    <IconButton
                                                        edge="end"
                                                        color="error"
                                                        aria-label="Mark Absent"
                                                        onClick={() => moveToAbsent(student)}
                                                        sx={{
                                                            bgcolor: 'grey.700',
                                                            '&:hover': { bgcolor: 'error.main', color: 'white' },
                                                        }}
                                                    >
                                                        <PersonRemoveIcon />
                                                    </IconButton>
                                                }
                                                sx={{
                                                    mb: 1,
                                                    borderRadius: 1,
                                                    bgcolor: 'grey.900',
                                                    '&:hover': { bgcolor: 'grey.700' },
                                                }}
                                            >
                                                <ListItemText
                                                    primary={
                                                        <Typography sx={{ color: 'success.main', fontWeight: 500 }}>
                                                            {student.name || student.rollNumber}
                                                        </Typography>
                                                    }
                                                    secondary={student.name && student.rollNumber}
                                                />
                                            </ListItem>
                                        ))
                                    )}
                                </List>
                            </Box>
                        </Paper>
                    </Grid>
                    {/* Absent Students */}
                    <Grid item xs={12} md={6}>
                        <Paper
                            elevation={1}
                            sx={{
                                p: 2,
                                bgcolor: 'grey.800',
                                borderRadius: 2,
                                minHeight: 350,
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            <Typography
                                variant="subtitle1"
                                sx={{
                                    fontWeight: 600,
                                    color: theme.palette.error.main,
                                    mb: 1,
                                    letterSpacing: 0.5,
                                }}
                            >
                                Absent ({absentStudents.length})
                            </Typography>
                            <Divider sx={{ mb: 1 }} />
                            <Box sx={{ flex: 1, overflowY: 'auto' }}>
                                <List dense>
                                    {absentStudents.length === 0 ? (
                                        <Typography color="grey.500" align="center" sx={{ mt: 4 }}>
                                            All students are present.
                                        </Typography>
                                    ) : (
                                        absentStudents.map(student => (
                                            <ListItem
                                                key={student._id}
                                                sx={{
                                                    mb: 1,
                                                    borderRadius: 1,
                                                    bgcolor: 'grey.900',
                                                    '&:hover': { bgcolor: 'grey.800' },
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    px: 2,
                                                }}
                                                disableGutters
                                            >
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography sx={{ color: 'grey.100', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {student.name || student.rollNumber}
                                                    </Typography>
                                                    {student.name && (
                                                        <Typography variant="body2" sx={{ color: 'grey.500' }}>
                                                            {student.rollNumber}
                                                        </Typography>
                                                    )}
                                                </Box>
                                                <Button
                                                    variant="contained"
                                                    color="success"
                                                    size="small"
                                                    onClick={() => moveToPresent(student)}
                                                    sx={{
                                                        fontWeight: 600,
                                                        borderRadius: 2,
                                                        textTransform: 'none',
                                                        boxShadow: 'none',
                                                        ml: 2,
                                                        minWidth: 110,
                                                    }}
                                                >
                                                    Mark Present
                                                </Button>
                                            </ListItem>
                                        ))
                                    )}
                                </List>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </DialogContent>
            <Divider />
            <DialogActions sx={{ px: 3, py: 2, bgcolor: 'grey.900' }}>
                <Button onClick={close} color="success" variant="text" sx={{ fontWeight: 600 }}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSaveChanges}
                    variant="contained"
                    color="success"
                    disabled={loading}
                    sx={{ minWidth: 140, fontWeight: 600 }}
                >
                    {loading ? <CircularProgress size={22} color="inherit" /> : 'Save Changes'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditAttendance;