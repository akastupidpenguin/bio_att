import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import ChoiceModal from '../enrollment/ChoiceModal';
import WebcamEnrollWithLiveness from '../enrollment/WebcamEnrollWithLiveness';
import QrCodeModal from '../enrollment/QrCodeModal';
import EnrollmentReview from '../enrollment/EnrollmentReview';
import { List, ListItem, ListItemText, Button, Box, TextField, Alert, Typography, IconButton } from '@mui/material';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';

const StudentList = ({ classId }) => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [enrollmentStep, setEnrollmentStep] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [rollNumbers, setRollNumbers] = useState('');
    const [addError, setAddError] = useState('');
    const [addSuccess, setAddSuccess] = useState('');
    const [presentStudents, setPresentStudents] = useState([]);

    const fetchStudents = useCallback(async () => {
        if (!classId) return;
        setLoading(true);
        try {
            const res = await api.get(`/classes/${classId}/students`);
            setStudents(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch students", err);
            setLoading(false);
        }
    }, [classId]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    const startEnrollment = (student) => {
        setSelectedStudent(student);
        setEnrollmentStep('choice');
    };

    const handleCapture = (imageBase64) => {
        setCapturedImage(imageBase64);
        setEnrollmentStep('review');
    };

    const closeAllModals = () => {
        setSelectedStudent(null);
        setEnrollmentStep(null);
        setCapturedImage(null);
        fetchStudents();
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        setAddError('');
        setAddSuccess('');
        const rollNumbersArray = rollNumbers.split(',').map(num => num.trim()).filter(num => num !== '');
        if (rollNumbersArray.length === 0) {
            setAddError('Please enter at least one roll number.');
            return;
        }
        try {
            const res = await api.post(`/classes/${classId}/enroll_manual`, { rollNumbers: rollNumbersArray });
            setStudents(res.data.students);
            const { success, failed } = res.data.report;
            let successMsg = success.length > 0 ? `Successfully enrolled: ${success.join(', ')}.` : '';
            setAddSuccess(successMsg);
            if (failed.length > 0) {
                setAddError(`Failed to enroll: ${failed.join('; ')}.`);
            } else {
                setShowAddForm(false);
                setRollNumbers('');
            }
        } catch (err) {
            setAddError(err.response?.data?.msg || 'Failed to add students.');
        }
    };

    const onMarkAbsent = async (student) => {
        // Implement the mark absent functionality here
    };

    if (loading) return <p>Loading students...</p>;

    return (
        <div>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Enrolled Students</Typography>
                <Button variant="contained" onClick={() => setShowAddForm(!showAddForm)}>
                    {showAddForm ? 'Cancel' : '+ Add Student(s)'}
                </Button>
            </Box>

            {showAddForm && (
                <Box component="form" onSubmit={handleAddStudent} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, mb: 2 }}>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        value={rollNumbers}
                        onChange={(e) => setRollNumbers(e.target.value)}
                        label="Student Roll Numbers"
                        placeholder="Enter roll numbers, separated by commas..."
                        sx={{ mb: 2 }}
                    />
                    <Button type="submit" variant="contained" color="success">Enroll Students</Button>
                    {addSuccess && <Alert severity="success" sx={{ mt: 1 }}>{addSuccess}</Alert>}
                    {addError && <Alert severity="error" sx={{ mt: 1 }}>{addError}</Alert>}
                </Box>
            )}

            {students.length === 0 ? (
                <Typography>No students are enrolled in this class yet.</Typography>
            ) : (
                <List>
                    {students.map(student => (
                        <ListItem key={student._id} divider secondaryAction={
                            <Button variant="contained" color={student.isEnrolled ? "warning" : "primary"} onClick={() => startEnrollment(student)}>
                                {student.isEnrolled ? 'Re-enroll Face' : 'Enroll Face'}
                            </Button>
                        }>
                            <ListItemText primary={student.name} secondary={student.email} />
                        </ListItem>
                    ))}
                </List>
            )}
            {enrollmentStep === 'choice' && ( <ChoiceModal onSelectWebcam={() => setEnrollmentStep('webcam')} onSelectPhone={() => setEnrollmentStep('qrcode')} onClose={closeAllModals} /> )}
            {enrollmentStep === 'webcam' && ( <WebcamEnrollWithLiveness onCapture={handleCapture} closeModal={closeAllModals} /> )}
            {enrollmentStep === 'qrcode' && ( <QrCodeModal onCapture={handleCapture} closeModal={closeAllModals} /> )}
            {enrollmentStep === 'review' && ( <EnrollmentReview student={selectedStudent} capturedImage={capturedImage} closeModal={closeAllModals} /> )}

            <List dense>
                {presentStudents.length === 0 ? (
                    <Typography color="grey.500" align="center" sx={{ mt: 4 }}>
                        No students marked present yet.
                    </Typography>
                ) : (
                    presentStudents.map(student => (
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
                                <Typography sx={{ color: 'success.main', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {student.name || student.rollNumber}
                                </Typography>
                                {student.name && (
                                    <Typography variant="body2" sx={{ color: 'grey.500' }}>
                                        {student.rollNumber}
                                    </Typography>
                                )}
                            </Box>
                            <IconButton
                                edge="end"
                                color="error"
                                aria-label="Mark Absent"
                                onClick={() => onMarkAbsent(student)}
                                sx={{
                                    bgcolor: 'grey.700',
                                    '&:hover': { bgcolor: 'error.main', color: 'white' },
                                    ml: 2,
                                }}
                            >
                                <PersonRemoveIcon />
                            </IconButton>
                        </ListItem>
                    ))
                )}
            </List>
        </div>
    );
};
export default StudentList;