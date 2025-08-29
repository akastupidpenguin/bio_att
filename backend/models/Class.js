const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
  subjectName: { type: String, required: true },
  subjectCode: { type: String, required: true, unique: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
  schedule: [
    {
      day: { type: String, required: true }, // e.g., "Monday", "Tuesday"
      time: { type: String, required: true }  // e.g., "09:00", "14:30"
    }
  ]
});

module.exports = mongoose.model('class', ClassSchema);