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

io.on('connection', async (socket) => {
  const userId = socket.user.id;
  onlineUsers.set(userId, socket.id);
  
  await User.findByIdAndUpdate(userId, { isOnline: true });
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
    } catch (e) {
      console.error(e);
    }
  });

  socket.on('disconnect', async () => {
    onlineUsers.delete(userId);
    await User.findByIdAndUpdate(userId, { isOnline: false });
    io.emit('user_status', { userId, isOnline: false });
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server on port ${PORT}`));