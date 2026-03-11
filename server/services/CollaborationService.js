const Collaboration = require('../models/Collaboration');
const Message = require('../models/Message');

/**
 * Handles real-time collaboration logic via Socket.io.
 */
class CollaborationService {
  constructor(io) {
    this.io = io;
    this.roomUsers = new Map(); // repoId -> Set of userIds
  }

  handleConnection(socket) {
    socket.on('join-repo', async ({ repoId, userId, username }) => {
      try {
        const users = this.roomUsers.get(repoId) || new Set();
        
        if (users.size >= 5) {
          socket.emit('room-full', { count: users.size, max: 5 });
          return;
        }

        // Add user to room
        users.add(userId);
        this.roomUsers.set(repoId, users);
        socket.join(repoId);

        // Update DB session info
        let session = await Collaboration.findOne({ repoId });
        if (!session) {
           session = await Collaboration.create({
               repoId,
               hostUserId: userId,
               participants: [userId],
               isActive: true
           });
        } else if (!session.participants.includes(userId)) {
           session.participants.push(userId);
           await session.save();
        }

        this.io.to(repoId).emit('user-joined', { username, count: users.size });
      } catch (error) {
        console.error('Socket Join Error:', error);
      }
    });

    socket.on('chat-message', async ({ repoId, message }) => {
      // Broadcast message to all in room
      this.io.to(repoId).emit('new-message', message);
      
      // Messages sent in collaboration are already saved by the /chat/message REST endpoint
      // primarily, but we handle the real-time broadcast here.
    });

    socket.on('leave-repo', async ({ repoId, userId }) => {
      const users = this.roomUsers.get(repoId);
      if (users) {
        users.delete(userId.toString());
        socket.leave(repoId);
        this.io.to(repoId).emit('user-left', { userId, count: users.size });
      }
    });

    socket.on('kick-user', async ({ repoId, targetUserId, hostUserId }) => {
      try {
        const session = await Collaboration.findOne({ repoId });
        if (session && session.hostUserId.toString() === hostUserId.toString()) {
          const users = this.roomUsers.get(repoId);
          if (users) {
             users.delete(targetUserId.toString());
             // We need a way to force the target socket to leave.
             // In a real prod app, we'd find the specific socket by userId.
             // For now, we emit a kicked event and the client should disconnect.
             this.io.to(repoId).emit('user-kicked', { targetUserId });
             this.io.to(repoId).emit('user-left', { userId: targetUserId, count: users.size });
          }
        }
      } catch (error) {
        console.error('Kick User Error:', error);
      }
    });

    socket.on('disconnecting', () => {
      for (const room of socket.rooms) {
        if (this.roomUsers.has(room)) {
          const users = this.roomUsers.get(room);
          // Note: we don't have the userId here easily unless we store it on the socket
          // For now, this is a placeholder for more robust disconnect handling
        }
      }
    });
  }
}

module.exports = CollaborationService;
