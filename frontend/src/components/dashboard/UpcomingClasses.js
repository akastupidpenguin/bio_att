import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card, CardContent, Typography, List, ListItem, ListItemText, Box, Divider } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const UpcomingClasses = ({ userRole }) => {
    const [upcomingClasses, setUpcomingClasses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUpcomingClasses = async () => {
            try {
                const endpoint = userRole === 'teacher' ? '/classes/teacher/upcoming' : '/classes/student/upcoming';
                const res = await api.get(endpoint);
                setUpcomingClasses(res.data);
                setLoading(false);
            } catch (err) {
                setLoading(false);
            }
        };
        fetchUpcomingClasses();
    }, [userRole]);

    const getHeaderText = () => {
        if (!upcomingClasses || upcomingClasses.length === 0) return "Upcoming Classes";
        const firstClassDay = upcomingClasses[0].day;
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        return firstClassDay === today ? "Today's Remaining Classes" : `${firstClassDay}'s Classes`;
    };

    return (
        <Card sx={{ mb: 4 }}>
            <CardContent>
                <Typography variant="h5" gutterBottom>{getHeaderText()}</Typography>
                {loading ? (
                    <Typography>Loading schedule...</Typography>
                ) : upcomingClasses.length === 0 ? (
                    <Typography>No classes scheduled in the next 7 days.</Typography>
                ) : (
                    <List dense>
                        {upcomingClasses.map((course, index) => (
                            <ListItem key={index} divider={index < upcomingClasses.length - 1}>
                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', py: 1 }}>
                                    <AccessTimeIcon color="primary" sx={{ mr: 2, fontSize: '2rem' }} />
                                    <ListItemText
                                        primaryTypographyProps={{ variant: 'h6' }}
                                        secondaryTypographyProps={{ variant: 'body2' }}
                                        primary={`${course.time} - ${course.subjectName} (${course.subjectCode})`}
                                        secondary={userRole === 'student' ? `Teacher: ${course.teacherName}` : null}
                                    />
                                </Box>
                            </ListItem>
                        ))}
                    </List>
                )}
            </CardContent>
        </Card>
    );
};
export default UpcomingClasses;