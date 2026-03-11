import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (this.socket) return;
    
    this.socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to collaboration server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from collaboration server');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinRepo(repoId, userId, username) {
    if (this.socket) {
      this.socket.emit('join-repo', { repoId, userId, username });
    }
  }

  leaveRepo(repoId, userId) {
    if (this.socket) {
      this.socket.emit('leave-repo', { repoId, userId });
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event) {
    if (this.socket) {
      this.socket.off(event);
    }
  }
}

const socketService = new SocketService();
export default socketService;
