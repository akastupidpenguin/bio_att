import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import StudentList from './StudentList';
import TakeAttendanceWebcam from '../enrollment/TakeAttendanceWebcam';
import TakeAttendancePhone from '../enrollment/TakeAttendancePhone';
import EditAttendance from '../enrollment/EditAttendance';
import AttendanceHistory from './AttendanceHistory';
import UpcomingClasses from './UpcomingClasses';
import ChoiceModal from '../enrollment/ChoiceModal';
import {
    Container,
    Typography,
    Grid,
    Card,
    CardActionArea,
    CardContent,
    Box,
    Button,
    Tabs,
    Tab,
    TextField,
    CircularProgress,
    Alert,
    Fade,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';

const TeacherDashboard = () => {
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const [loading, setLoading] = useState(true);
    const [attendanceStep, setAttendanceStep] = useState(null);
    const [editingAttendanceId, setEditingAttendanceId] = useState(null);
    const [activeTab, setActiveTab] = useState(0);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [isAttendanceTakenToday, setIsAttendanceTakenToday] = useState(false);
    const [sessionResults, setSessionResults] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchTeacherClasses = async () => {
            try {
                const res = await api.get('/classes/teacher');
                setClasses(res.data);
            } catch (err) {
                setError('Failed to load your classes.');
            } finally {
                setLoading(false);
            }
        };
        fetchTeacherClasses();
    }, []);

    const fetchHistory = useCallback(async () => {
        if (!selectedClass) return;
        try {
            const res = await api.get(`/attendance/class/${selectedClass._id}`);
            setAttendanceHistory(res.data);
        } catch (err) {
            setError('Failed to fetch attendance history.');
        }
    }, [selectedClass]);

    useEffect(() => {
        fetchHistory();
    }, [selectedClass, fetchHistory]);

    useEffect(() => {
        if (attendanceHistory.length > 0) {
            const today = new Date().toLocaleDateString();
            const hasRecordForToday = attendanceHistory.some(
                record => new Date(record.date).toLocaleDateString() === today
            );
            setIsAttendanceTakenToday(hasRecordForToday);
        } else {
            setIsAttendanceTakenToday(false);
        }
    }, [attendanceHistory]);

    const openEditModal = (attendanceId) => {
        setEditingAttendanceId(attendanceId);
        setSessionResults(null);
    };

    const handleSessionEnd = (presentStudentIds) => {
        setSessionResults(presentStudentIds);
        setAttendanceStep(null);
    };

    const handleReviewClose = () => {
        setSessionResults(null);
        setEditingAttendanceId(null);
        fetchHistory();
    };

    const handleExport = async () => {
        if (!selectedClass || !startDate || !endDate) {
            setError('Please select a start and end date for the export.');
            return;
        }
        setExporting(true);
        setError('');
        try {
            const res = await api.get(
                `/attendance/export/${selectedClass._id}?startDate=${startDate}&endDate=${endDate}`,
                { responseType: 'blob' }
            );
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${selectedClass.subjectCode}_attendance.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to export attendance data.');
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Teacher Dashboard
            </Typography>
            <UpcomingClasses userRole="teacher" />
            {error && (
                <Fade in={!!error}>
                    <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                </Fade>
            )}
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Typography variant="h3" gutterBottom sx={{ fontSize: 28 }}>
                        Your Classes
                    </Typography>
                    {classes.length === 0 ? (
                        <Card sx={{ p: 3, textAlign: 'center', mt: 2 }}>
                            <Typography color="text.secondary">No classes assigned.</Typography>
                        </Card>
                    ) : (
                        classes.map(cls => (
                            <CardActionArea
                                key={cls._id}
                                component="div"
                                onClick={() => {
                                    setSelectedClass(cls);
                                    setActiveTab(0);
                                    setError('');
                                }}
                                aria-label={`Select class ${cls.subjectName}`}
                            >
                                <Card
                                    sx={{
                                        mb: 2,
                                        border: selectedClass?._id === cls._id ? '2px solid' : '1px solid',
                                        borderColor: selectedClass?._id === cls._id ? 'primary.main' : 'divider',
                                        boxShadow: selectedClass?._id === cls._id ? 4 : 1,
                                        transition: 'box-shadow 0.2s',
                                    }}
                                >
                                    <CardContent>
                                        <Typography variant="h5">{cls.subjectName}</Typography>
                                        <Typography color="text.secondary">{cls.subjectCode}</Typography>
                                    </CardContent>
                                </Card>
                            </CardActionArea>
                        ))
                    )}
                </Grid>
                <Grid item xs={12} md={8}>
                    {selectedClass ? (
                        <Card sx={{ minHeight: 400 }}>
                            <CardContent>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        mb: 2,
                                        flexWrap: 'wrap',
                                        gap: 2,
                                    }}
                                >
                                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                        {selectedClass.subjectName}
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        onClick={() => setAttendanceStep('choice')}
                                        disabled={isAttendanceTakenToday}
                                        aria-label="Take Attendance"
                                        sx={{ minWidth: 180 }}
                                    >
                                        {isAttendanceTakenToday ? 'Attendance Taken Today' : 'Take Attendance'}
                                    </Button>
                                </Box>
                                <Box
                                    sx={{
                                        bgcolor: 'background.default',
                                        p: 2,
                                        borderRadius: 1,
                                        mb: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    <TextField
                                        label="From"
                                        type="date"
                                        InputLabelProps={{ shrink: true }}
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                        size="small"
                                    />
                                    <TextField
                                        label="To"
                                        type="date"
                                        InputLabelProps={{ shrink: true }}
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                        size="small"
                                    />
                                    <Button
                                        variant="contained"
                                        color="success"
                                        onClick={handleExport}
                                        disabled={!startDate || !endDate || exporting}
                                        startIcon={<DownloadIcon />}
                                        aria-label="Export Attendance"
                                        sx={{ minWidth: 120 }}
                                    >
                                        {exporting ? <CircularProgress size={20} color="inherit" /> : 'Export'}
                                    </Button>
                                </Box>
                                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                    <Tabs
                                        value={activeTab}
                                        onChange={(e, newValue) => setActiveTab(newValue)}
                                        aria-label="Class details tabs"
                                    >
                                        <Tab label="Enrolled Students" />
                                        <Tab label="Attendance History" />
                                    </Tabs>
                                </Box>
                                <Box sx={{ pt: 2 }}>
                                    {activeTab === 0 && (
                                        <StudentList classId={selectedClass._id} />
                                    )}
                                    {activeTab === 1 && (
                                        <AttendanceHistory
                                            history={attendanceHistory}
                                            openEditModal={openEditModal}
                                            refreshHistory={fetchHistory}
                                        />
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card
                            sx={{
                                p: 4,
                                textAlign: 'center',
                                mt: 3,
                                borderRadius: 2,
                                boxShadow: 3,
                                minHeight: 200,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Typography variant="h6" color="text.secondary">
                                Select a class to view its details.
                            </Typography>
                        </Card>
                    )}
                </Grid>
            </Grid>
            {attendanceStep === 'choice' && (
                <ChoiceModal
                    onSelectWebcam={() => setAttendanceStep('webcam')}
                    onSelectPhone={() => setAttendanceStep('phone')}
                    onClose={() => setAttendanceStep(null)}
                />
            )}
            {attendanceStep === 'webcam' && selectedClass && (
                <TakeAttendanceWebcam
                    classId={selectedClass._id}
                    close={() => setAttendanceStep(null)}
                    onSessionEnd={handleSessionEnd}
                />
            )}
            {attendanceStep === 'phone' && selectedClass && (
                <TakeAttendancePhone
                    classId={selectedClass._id}
                    close={() => setAttendanceStep(null)}
                    onSessionEnd={handleSessionEnd}
                />
            )}
            {(sessionResults || editingAttendanceId) && selectedClass && (
                <EditAttendance
                    attendanceId={editingAttendanceId}
                    classId={selectedClass._id}
                    initialPresentIds={sessionResults}
                    close={handleReviewClose}
                />
            )}
        </Container>
    );
};

export default TeacherDashboard;