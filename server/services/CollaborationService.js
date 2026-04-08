const Collaboration = require('../models/Collaboration');

const MAX_ROOM_SIZE = 5;

/**
 * Handles real-time collaboration logic via Socket.io.
 */
class CollaborationService {
  constructor(io) {
    this.io = io;
    this.roomUsers = new Map();   // repoId -> Map<userId, username>
    this.socketUser = new Map();  // socketId -> { userId, repoId, username }
  }

  handleConnection(socket) {

    // ── Join Repo Room ──────────────────────────────
    socket.on('join-repo', async ({ repoId, userId, username }) => {
      try {
        const room = this.roomUsers.get(repoId) || new Map();

        if (room.size >= MAX_ROOM_SIZE && !room.has(userId)) {
          socket.emit('room-full', { count: room.size, max: MAX_ROOM_SIZE });
          return;
        }

        // Track user on socket for clean disconnect handling
        this.socketUser.set(socket.id, { userId, repoId, username });

        room.set(userId, username);
        this.roomUsers.set(repoId, room);
        socket.join(repoId);

        // Upsert DB session
        let session = await Collaboration.findOne({ repoId });
        if (!session) {
          session = await Collaboration.create({
            repoId,
            hostUserId: userId,
            participants: [userId],
            isActive: true
          });
        } else if (!session.participants.map(String).includes(String(userId))) {
          session.participants.push(userId);
          await session.save();
        }

        this.io.to(repoId).emit('user-joined', { username, count: room.size });
      } catch (err) {
        console.error('[Collab] join-repo error:', err);
        socket.emit('error', { message: 'Failed to join room.' });
      }
    });

    // ── Chat Message Broadcast ──────────────────────
    socket.on('chat-message', ({ repoId, message }) => {
      // Real-time broadcast only — persistence handled by REST endpoint
      this.io.to(repoId).emit('new-message', message);
    });

    // ── Leave Room ──────────────────────────────────
    socket.on('leave-repo', ({ repoId, userId }) => {
      this._removeUserFromRoom(socket, repoId, userId);
    });

    // ── Kick User (host only) ───────────────────────
    socket.on('kick-user', async ({ repoId, targetUserId, hostUserId }) => {
      try {
        const session = await Collaboration.findOne({ repoId });
        if (!session || String(session.hostUserId) !== String(hostUserId)) {
          socket.emit('error', { message: 'Only the host can kick users.' });
          return;
        }

        const room = this.roomUsers.get(repoId);
        if (room) room.delete(String(targetUserId));

        // Notify target to disconnect — client must handle 'you-were-kicked'
        this.io.to(repoId).emit('you-were-kicked', { targetUserId });
        this.io.to(repoId).emit('user-left', { userId: targetUserId, count: room?.size ?? 0 });
      } catch (err) {
        console.error('[Collab] kick-user error:', err);
      }
    });

    // ── Clean Disconnect ────────────────────────────
    socket.on('disconnecting', () => {
      const meta = this.socketUser.get(socket.id);
      if (meta) {
        this._removeUserFromRoom(socket, meta.repoId, meta.userId);
        this.socketUser.delete(socket.id);
      }
    });
  }

  /** Shared cleanup logic for leave and disconnect. */
  _removeUserFromRoom(socket, repoId, userId) {
    const room = this.roomUsers.get(repoId);
    if (!room) return;

    room.delete(String(userId));
    socket.leave(repoId);

    if (room.size === 0) {
      this.roomUsers.delete(repoId);
    }

    this.io.to(repoId).emit('user-left', { userId, count: room.size });
  }
}

module.exports = CollaborationService;