const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  competitionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Competition',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  socketId: {
    type: String,
    required: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  progress: {
    type: Number,
    default: 0
  },
  wpm: {
    type: Number,
    default: 0
  },
  accuracy: {
    type: Number,
    default: 100
  }
});

// Compound unique index to prevent duplicate participants per competition
participantSchema.index({ competitionId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Participant', participantSchema);
