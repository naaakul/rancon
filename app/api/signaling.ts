import { NextApiRequest } from 'next';
import { NextApiResponse } from 'next';
import { Server } from 'socket.io';
import { SignalingMessage } from '../../types';

declare global {
  var io: Server;
}

interface ExtendedNextApiRequest extends NextApiRequest {
  socket: any & {
    server: any;
  }
}

// Track waiting users
let waitingUsers: Set<string> = new Set();
// Track connected pairs
let connectedPairs: Map<string, string> = new Map();

const handler = (req: ExtendedNextApiRequest, res: NextApiResponse) => {
  // If socket.io server doesn't exist, initialize it
  if (res.socket && !res.socket.server.io) {
    const io = new Server(res.socket.server);
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.on('message', (message: string) => {
        try {
          const parsedMessage: SignalingMessage = JSON.parse(message);
          handleSignalingMessage(socket.id, parsedMessage);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });

      socket.on('disconnect', () => {
        handleDisconnect(socket.id);
      });
    });
  }

  // Handle WebSocket upgrade
  res.end();
};

function handleSignalingMessage(userId: string, message: SignalingMessage) {
  const io = global.io;

  switch (message.type) {
    case 'ready':
      // Add user to waiting pool and try to pair
      waitingUsers.delete(userId);
      
      // If user is already in a pair, notify the partner
      if (connectedPairs.has(userId)) {
        const partnerId = connectedPairs.get(userId);
        if (partnerId) {
          io.to(partnerId).emit('message', JSON.stringify({ type: 'leave' }));
          connectedPairs.delete(partnerId);
        }
        connectedPairs.delete(userId);
      }
      
      // Try to find a partner
      pairUsers(userId);
      break;
      
    case 'offer':
    case 'answer':
    case 'candidate':
      // Forward these messages to the paired user
      const partnerId = connectedPairs.get(userId);
      if (partnerId) {
        io.to(partnerId).emit('message', message);
      }
      break;
      
    case 'leave':
      // Handle user leaving chat
      if (connectedPairs.has(userId)) {
        const partnerId = connectedPairs.get(userId);
        if (partnerId) {
          io.to(partnerId).emit('message', JSON.stringify({ type: 'leave' }));
          connectedPairs.delete(partnerId);
        }
        connectedPairs.delete(userId);
      }
      
      // Remove from waiting list if there
      waitingUsers.delete(userId);
      break;
  }
}

function handleDisconnect(userId: string) {
  // Notify partner if this user was in a pair
  if (connectedPairs.has(userId)) {
    const partnerId = connectedPairs.get(userId);
    if (partnerId) {
      global.io.to(partnerId).emit('message', JSON.stringify({ type: 'leave' }));
      connectedPairs.delete(partnerId);
    }
    connectedPairs.delete(userId);
  }
  
  // Remove from waiting list
  waitingUsers.delete(userId);
}

function pairUsers(userId: string) {
  // If no waiting users, add this user to waiting
  if (waitingUsers.size === 0) {
    waitingUsers.add(userId);
    return;
  }
  
  // Find another waiting user (not this user)
  let partnerId: string | null = null;
  for (const waitingId of waitingUsers) {
    if (waitingId !== userId) {
      partnerId = waitingId;
      break;
    }
  }
  
  if (!partnerId) {
    // No suitable partner found, add to waiting
    waitingUsers.add(userId);
    return;
  }
  
  // Remove both from waiting list
  waitingUsers.delete(userId);
  waitingUsers.delete(partnerId);
  
  // Create the pair
  connectedPairs.set(userId, partnerId);
  connectedPairs.set(partnerId, userId);
  
  // Notify first user to start the offer process
  global.io.to(userId).emit('message', JSON.stringify({ type: 'start_offer' }));
}

export default handler;