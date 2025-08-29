import React from 'react';
import api from '../../services/api';
import { List, ListItem, ListItemText, Typography, Button, Box } from '@mui/material';

const AttendanceHistory = ({ history, openEditModal, refreshHistory }) => {
    const handleDelete = async (attendanceId) => {
        if (window.confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
            try {
                await api.delete(`/attendance/${attendanceId}`);
                refreshHistory();
            } catch (err) {
                alert(err.response?.data?.msg || 'Failed to delete record.');
            }
        }
    };

    return (
        <Box>
            {history.length === 0 ? (
                <Typography>No attendance has been taken for this class yet.</Typography>
            ) : (
                <List>
                    {history.map(record => {
                        const recordDate = new Date(record.date);
                        const threeDaysAgo = new Date();
                        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
                        const isEditable = recordDate > threeDaysAgo;

                        return (
                            <ListItem key={record._id} divider>
                                <ListItemText 
                                    primary={`Date: ${recordDate.toLocaleString()}`}
                                    secondary={
                                        <>
                                            <Typography component="span" sx={{ color: 'success.main' }}>Present: {record.presentStudents.length}</Typography>
                                            <Typography component="span" sx={{ mx: 2, color: 'error.main' }}>Absent: {record.absentStudents.length}</Typography>
                                        </>
                                    }
                                />
                                <Button onClick={() => openEditModal(record._id)} disabled={!isEditable} variant="contained" color="warning" sx={{ mr: 1 }}>
                                    View / Edit
                                </Button>
                                <Button onClick={() => handleDelete(record._id)} disabled={!isEditable} variant="contained" color="error">
                                    Delete
                                </Button>
                            </ListItem>
                        );
                    })}
                </List>
            )}
        </Box>
    );
};
export default AttendanceHistory;