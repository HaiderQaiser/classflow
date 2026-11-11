import React, { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import LoginPage from './pages/LoginPage';

function App() {
  const { user, logout } = useContext(AuthContext);

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>ClassFlow Dashboard</h1>
      <p>Logged in as: <strong>{user.full_name}</strong> ({user.role})</p>
      <button 
        onClick={logout}
        style={{ padding: '8px 16px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        Logout
      </button>
    </div>
  );
}

export default App;