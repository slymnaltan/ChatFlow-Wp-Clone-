import React, { useState } from 'react';
import axios from 'axios';
import '../styles/UserSearch.css';

function UserSearch({ token, onUserSelect }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/chat/users/search?q=${query}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSearchResults(response.data);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-search">
      <div className="search-input-container">
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          autoFocus
        />
      </div>
      <div className="search-results">
        {loading && <div className="search-loading">Searching...</div>}
        {!loading && searchQuery.length >= 2 && searchResults.length === 0 && (
          <div className="no-results">No users found</div>
        )}
        {searchResults.map((user) => (
          <div key={user._id} className="search-result-item" onClick={() => onUserSelect(user)}>
            <div className="user-avatar">{user.username[0].toUpperCase()}</div>
            <div className="user-details">
              <h4>{user.username}</h4>
              <p>{user.email}</p>
            </div>
            {user.isOnline && <span className="online-indicator"></span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default UserSearch;