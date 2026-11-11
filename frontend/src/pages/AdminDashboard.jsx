import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [classGroups, setClassGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Class Group Form State
  const [className, setClassName] = useState('');
  const [groupName, setGroupName] = useState('');

  // New Student Form State
  const [studentUsername, setStudentUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');

  // Status & Feedback Messages
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClassGroups();
  }, []);

  const fetchClassGroups = async () => {
    try {
      const response = await API.get('/api/class-groups/');
      setClassGroups(response.data);
      if (response.data.length > 0) {
        setSelectedGroupId(response.data[0].id);
      }
    } catch (err) {
      console.error('Error fetching class groups:', err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Create Class Group Handler
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await API.post('/api/class-groups/', {
        class_name: className,
        group_name: groupName
      });
      setMessage(`Class Group '${className} - ${groupName}' created successfully!`);
      setClassName('');
      setGroupName('');
      fetchClassGroups(); // List refresh karein
    } catch (err) {
      setError(err.response?.data?.detail || 'Class Group create karne mein masla aaya.');
    }
  };

  // 2. Create Student Handler
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await API.post('/api/users/students', {
        username: studentUsername,
        first_name: firstName,
        last_name: lastName,
        password: studentPassword,
        role: 'student',
        class_group_id: parseInt(selectedGroupId, 10),
        is_active: true
      });
      setMessage(`Student '${studentUsername}' created successfully!`);
      setStudentUsername('');
      setFirstName('');
      setLastName('');
      setStudentPassword('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Student account create karne mein masla aaya.');
    }
  };

  return (
    <div style={styles.container}>
      {/* Navbar */}
      <header style={styles.header}>
        <h2>ClassFlow — Admin Portal</h2>
        <div>
          <span style={{ marginRight: '15px' }}>Logged in as: <strong>{user.full_name}</strong></span>
          <button onClick={logout} style={styles.logoutBtn}>Logout</button>
        </div>
      </header>

      <main style={styles.content}>
        {/* Alerts */}
        {message && <div style={styles.successAlert}>{message}</div>}
        {error && <div style={styles.errorAlert}>{error}</div>}

        <div style={styles.grid}>
          {/* Column 1: Active Class Groups List & Create Group Form */}
          <div style={styles.card}>
            <h3>Class Groups Management</h3>
            
            <form onSubmit={handleCreateGroup} style={styles.form}>
              <h4>Add New Class Group</h4>
              <input
                type="text"
                placeholder="Class Name (e.g. Class 11)"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                required
                style={styles.input}
              />
              <input
                type="text"
                placeholder="Group Name (e.g. Pre-Medical)"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
                style={styles.input}
              />
              <button type="submit" style={styles.submitBtn}>Create Class Group</button>
            </form>

            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #eee' }} />

            <h4>Active Groups List</h4>
            {loading ? (
              <p>Loading class groups...</p>
            ) : classGroups.length === 0 ? (
              <p>No class groups found.</p>
            ) : (
              <ul style={styles.list}>
                {classGroups.map((group) => (
                  <li key={group.id} style={styles.listItem}>
                    <strong>{group.class_name}</strong> — {group.group_name} (ID: {group.id})
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Column 2: Create Student Account Form */}
          <div style={styles.card}>
            <h3>Register New Student</h3>
            <form onSubmit={handleCreateStudent} style={styles.form}>
              <label style={styles.label}>Roll No / Username:</label>
              <input
                type="text"
                placeholder="e.g. std_1002"
                value={studentUsername}
                onChange={(e) => setStudentUsername(e.target.value)}
                required
                style={styles.input}
              />

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>First Name:</label>
                  <input
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    style={styles.input}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Last Name:</label>
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    style={styles.input}
                  />
                </div>
              </div>

              <label style={styles.label}>Password:</label>
              <input
                type="password"
                placeholder="Password"
                value={studentPassword}
                onChange={(e) => setStudentPassword(e.target.value)}
                required
                style={styles.input}
              />

              <label style={styles.label}>Assign Class Group:</label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                style={styles.input}
                required
              >
                {classGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.class_name} — {group.group_name}
                  </option>
                ))}
              </select>

              <button type="submit" style={{ ...styles.submitBtn, backgroundColor: '#27ae60' }}>
                Register Student Account
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

const styles = {
  container: { fontFamily: 'sans-serif', minHeight: '100vh', backgroundColor: '#f4f6f9' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px', backgroundColor: '#2c3e50', color: '#fff' },
  logoutBtn: { backgroundColor: '#e74c3c', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '4px', cursor: 'pointer' },
  content: { padding: '30px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '25px' },
  card: { backgroundColor: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' },
  label: { fontSize: '13px', fontWeight: 'bold', color: '#555' },
  input: { padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' },
  submitBtn: { padding: '10px', backgroundColor: '#3498db', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px' },
  list: { listStyleType: 'none', padding: 0 },
  listItem: { backgroundColor: '#f8f9fa', padding: '10px 14px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #e9ecef' },
  successAlert: { padding: '12px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '6px', marginBottom: '20px' },
  errorAlert: { padding: '12px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '6px', marginBottom: '20px' }
};

export default AdminDashboard;