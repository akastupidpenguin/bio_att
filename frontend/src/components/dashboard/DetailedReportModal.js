import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, List, ListItem, ListItemText, Box, CircularProgress } from '@mui/material';
import EventBusyIcon from '@mui/icons-material/EventBusy';

const DetailedReportModal = ({ course, closeModal }) => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReport = async () => {
            if (!course) return;
            setLoading(true);
            try {
                const res = await api.get(`/attendance/student/${course._id}/report`);
                setReport(res.data);
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch detailed report", err);
                setLoading(false);
            }
        };
        fetchReport();
    }, [course]);

    return (
        <Dialog open={true} onClose={closeModal} fullWidth maxWidth="xs">
            <DialogTitle>
                <Typography variant="h5" component="div">
                    Report for {course.subjectName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {course.subjectCode}
                </Typography>
            </DialogTitle>
            <DialogContent dividers>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    report && (
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" color="text.secondary">Total Absences</Typography>
                            <Typography variant="h2" color="error.main" sx={{ fontWeight: 'bold', my: 1 }}>
                                {report.absentDates.length}
                            </Typography>
                            <Typography variant="h6" color="text.secondary" sx={{ mt: 3 }}>Dates Marked Absent</Typography>
                            {report.absentDates.length > 0 ? (
                                <List dense sx={{ maxHeight: 200, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1, mt: 1 }}>
                                    {report.absentDates.map((date, index) => (
                                        <ListItem key={index}>
                                            <EventBusyIcon color="error" sx={{ mr: 1 }} />
                                            <ListItemText primary={date} />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Typography sx={{ mt: 2 }}>You have a perfect attendance record!</Typography>
                            )}
                        </Box>
                    )
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={closeModal}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default DetailedReportModal;
