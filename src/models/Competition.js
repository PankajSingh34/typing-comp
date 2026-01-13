const mongoose = require('mongoose');

const competitionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  rounds: [{
    roundNumber: {
      type: Number,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      required: true
    }
  }],
  organizer: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed'],
    default: 'waiting'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
  // NOTE: No participants array - refactored to separate Participant collection
});

module.exports = mongoose.model('Competition', competitionSchema);
