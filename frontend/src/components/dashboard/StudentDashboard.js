import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import UpcomingClasses from './UpcomingClasses';
import DetailedReportModal from './DetailedReportModal';
import { Container, Typography, Grid, Card, CardContent, Box, CircularProgress, Button } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';

const StudentDashboard = () => {
  const [classes, setClasses] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourseForReport, setSelectedCourseForReport] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const classRes = await api.get('/classes/student');
        setClasses(classRes.data);
        const attendancePromises = classRes.data.map(cls => api.get(`/attendance/student/${cls._id}`));
        const attendanceResults = await Promise.all(attendancePromises);
        const attendanceMap = {};
        classRes.data.forEach((cls, index) => {
          attendanceMap[cls._id] = attendanceResults[index].data;
        });
        setAttendanceData(attendanceMap);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch data. Please try again later.');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Typography sx={{ p: 2 }}>Loading...</Typography>;
  if (error) return <Typography color="error" sx={{ p: 2 }}>{error}</Typography>;

  const getPercentageColor = (percentage) => {
    if (percentage >= 75) return 'success';
    if (percentage >= 50) return 'warning';
    return 'error';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Student Dashboard
      </Typography>
      <UpcomingClasses userRole="student" />
      {classes.length === 0 ? (
        <Typography>You are not enrolled in any classes yet.</Typography>
      ) : (
        <Grid container spacing={3}>
          {classes.map(cls => (
            <Grid item xs={12} sm={6} md={4} key={cls._id}>
              <Card>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h5" component="div">{cls.subjectName}</Typography>
                    <Typography sx={{ mb: 1.5 }} color="text.secondary">{cls.subjectCode}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                            {cls.teacher.name}
                        </Typography>
                    </Box>
                  </Box>
                  {attendanceData[cls._id] && (
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
                            <CircularProgress 
                                variant="determinate" 
                                value={parseFloat(attendanceData[cls._id].attendancePercentage)} 
                                color={getPercentageColor(attendanceData[cls._id].attendancePercentage)}
                                size={100}
                                thickness={4}
                            />
                            <Box
                                sx={{
                                top: 0, left: 0, bottom: 0, right: 0,
                                position: 'absolute', display: 'flex',
                                alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                <Typography variant="h5" component="div" color="text.primary">
                                    {`${Math.round(attendanceData[cls._id].attendancePercentage)}%`}
                                </Typography>
                            </Box>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            {attendanceData[cls._id].attendedClasses} of {attendanceData[cls._id].totalClasses} classes attended
                        </Typography>
                      <Button fullWidth variant="outlined" sx={{ mt: 2 }} onClick={() => setSelectedCourseForReport(cls)}>
                        Check Report
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      {selectedCourseForReport && (
        <DetailedReportModal 
            course={selectedCourseForReport}
            closeModal={() => setSelectedCourseForReport(null)}
        />
      )}
    </Container>
  );
};
export default StudentDashboard;