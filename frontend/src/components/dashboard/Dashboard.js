import React from 'react';
import StudentDashboard from './StudentDashboard';
import TeacherDashboard from './TeacherDashboard';

const Dashboard = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.role === 'teacher') {
        return <TeacherDashboard />;
    }
    return <StudentDashboard />;
};
export default Dashboard;