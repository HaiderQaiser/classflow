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

  // Schedule Creation Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const [scheduleGroupId, setScheduleGroupId] = useState('');
  const [scheduleDate, setScheduleDate] = useState(todayStr);
  const [slots, setSlots] = useState([
    { subject: '', start_time: '16:00', end_time: '17:00', teacher_name: '', is_cancelled: false }
  ]);

  // Alerts
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
        setScheduleGroupId(response.data[0].id);
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
      fetchClassGroups();
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

  // 3. Dynamic Slots Handlers
  const handleSlotChange = (index, field, value) => {
    const updatedSlots = [...slots];
    updatedSlots[index][field] = value;
    setSlots(updatedSlots);
  };

  const addSlotRow = () => {
    setSlots([
      ...slots,
      { subject: '', start_time: '17:00', end_time: '18:00', teacher_name: '', is_cancelled: false }
    ]);
  };

  const removeSlotRow = (index) => {
    if (slots.length === 1) return;
    setSlots(slots.filter((_, i) => i !== index));
  };

  // 4. Schedule Submit Handler
  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // Format times with :00 for backend specs (HH:MM:SS)
    const formattedSlots = slots.map(s => ({
      ...s,
      start_time: s.start_time.length === 5 ? `${s.start_time}:00` : s.start_time,
      end_time: s.end_time.length === 5 ? `${s.end_time}:00` : s.end_time,
    }));

    try {
      await API.post('/api/schedules/', {
        class_group_id: parseInt(scheduleGroupId, 10),
        schedule_date: scheduleDate,
        status: 'published',
        slots: formattedSlots
      });
      setMessage(`Schedule for Date ${scheduleDate} published successfully!`);
      // Reset slots to initial state
      setSlots([{ subject: '', start_time: '16:00', end_time: '17:00', teacher_name: '', is_cancelled: false }]);
    } catch (err) {
      setError(err.response?.data?.detail || 'Schedule publish karne mein masla aaya.');
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

        {/* Section 1: Daily Schedule Builder */}
        <div style={{ ...styles.card, marginBottom: '25px' }}>
          <h3>🗓️ Publish Daily Schedule</h3>
          <form onSubmit={handleCreateSchedule} style={styles.form}>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={styles.label}>Select Class Group:</label>
                <select
                  value={scheduleGroupId}
                  onChange={(e) => setScheduleGroupId(e.target.value)}
                  style={styles.input}
                  required
                >
                  {classGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.class_name} — {group.group_name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={styles.label}>Schedule Date:</label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
            </div>

            <h4 style={{ marginTop: '15px', marginBottom: '5px' }}>Class Slots</h4>
            {slots.map((slot, index) => (
              <div key={index} style={styles.slotRow}>
                <input
                  type="text"
                  placeholder="Subject (e.g. Physics)"
                  value={slot.subject}
                  onChange={(e) => handleSlotChange(index, 'subject', e.target.value)}
                  required
                  style={{ ...styles.input, flex: 2 }}
                />
                <input
                  type="text"
                  placeholder="Teacher (e.g. Sir Ahmed)"
                  value={slot.teacher_name}
                  onChange={(e) => handleSlotChange(index, 'teacher_name', e.target.value)}
                  required
                  style={{ ...styles.input, flex: 2 }}
                />
                <input
                  type="time"
                  value={slot.start_time}
                  onChange={(e) => handleSlotChange(index, 'start_time', e.target.value)}
                  required
                  style={{ ...styles.input, flex: 1 }}
                />
                <input
                  type="time"
                  value={slot.end_time}
                  onChange={(e) => handleSlotChange(index, 'end_time', e.target.value)}
                  required
                  style={{ ...styles.input, flex: 1 }}
                />
                {slots.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSlotRow(index)}
                    style={styles.deleteBtn}
                  >
                    ❌
                  </button>
                )}
              </div>
            ))}

            <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
              <button type="button" onClick={addSlotRow} style={styles.addSlotBtn}>
                ➕ Add Another Subject Slot
              </button>
              <button type="submit" style={styles.publishBtn}>
                🚀 Publish Schedule
              </button>
            </div>
          </form>
        </div>

        {/* Section 2: Management Grid */}
        <div style={styles.grid}>
          {/* Class Groups */}
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

          {/* Student Registration */}
          <div style={styles.card}>
            <h3>Register New Student</h3>
            <form onSubmit={handleCreateStudent} style={styles.form}>
              <label style={styles.label}>Roll No / Username:</label>
              <input
                type="text"
                placeholder="e.g. std_1003"
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
  slotRow: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '5px' },
  label: { fontSize: '13px', fontWeight: 'bold', color: '#555' },
  input: { padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' },
  submitBtn: { padding: '10px', backgroundColor: '#3498db', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' },
  publishBtn: { padding: '10px 20px', backgroundColor: '#27ae60', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' },
  addSlotBtn: { padding: '10px 15px', backgroundColor: '#8e44ad', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' },
  deleteBtn: { backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px' },
  list: { listStyleType: 'none', padding: 0 },
  listItem: { backgroundColor: '#f8f9fa', padding: '10px 14px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #e9ecef' },
  successAlert: { padding: '12px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '6px', marginBottom: '20px' },
  errorAlert: { padding: '12px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '6px', marginBottom: '20px' }
};

export default AdminDashboard;