const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const Class = require('../models/Class');

// @route   POST api/classes
// @desc    Create a class (requires teacher role)
router.post('/', [auth, [
    check('subjectName', 'Subject name is required').not().isEmpty(),
    check('subjectCode', 'Subject code is required').not().isEmpty(),
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const user = await User.findById(req.user.id);
    if (user.role !== 'teacher') {
        return res.status(401).json({ msg: 'User not authorized' });
    }
    const { subjectName, subjectCode } = req.body;
    try {
        const newClass = new Class({
            subjectName, subjectCode, teacher: req.user.id, students: [],
        });
        const savedClass = await newClass.save();
        res.json(savedClass);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/classes/enroll
// @desc    Enroll a student in a class
router.post('/enroll', auth, async (req, res) => {
    const { studentEmail, subjectCode } = req.body;
    try {
        const student = await User.findOne({ email: studentEmail });
        if (!student) return res.status(404).json({ msg: `Student not found: ${studentEmail}` });
        const course = await Class.findOne({ subjectCode });
        if (!course) return res.status(404).json({ msg: `Class not found: ${subjectCode}` });
        if (course.students.map(id => id.toString()).includes(student.id)) {
            return res.status(400).json({ msg: 'Student already enrolled' });
        }
        course.students.push(student.id);
        await course.save();
        res.json(course);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/classes/student
// @desc    Get all classes a student is enrolled in
router.get('/student', auth, async (req, res) => {
  try {
    const classes = await Class.find({ students: req.user.id }).populate('teacher', ['name']);
    res.json(classes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/classes/teacher
// @desc    Get all classes taught by a logged-in teacher
router.get('/teacher', auth, async (req, res) => {
  try {
    const classes = await Class.find({ teacher: req.user.id });
    res.json(classes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/classes/:classId/students
// @desc    Get all students in a class and check if their face is enrolled
router.get('/:classId/students', auth, async (req, res) => {
    try {
        const course = await Class.findById(req.params.classId).populate('students', ['name', 'email', 'faceEmbedding']);
        if (!course) return res.status(404).json({ msg: 'Class not found' });
        const studentsWithStatus = course.students.map(student => ({
            _id: student._id, name: student.name, email: student.email, isEnrolled: !!student.faceEmbedding 
        }));
        res.json(studentsWithStatus);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/classes/code/:subjectCode
// @desc    Get class by subject code
router.get('/code/:subjectCode', auth, async (req, res) => {
    try {
        const course = await Class.findOne({ subjectCode: req.params.subjectCode });
        if (!course) return res.status(404).json({ msg: 'Class not found' });
        res.json(course);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/classes/:id/schedule
// @desc    Update the schedule for a class
router.put('/:id/schedule', auth, async (req, res) => {
    const { schedule } = req.body;
    try {
        const course = await Class.findById(req.params.id);
        if (!course) return res.status(404).json({ msg: 'Class not found' });
        if (course.teacher.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }
        course.schedule = schedule;
        await course.save();
        res.json(course);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Helper function to find the next scheduled classes
const findUpcomingClasses = (classes) => {
    const now = new Date();
    const dayMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDayIndex = now.getDay();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let upcomingClasses = [];
    const currentDayName = dayMap[currentDayIndex];
    classes.forEach(course => {
        course.schedule.forEach(slot => {
            if (slot.day === currentDayName && slot.time >= currentTime) {
                upcomingClasses.push({
                    subjectName: course.subjectName,
                    subjectCode: course.subjectCode,
                    teacherName: course.teacher.name,
                    day: slot.day,
                    time: slot.time
                });
            }
        });
    });

    if (upcomingClasses.length > 0) {
        return upcomingClasses.sort((a, b) => a.time.localeCompare(b.time));
    }

    for (let i = 1; i <= 7; i++) {
        const nextDayIndex = (currentDayIndex + i) % 7;
        const nextDayName = dayMap[nextDayIndex];
        
        classes.forEach(course => {
            course.schedule.forEach(slot => {
                if (slot.day === nextDayName) {
                    upcomingClasses.push({
                        subjectName: course.subjectName,
                        subjectCode: course.subjectCode,
                        teacherName: course.teacher.name,
                        day: slot.day,
                        time: slot.time
                    });
                }
            });
        });

        if (upcomingClasses.length > 0) {
            return upcomingClasses.sort((a, b) => a.time.localeCompare(b.time));
        }
    }

    return []; // Always return an array
};

// @route   GET api/classes/student/upcoming
// @desc    Get the next upcoming classes for a student
router.get('/student/upcoming', auth, async (req, res) => {
    try {
        const classes = await Class.find({ students: req.user.id }).populate('teacher', 'name');
        const upcomingClasses = findUpcomingClasses(classes);
        res.json(upcomingClasses);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/classes/teacher/upcoming
// @desc    Get the next upcoming classes for a teacher
router.get('/teacher/upcoming', auth, async (req, res) => {
    try {
        const classes = await Class.find({ teacher: req.user.id }).populate('teacher', 'name');
        const upcomingClasses = findUpcomingClasses(classes);
        res.json(upcomingClasses);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// --- THIS IS THE FIX ---
// @route   POST api/classes/:classId/enroll_manual
// @desc    Manually enroll multiple students in a class by their roll numbers
// @access  Private (Teacher only)
router.post('/:classId/enroll_manual', auth, async (req, res) => {
    const { rollNumbers } = req.body; // Expecting an array of roll numbers
    const { classId } = req.params;

    if (!rollNumbers || !Array.isArray(rollNumbers) || rollNumbers.length === 0) {
        return res.status(400).json({ msg: 'An array of roll numbers is required.' });
    }

    try {
        const course = await Class.findById(classId);
        if (!course) {
            return res.status(404).json({ msg: 'Class not found.' });
        }

        const report = {
            success: [],
            failed: []
        };

        for (const rollNumber of rollNumbers) {
            const studentEmail = `${rollNumber}@kiit.ac.in`;
            const student = await User.findOne({ email: studentEmail });

            if (!student) {
                report.failed.push(`${rollNumber}: Student not found.`);
                continue;
            }

            if (course.students.map(id => id.toString()).includes(student._id.toString())) {
                report.failed.push(`${rollNumber}: Already enrolled.`);
                continue;
            }

            course.students.push(student._id);
            report.success.push(rollNumber);
        }

        await course.save();

        // Return the updated student list for the class
        const updatedClass = await Class.findById(classId).populate('students', ['name', 'email', 'faceEmbedding']);
        const studentsWithStatus = updatedClass.students.map(s => ({
            _id: s._id,
            name: s.name,
            email: s.email,
            isEnrolled: !!s.faceEmbedding 
        }));

        res.json({
            students: studentsWithStatus,
            report: report
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;