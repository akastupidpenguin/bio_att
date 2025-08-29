const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const excel = require('exceljs');

// --- THIS IS THE NEW ROUTE ---
// @route   POST api/attendance
// @desc    Create a new attendance record (used by import script)
// @access  Private (Teacher only)
router.post('/', auth, async (req, res) => {
    const { classId, date, presentStudents, absentStudents } = req.body;
    try {
        const newAttendance = new Attendance({
            classId,
            date,
            presentStudents,
            absentStudents
        });
        await newAttendance.save();
        res.json(newAttendance);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
// --- END NEW ROUTE ---

// @route   POST api/attendance/finalize
// @desc    Finalize and save an attendance record from a live session
router.post('/finalize', auth, async (req, res) => {
    const { classId, presentStudents } = req.body;
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const existingRecord = await Attendance.findOne({
            classId,
            date: { $gte: startOfDay, $lt: endOfDay }
        });

        if (existingRecord) {
            return res.status(400).json({ msg: 'Attendance has already been taken for this class today.' });
        }

        const course = await Class.findById(classId);
        if (!course) return res.status(404).json({ msg: 'Class not found' });

        const allEnrolledStudentIds = course.students.map(id => id.toString());
        const absentStudents = allEnrolledStudentIds.filter(id => !presentStudents.includes(id));

        const newAttendance = new Attendance({
            classId,
            date: new Date(),
            presentStudents,
            absentStudents
        });

        await newAttendance.save();
        res.json({ message: `Attendance saved! Present: ${presentStudents.length}, Absent: ${absentStudents.length}`, attendance: newAttendance });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/attendance/class/:classId
// @desc    Get all attendance records for a specific class
router.get('/class/:classId', auth, async (req, res) => {
    try {
        const attendanceRecords = await Attendance.find({ classId: req.params.classId }).sort({ date: -1 });
        res.json(attendanceRecords);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/attendance/student/:classId
// @desc    Get a student's attendance summary for a specific class
router.get('/student/:classId', auth, async (req, res) => {
    try {
      const classId = req.params.classId;
      const studentId = req.user.id;
  
      const attendanceRecords = await Attendance.find({ classId });
      let totalClasses = attendanceRecords.length;
      let attendedClasses = 0;
  
      attendanceRecords.forEach(record => {
        if (record.presentStudents.map(id => id.toString()).includes(studentId)) {
          attendedClasses++;
        }
      });
  
      const attendancePercentage = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;
  
      res.json({
        totalClasses,
        attendedClasses,
        attendancePercentage: attendancePercentage.toFixed(2),
      });
  
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
});

// @route   GET api/attendance/:id
// @desc    Get a single attendance record with student details
router.get('/:id', auth, async (req, res) => {
    try {
        const attendance = await Attendance.findById(req.params.id)
            .populate('presentStudents', ['name', 'email'])
            .populate('absentStudents', ['name', 'email']);
        
        if (!attendance) return res.status(404).json({ msg: 'Attendance record not found' });
        res.json(attendance);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/attendance/:id
// @desc    Update an attendance record
router.put('/:id', auth, async (req, res) => {
    const { presentStudents } = req.body;
    try {
        let attendance = await Attendance.findById(req.params.id);
        if (!attendance) return res.status(404).json({ msg: 'Attendance record not found' });

        const recordDate = new Date(attendance.date);
        recordDate.setHours(0, 0, 0, 0);
        const threeDaysAgo = new Date();
        threeDaysAgo.setHours(0, 0, 0, 0);
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        if (recordDate < threeDaysAgo) {
            return res.status(403).json({ msg: 'This record is too old to be edited.' });
        }

        const course = await Class.findById(attendance.classId);
        const allEnrolledStudentIds = course.students.map(id => id.toString());
        const absentStudents = allEnrolledStudentIds.filter(id => !presentStudents.includes(id));

        attendance.presentStudents = presentStudents;
        attendance.absentStudents = absentStudents;

        await attendance.save();
        res.json(attendance);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/attendance/:id
// @desc    Delete an attendance record
router.delete('/:id', auth, async (req, res) => {
    try {
        const attendance = await Attendance.findById(req.params.id);
        if (!attendance) return res.status(404).json({ msg: 'Attendance record not found' });

        const recordDate = new Date(attendance.date);
        recordDate.setHours(0, 0, 0, 0);
        const threeDaysAgo = new Date();
        threeDaysAgo.setHours(0, 0, 0, 0);
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        if (recordDate < threeDaysAgo) {
            return res.status(403).json({ msg: 'This record is too old to be deleted.' });
        }

        await Attendance.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Attendance record removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/attendance/export/:classId
// @desc    Export attendance for a class to an Excel file
router.get('/export/:classId', auth, async (req, res) => {
    try {
        const classId = req.params.classId;
        const { startDate, endDate } = req.query;

        const course = await Class.findById(classId).populate('students', 'name email');
        if (!course) {
            return res.status(404).json({ msg: 'Class not found' });
        }

        const dateFilter = { classId };
        if (startDate && endDate) {
            const endOfDay = new Date(endDate);
            endOfDay.setHours(23, 59, 59, 999);
            dateFilter.date = { $gte: new Date(startDate), $lte: endOfDay };
        }

        const attendanceRecords = await Attendance.find(dateFilter).sort({ date: 1 });

        if (attendanceRecords.length === 0) {
            return res.status(404).json({ msg: 'No attendance records found for the selected date range.' });
        }

        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet(`${course.subjectCode} Attendance`);

        const headers = ['Student Name', 'Email'];
        const dateMap = new Map();

        attendanceRecords.forEach(record => {
            const dateString = new Date(record.date).toLocaleDateString();
            if (!dateMap.has(dateString)) {
                dateMap.set(dateString, headers.length);
                headers.push(dateString);
            }
        });
        headers.push('Total Present', 'Total Absent', 'Percentage');
        worksheet.getRow(1).values = headers;
        worksheet.getRow(1).font = { bold: true };

        course.students.forEach((student, index) => {
            const row = worksheet.getRow(index + 2);
            row.getCell(1).value = student.name;
            row.getCell(2).value = student.email;

            let presentCount = 0;
            const presentDates = new Set();

            attendanceRecords.forEach(record => {
                const dateString = new Date(record.date).toLocaleDateString();
                const colIndex = dateMap.get(dateString);
                if (colIndex !== undefined) {
                    const isPresent = record.presentStudents.map(id => id.toString()).includes(student._id.toString());
                    
                    if (row.getCell(colIndex + 1).value === null) {
                        row.getCell(colIndex + 1).value = isPresent ? 'P' : 'A';
                        if (!isPresent) {
                            row.getCell(colIndex + 1).fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'FFFFC7CE' }
                            };
                            row.getCell(colIndex + 1).font = {
                                color: { argb: 'FF9C0006' }
                            };
                        }
                    }

                    if (isPresent && !presentDates.has(dateString)) {
                        presentCount++;
                        presentDates.add(dateString);
                    }
                }
            });

            const totalDays = dateMap.size;
            const absentCount = totalDays - presentCount;
            const percentage = totalDays > 0 ? (presentCount / totalDays) * 100 : 0;

            row.getCell(headers.length - 2).value = presentCount;
            row.getCell(headers.length - 1).value = absentCount;
            row.getCell(headers.length).value = `${percentage.toFixed(2)}%`;
        });

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=${course.subjectCode}_attendance_${startDate}_to_${endDate}.xlsx`
        );

        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// --- THIS IS THE NEW ROUTE ---
// @route   GET /api/attendance/student/:classId/report
// @desc    Get a detailed attendance report (list of absent dates) for a student
// @access  Private
router.get('/student/:classId/report', auth, async (req, res) => {
    try {
        const { classId } = req.params;
        const studentId = req.user.id;

        const records = await Attendance.find({ 
            classId,
            absentStudents: studentId 
        }).sort({ date: 1 });

        const absentDates = records.map(record => new Date(record.date).toLocaleDateString());

        res.json({ absentDates });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;