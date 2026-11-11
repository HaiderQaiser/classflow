import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [classGroups, setClassGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Class Groups Fetching
  useEffect(() => {
    fetchClassGroups();
  }, []);

  const fetchClassGroups = async () => {
    try {
      const response = await API.get('/api/class-groups/');
      setClassGroups(response.data);
    } catch (err) {
      console.error('Error fetching class groups:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h2>ClassFlow — Admin Portal</h2>
        <div>
          <span style={{ marginRight: '15px' }}>Logged in as: <strong>{user.full_name}</strong></span>
          <button onClick={logout} style={styles.logoutBtn}>Logout</button>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.content}>
        <h3>Active Class Groups</h3>
        {loading ? (
          <p>Loading class groups...</p>
        ) : classGroups.length === 0 ? (
          <p>No class groups found. Add your first class group via Swagger or API.</p>
        ) : (
          <ul style={styles.list}>
            {classGroups.map((group) => (
              <li key={group.id} style={styles.listItem}>
                <strong>{group.class_name}</strong> — {group.group_name}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
};

const styles = {
  container: { fontFamily: 'sans-serif', minHeight: '100vh', backgroundColor: '#f8f9fa' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px', backgroundColor: '#2c3e50', color: '#fff' },
  logoutBtn: { backgroundColor: '#e74c3c', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '4px', cursor: 'pointer' },
  content: { padding: '30px' },
  list: { listStyleType: 'none', padding: 0 },
  listItem: { backgroundColor: '#fff', padding: '12px 18px', marginBottom: '10px', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }
};

export default AdminDashboard;