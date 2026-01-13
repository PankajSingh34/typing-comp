const logger = require('../config/logger');
const { handleJoin } = require('./handlers/join');
const Participant = require('../models/Participant');

const activeCompetitions = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {
    logger.info(`🔌 Socket Connected: ${socket.id}`);

    // JOIN COMPETITION
    socket.on('join', (data) => {
      logger.debug('Join event received', {
        socketId: socket.id,
        code: data.code,
      });
      handleJoin(socket, io, data, activeCompetitions);
    });

    // DISCONNECT
    socket.on('disconnect', async () => {
      logger.info(`🔌 Socket Disconnected: ${socket.id}`);
      if (socket.competitionId && socket.participantName) {
        try {
          // Remove from in-memory active competitions
          const compData = activeCompetitions.get(socket.competitionId);
          if (compData) {
            const participant = compData.participants.get(socket.id);
            if (participant) {
              compData.participants.delete(socket.id);

              // Clean up participant document from database
              await Participant.findOneAndDelete({
                competitionId: socket.competitionId,
                socketId: socket.id
              });

              // Get updated participant count
              const participantCount = await Participant.countDocuments({ 
                competitionId: socket.competitionId 
              });

              // Notify remaining participants
              io.to(socket.competitionId).emit('participantLeft', {
                name: socket.participantName,
                count: participantCount
              });

              logger.debug(`Participant ${socket.participantName} left competition`);
            }
          }
        } catch (error) {
          logger.error('Disconnect cleanup error:', error);
        }
      }
    });
  });

  logger.info('Socket.IO events initialized');
};

// Export activeCompetitions for testing
module.exports.activeCompetitions = activeCompetitions;
