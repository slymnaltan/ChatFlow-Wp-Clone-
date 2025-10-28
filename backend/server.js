import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db.js';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import { authenticateSocket } from './middleware/auth.js';
import { User, Conversation, Message } from './models/index.js';
import redisClient from './redis.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { 
    origin: ['http://localhost', 'http://localhost:80', 'http://localhost:8080', 'http://localhost:5173'], 
    credentials: true 
  }
});

app.use(cors());
app.use(express.json());

// Disable caching to avoid stale 304 responses across logins
app.set('etag', false);
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

await connectDB();

// HEALTH CHECK
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});
// HEALTH CHECK

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

const onlineUsers = new Map();

io.use(authenticateSocket);

console.log('🔌 Socket.io middleware kuruldu');

io.on('connection', async (socket) => {
  console.log('🔌 Yeni Socket.io bağlantısı:', socket.id);
  const userId = socket.user.id;
  onlineUsers.set(userId, socket.id);
  
  await User.findByIdAndUpdate(userId, { isOnline: true });
  await redisClient.sAdd('online_users', String(userId));
  io.emit('user_status', { userId, isOnline: true });

  const convs = await Conversation.find({ participants: userId });
  convs.forEach(c => socket.join(`conversation_${c._id}`));

  socket.on('send_message', async (data) => {
    try {
      const msg = new Message({
        conversation: data.conversationId,
        sender: userId,
        content: data.content
      });
      await msg.save();
      await msg.populate('sender', 'username');
      await Conversation.findByIdAndUpdate(data.conversationId, { updatedAt: new Date() });
      io.to(`conversation_${data.conversationId}`).emit('new_message', msg);

      // Invalidate Redis caches related to this conversation
      await redisClient.del(`messages:${data.conversationId}`);
      const participants = await Conversation.findById(data.conversationId).select('participants');
      for (const participantId of participants.participants) {
        await redisClient.del(`user:${participantId}:conversations`);
      }
    } catch (e) {
      console.error(e);
    }
  });

  socket.on('disconnect', async () => {
    onlineUsers.delete(userId);
    await User.findByIdAndUpdate(userId, { isOnline: false });
    await redisClient.sRem('online_users', String(userId));
    io.emit('user_status', { userId, isOnline: false });
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server on port ${PORT}`));