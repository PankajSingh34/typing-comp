const Competition = require('../../models/Competition');
const Participant = require('../../models/Participant');
const logger = require('../../config/logger');
const mongoose = require('mongoose');



async function handleJoin(socket, io, data, activeCompetitions) {
  try {
    const { code, participantName } = data;
    
    // Validate input
    if (!code || !participantName) {
      socket.emit('error', { message: 'Code and participant name are required' });
      return;
    }

    // Find competition by code
    const competition = await Competition.findOne({ code: code.toUpperCase() });
    if (!competition) {
      socket.emit('error', { message: 'Competition not found' });
      return;
    }

    // Check if competition is still accepting participants
    if (competition.status === 'completed') {
      socket.emit('error', { message: 'Competition has ended' });
      return;
    }

    try {
      // Create participant document (will fail if duplicate due to unique index)
      const participant = await Participant.create({
        competitionId: competition._id,
        name: participantName.trim(),
        socketId: socket.id
      });

      // Add to active competitions in memory for real-time updates
      const competitionId = competition._id.toString();
      if (!activeCompetitions.has(competitionId)) {
        activeCompetitions.set(competitionId, {
          competition,
          participants: new Map()
        });
      }

      const compData = activeCompetitions.get(competitionId);
      compData.participants.set(socket.id, {
        name: participantName.trim(),
        progress: 0,
        wpm: 0,
        accuracy: 100,
        joinedAt: new Date()
      });

      // Join socket room for real-time updates
      socket.join(competitionId);
      
      // Set socket properties for cleanup on disconnect
      socket.competitionId = competitionId;
      socket.participantName = participantName.trim();
      socket.isOrganizer = false;

      // Get current participant count
      const participantCount = await Participant.countDocuments({ 
        competitionId: competition._id 
      });

      // Emit success to the participant
      socket.emit('joinSuccess', {
        competition: competition.name,
        competitionId: competitionId,
        participantCount,
        rounds: competition.rounds
      });

      // Notify all participants in the competition
      io.to(competitionId).emit('participantJoined', {
        name: participantName.trim(),
        count: participantCount
      });

      console.log(`Participant ${participantName} joined competition ${competition.name}`);

    } catch (dbError) {
      if (dbError.code === 11000) {
        // MongoDB duplicate key error
        socket.emit('error', { message: 'Participant name already taken in this competition' });
      } else {
        throw dbError;
      }
    }

  } catch (error) {
    console.error('Join error:', error);
    socket.emit('error', { message: 'Failed to join competition' });
  }
}

async function handleOrganizerJoin(socket, io, data) {
  try {
    socket.join(`competition_${data.competitionId}`);
    socket.isOrganizer = true;
    logger.info(`✓ Organizer connected`, {
      socketId: socket.id,
      competitionId: data.competitionId,
    });
  } catch (error) {
    logger.error(`Organizer join error: ${error.message}`, {
      competitionId: data.competitionId,
      stack: error.stack,
    });
  }
}

module.exports = { handleJoin, handleOrganizerJoin };
