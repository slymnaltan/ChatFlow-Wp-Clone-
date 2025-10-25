import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, ArrowLeft } from 'lucide-react';
import '../styles/ChatWindow.css';

function ChatWindow({ conversation, user, token, socket, onBack }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadMessages();
  }, [conversation._id]);

  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (message) => {
      if (message.conversation === conversation._id) {
        setMessages(prev => [...prev, message]);
      }
    };
    socket.on('new_message', handleNewMessage);
    return () => socket.off('new_message', handleNewMessage);
  }, [socket, conversation._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/chat/conversations/${conversation._id}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(response.data);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;
    socket.emit('send_message', {
      conversationId: conversation._id,
      content: newMessage.trim()
    });
    setNewMessage('');
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const otherUser = conversation.participants?.find(p => p._id !== user.id);

  return (
    <div className="chat-window">
      <div className="chat-header">
        <button className="back-btn mobile-only" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <div className="header-info">
          <h3>{otherUser?.username || 'Chat'}</h3>
          <span className="status">{otherUser?.isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      <div className="messages-container">
        {loading ? (
          <div className="loading">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="no-messages">
            <p>Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg._id} className={`message ${msg.sender._id === user.id ? 'sent' : 'received'}`}>
              <div className="message-content">
                {msg.sender._id !== user.id && (
                  <span className="message-sender">{msg.sender.username}</span>
                )}
                <p>{msg.content}</p>
                <span className="message-time">{formatTime(msg.createdAt)}</span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="message-input" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          autoFocus
        />
        <button type="submit" disabled={!newMessage.trim()}>
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}

export default ChatWindow;