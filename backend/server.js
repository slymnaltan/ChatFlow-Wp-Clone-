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
import rabbitmq from './rabbitmq.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const allowedOrigins = [
  'http://localhost',
  'http://localhost:80',
  'http://localhost:8080',
  'http://localhost:5173'
];

// Canlı ortamda CLIENT_URL tanımlıysa listeye ekle
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

app.use(cors({
  origin: (origin, callback) => {
    // Mobile apps or curl requests (no origin) -> allow
    if (!origin) return callback(null, true);
    // Geliştirme ortamında veya listede varsa izin ver
    if (allowedOrigins.indexOf(origin) !== -1 || !process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
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
await rabbitmq.connect();

// RabbitMQ Worker Başlat
await rabbitmq.createQueue('chat_messages');

// Kuyruktan mesajları dinle ve veritabanına yaz
rabbitmq.consumeMessages('chat_messages', async (data) => {
  try {
    const msg = new Message({
      conversation: data.conversationId,
      sender: data.senderId,
      content: data.content
    });
    await msg.save();
    await msg.populate('sender', 'username');

    // Conversation güncelle
    await Conversation.findByIdAndUpdate(data.conversationId, { updatedAt: new Date() });

    // Socket ile odadaki kullanıcılara gönder
    io.to(`conversation_${data.conversationId}`).emit('new_message', msg);

    // Cache Temizliği
    await redisClient.del(`messages:${data.conversationId}`);
    const participants = await Conversation.findById(data.conversationId).select('participants');
    if (participants) {
      for (const participantId of participants.participants) {
        await redisClient.del(`user:${participantId}:conversations`);
      }
    }
  } catch (err) {
    console.error('Mesaj işleme hatası:', err);
  }
});

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
      // Mesajı direkt DB'ye yazmak yerine Kuyruğa atıyoruz
      await rabbitmq.sendMessage('chat_messages', {
        conversationId: data.conversationId,
        senderId: userId,
        content: data.content
      });

      // Kullanıcıya "iletildi / kuyruğa alındı" onayı dönebiliriz (opsiyonel)
      // socket.emit('message_queued', { tempId: data.tempId });

    } catch (e) {
      console.error('Mesaj kuyruğa atılamadı:', e);
      socket.emit('error', { message: 'Mesaj gönderilemedi' });
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