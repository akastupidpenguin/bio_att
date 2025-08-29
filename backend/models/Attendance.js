const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'class',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  presentStudents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
    },
  ],
  absentStudents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
    },
  ],
});

module.exports = mongoose.model('attendance', AttendanceSchema);
