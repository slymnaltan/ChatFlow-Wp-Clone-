import React from 'react';
import '../styles/ConversationList.css';

function ConversationList({ conversations, selectedConversation, onSelect }) {
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 86400000) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diff < 604800000) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="conversation-list">
      {conversations.length === 0 ? (
        <div className="no-conversations">
          <p>No conversations</p>
          <p className="hint">Search for users to start</p>
        </div>
      ) : (
        conversations.map((conv) => (
          <div
            key={conv._id}
            className={`conversation-item ${selectedConversation?._id === conv._id ? 'active' : ''}`}
            onClick={() => onSelect(conv)}
          >
            <div className="conv-avatar">
              {conv.participants?.[0]?.username[0]?.toUpperCase() || 'C'}
            </div>
            <div className="conv-info">
              <div className="conv-header">
                <h4>{conv.participants?.map(p => p.username).join(', ') || 'Chat'}</h4>
                <span className="conv-time">{formatTime(conv.updatedAt)}</span>
              </div>
              <p className="last-message">
                {conv.lastMessage?.content || 'No messages yet'}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default ConversationList;