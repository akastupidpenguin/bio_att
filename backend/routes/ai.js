require('dotenv').config();

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const axios = require('axios');
const User = require('../models/User');
const Class = require('../models/Class');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

// @route   POST api/ai/check-liveness
// @desc    Proxies liveness check to the AI service
// @access  Private
router.post('/check-liveness', auth, async (req, res) => {
    try {
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/check_liveness`, req.body);
        res.json(aiResponse.data);
    } catch (err) {
        if (err.response) {
            return res.status(err.response.status).json(err.response.data);
        }
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   POST api/ai/enroll-face
// @desc    Enrolls a face after checking for duplicates
// @access  Private (Teacher only)
router.post('/enroll-face', auth, async (req, res) => {
    try {
        // 1. Get the new embedding from the AI service first
        const embeddingResponse = await axios.post(`${AI_SERVICE_URL}/get_embedding`, { image: req.body.image });
        const { embedding } = embeddingResponse.data;
        const { userId } = req.body;

        if (!embedding) {
            return res.status(400).json({ error: 'Could not generate face embedding from the provided image.' });
        }

        // 2. Get all existing embeddings from the database, excluding the current user
        const allOtherStudents = await User.find({ 
            _id: { $ne: userId }, 
            faceEmbedding: { $exists: true, $ne: null } 
        }).select('_id name faceEmbedding');

        const known_students = allOtherStudents.map(student => ({
            _id: student._id,
            name: student.name, // Send name for the error message
            embedding: student.faceEmbedding.toJSON().data 
        }));

        // 3. Call the new AI endpoint to check for duplicates
        if (known_students.length > 0) {
            const duplicateCheckResponse = await axios.post(`${AI_SERVICE_URL}/check_duplicate`, {
                new_embedding: embedding,
                known_students: known_students
            });

            if (duplicateCheckResponse.data.is_duplicate) {
                const duplicateStudent = duplicateCheckResponse.data.duplicate_student;
                return res.status(400).json({ 
                    error: `Enrollment failed: This face is already registered with student: ${duplicateStudent.name} (${duplicateStudent._id})` 
                });
            }
        }

        // 4. If no duplicate is found, proceed with saving the embedding
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        user.faceEmbedding = Buffer.from(new Float32Array(embedding).buffer);
        await user.save();

        res.json({ message: `Face for ${user.name} enrolled successfully!` });

    } catch (err) {
        if (err.response) {
            return res.status(err.response.status).json(err.response.data);
        }
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/ai/recognize-live
// @desc    Recognizes faces from a live frame
// @access  Private (Teacher only)
router.post('/recognize-live', auth, async (req, res) => {
    const { classId, image } = req.body;
    try {
        const course = await Class.findById(classId);
        if (!course) return res.status(404).json({ msg: 'Class not found' });

        const enrolledStudents = await User.find({ 
            _id: { $in: course.students },
            faceEmbedding: { $exists: true, $ne: null }
        }).select('_id name faceEmbedding');

        if (enrolledStudents.length === 0) {
            return res.json({ recognized_students: [] });
        }

        const known_students = enrolledStudents.map(student => ({
            _id: student._id,
            embedding: student.faceEmbedding.toJSON().data 
        }));

        const aiResponse = await axios.post(`${AI_SERVICE_URL}/recognize_faces`, { image, known_students });
        const { recognized_ids } = aiResponse.data;

        const recognized_students = enrolledStudents.filter(s => recognized_ids.includes(s._id.toString()));

        res.json({ recognized_students });

    } catch (err) {
        if (err.response) return res.status(err.response.status).json(err.response.data);
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;