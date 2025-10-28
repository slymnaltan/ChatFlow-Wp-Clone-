import express from 'express';
import { User, Conversation, Message } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';
import redisClient from '../redis.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/conversations', async (req, res) => {
  try {
    // Redis cache'den conversations'ları kontrol et
    const cacheKey = `user:${req.user.id}:conversations`;
    const cached = await redisClient.get(cacheKey);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    const convs = await Conversation.find({ participants: req.user.id })
      .populate('participants', 'username email isOnline')
      .sort({ updatedAt: -1 });
    
    const result = await Promise.all(convs.map(async (conv) => {
      const lastMsg = await Message.findOne({ conversation: conv._id })
        .sort({ createdAt: -1 })
        .populate('sender', 'username');
      return { ...conv.toObject(), lastMessage: lastMsg };
    }));
    
    // Redis'e cache'le (5 dakika TTL)
    await redisClient.setEx(cacheKey, 300, JSON.stringify(result));
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const conversationId = req.params.id;
    const cacheKey = `messages:${conversationId}`;
    
    // Redis cache'den messages'ları kontrol et
    const cachedMessages = await redisClient.lRange(cacheKey, 0, -1);
    
    if (cachedMessages && cachedMessages.length > 0) {
      const messages = cachedMessages.map(msg => JSON.parse(msg));
      return res.json(messages);
    }
    
    // Cache'de yoksa veritabanından al
    const msgs = await Message.find({ conversation: conversationId })
      .populate('sender', 'username')
      .sort({ createdAt: 1 });
    
    // Redis'e cache'le
    if (msgs.length > 0) {
      const pipeline = redisClient.multi();
      msgs.forEach(msg => {
        pipeline.rPush(cacheKey, JSON.stringify(msg));
      });
      pipeline.expire(cacheKey, 3600); // 1 saat TTL
      await pipeline.exec();
    }
    
    res.json(msgs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/conversations', async (req, res) => {
  try {
    const { participantIds } = req.body;
    const all = [...new Set([...participantIds, req.user.id])];
    
    if (all.length === 2) {
      const existing = await Conversation.findOne({
        participants: { $all: all, $size: 2 }
      });
      if (existing) return res.json(existing);
    }
    
    const conv = new Conversation({ participants: all });
    await conv.save();
    await conv.populate('participants', 'username email');
    
    // Yeni conversation'ı Redis'e cache'le
    await redisClient.setEx(`conversation:${conv._id}`, 3600, JSON.stringify(conv));
    
    // İlgili kullanıcıların conversation cache'ini temizle
    for (const participantId of all) {
      await redisClient.del(`user:${participantId}:conversations`);
    }
    
    res.json(conv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/users/search', async (req, res) => {
  try {
    const { q } = req.query;
    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ],
      _id: { $ne: req.user.id }
    }).limit(20);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Online kullanıcıları Redis'ten al
router.get('/users/online', async (req, res) => {
  try {
    const onlineUserIds = await redisClient.sMembers('online_users');
    const users = await User.find({ 
      _id: { $in: onlineUserIds },
      _id: { $ne: req.user.id }
    }).select('username email isOnline');
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;