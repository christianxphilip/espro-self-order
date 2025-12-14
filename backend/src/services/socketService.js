import { Server } from 'socket.io';

let io = null;

/**
 * Initialize Socket.io server
 * @param {Object} server - HTTP server instance
 * @returns {Server} - Socket.io server instance
 */
export const initializeSocket = (server) => {
  if (process.env.ENABLE_WEBSOCKET !== 'true') {
    console.log('[Socket] WebSocket feature is disabled');
    return null;
  }

  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGINS?.split(',') || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('[Socket] Client connected:', socket.id);

    // Barista joins barista room
    socket.on('join-barista-room', () => {
      socket.join('baristas');
      console.log('[Socket] Barista joined room:', socket.id);
    });

    // Customer joins table room
    socket.on('join-table-room', (tableId) => {
      socket.join(`table-${tableId}`);
      console.log('[Socket] Customer joined table room:', tableId);
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Client disconnected:', socket.id);
    });
  });

  console.log('[Socket] Socket.io initialized');
  return io;
};

/**
 * Get Socket.io instance
 * @returns {Server|null} - Socket.io server instance or null
 */
export const getSocketIO = () => {
  return io;
};

/**
 * Emit event to baristas
 * @param {string} event - Event name
 * @param {Object} data - Data to emit
 */
export const emitToBaristas = (event, data) => {
  if (io && process.env.ENABLE_WEBSOCKET === 'true') {
    io.to('baristas').emit(event, data);
  }
};

/**
 * Emit event to table room
 * @param {string} tableId - Table ID
 * @param {string} event - Event name
 * @param {Object} data - Data to emit
 */
export const emitToTable = (tableId, event, data) => {
  if (io && process.env.ENABLE_WEBSOCKET === 'true') {
    io.to(`table-${tableId}`).emit(event, data);
  }
};
