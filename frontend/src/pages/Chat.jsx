import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import ConversationList from '../components/ConversationList';
import ChatWindow from '../components/ChatWindow';
import UserSearch from '../components/UserSearch';
import { LogOut, Search } from 'lucide-react';
import '../styles/Chat.css';

function Chat({ user, token, onLogout }) {
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_SOCKET_URL, {
      auth: { token }
    });

    newSocket.on('connect', () => console.log('Connected'));
    newSocket.on('new_message', () => loadConversations());
    newSocket.on('user_status', () => loadConversations());

    setSocket(newSocket);
    loadConversations();

    return () => newSocket.close();
  }, [token]);

  const loadConversations = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/chat/conversations`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConversations(response.data);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
    setShowSearch(false);
  };

  const handleUserSelect = async (selectedUser) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/chat/conversations`,
        { participantIds: [selectedUser._id] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await loadConversations();
      setSelectedConversation(response.data);
      setShowSearch(false);
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  const userInitial = user?.username?.[0]?.toUpperCase() || 'U';

  return (
    <div className="chat-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="logo-section">
            <div className="user-avatar">{userInitial}</div>
            <div>
              <h3>ChatFlow</h3>
              <p>{user?.username || 'User'}</p>
            </div>
          </div>
          <div className="header-actions">
            <button onClick={() => setShowSearch(!showSearch)} className="icon-btn">
              <Search size={20} />
            </button>
            <button onClick={onLogout} className="icon-btn logout-btn">
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {showSearch ? (
          <UserSearch token={token} onUserSelect={handleUserSelect} />
        ) : (
          <ConversationList
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelect={handleConversationSelect}
          />
        )}
      </div>

      <div className="main-chat">
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            user={user}
            token={token}
            socket={socket}
          />
        ) : (
          <div className="no-chat-selected">
            <div className="empty-state">
              <h2>Welcome to ChatFlow</h2>
              <p>Select a conversation or search for users to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;