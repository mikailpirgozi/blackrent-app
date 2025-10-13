import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';

// Socket.IO plugin for Fastify
const socketIoPlugin: FastifyPluginAsync = async (fastify) => {
  const io = new SocketIOServer(fastify.server as HTTPServer, {
    cors: {
      origin: (origin, callback) => {
        const allowedOrigins = [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:3002',
          process.env.FRONTEND_URL || 'http://localhost:3000'
        ];
        
        if (!origin || allowedOrigins.includes(origin) || 
            origin.endsWith('.vercel.app') || 
            /^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|localhost)(:\d+)?$/.test(origin)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      credentials: true,
      methods: ['GET', 'POST']
    }
  });

  // Socket.IO event handlers
  io.on('connection', (socket) => {
    fastify.log.info({ msg: '🔴 WebSocket client connected', socketId: socket.id });

    socket.on('disconnect', () => {
      fastify.log.info({ msg: '🔴 WebSocket client disconnected', socketId: socket.id });
    });

    // Protocol events
    socket.on('protocol:created', (data) => {
      fastify.log.info({ msg: '📋 Protocol created event', data });
      io.emit('protocol:created', data);
    });

    // Rental events
    socket.on('rental:updated', (data) => {
      fastify.log.info({ msg: '🚗 Rental updated event', data });
      io.emit('rental:updated', data);
    });

    // Vehicle events
    socket.on('vehicle:updated', (data) => {
      fastify.log.info({ msg: '🚙 Vehicle updated event', data });
      io.emit('vehicle:updated', data);
    });

    // Generic notification
    socket.on('notification', (data) => {
      fastify.log.info({ msg: '🔔 Notification event', data });
      io.emit('notification', data);
    });
  });

  // Decorate fastify with io instance
  fastify.decorate('io', io);

  // Helper methods
  fastify.decorate('emitProtocolCreated', (data: any) => {
    io.emit('protocol:created', data);
  });

  fastify.decorate('emitRentalUpdated', (data: any) => {
    io.emit('rental:updated', data);
  });

  fastify.decorate('emitVehicleUpdated', (data: any) => {
    io.emit('vehicle:updated', data);
  });

  fastify.decorate('emitNotification', (data: any) => {
    io.emit('notification', data);
  });

  fastify.log.info('✅ Socket.IO plugin registered');
};

export default fp(socketIoPlugin);

// Type declarations
declare module 'fastify' {
  interface FastifyInstance {
    io: SocketIOServer;
    emitProtocolCreated: (data: any) => void;
    emitRentalUpdated: (data: any) => void;
    emitVehicleUpdated: (data: any) => void;
    emitNotification: (data: any) => void;
  }
}


