import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [classGroups, setClassGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms State
  const [className, setClassName] = useState('');
  const [groupName, setGroupName] = useState('');

  const [studentUsername, setStudentUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const [scheduleGroupId, setScheduleGroupId] = useState('');
  const [scheduleDate, setScheduleDate] = useState(todayStr);
  const [slots, setSlots] = useState([
    { subject: '', start_time: '16:00', end_time: '17:00', teacher_name: '', is_cancelled: false }
  ]);

  const [holidayDate, setHolidayDate] = useState(todayStr);
  const [holidayReason, setHolidayReason] = useState('');
  const [holidays, setHolidays] = useState([]);

  // Live Published Schedule View State
  const [publishedSchedule, setPublishedSchedule] = useState(null);

  // Alerts
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClassGroups();
    fetchHolidays();
  }, []);

  useEffect(() => {
    if (scheduleGroupId && scheduleDate) {
      fetchPublishedSchedule(scheduleGroupId, scheduleDate);
    }
  }, [scheduleGroupId, scheduleDate]);

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

  const fetchHolidays = async () => {
    try {
      const response = await API.get('/api/schedules/holidays');
      setHolidays(response.data);
    } catch (err) {
      console.error('Error fetching holidays:', err);
    }
  };

  const fetchPublishedSchedule = async (groupId, dateStr) => {
    try {
      const response = await API.get(`/api/schedules/group/${groupId}?schedule_date=${dateStr}`);
      setPublishedSchedule(response.data?.schedule || null);
    } catch (err) {
      console.error('Error fetching published schedule:', err);
    }
  };

  // Handlers
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await API.post('/api/class-groups/', { class_name: className, group_name: groupName });
      setMessage(`Class Group '${className} - ${groupName}' created successfully!`);
      setClassName('');
      setGroupName('');
      fetchClassGroups();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create Class Group.');
    }
  };

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
      setError(err.response?.data?.detail || 'Failed to create student account.');
    }
  };

  const handleSlotChange = (index, field, value) => {
    const updatedSlots = [...slots];
    updatedSlots[index][field] = value;
    setSlots(updatedSlots);
  };

  const addSlotRow = () => {
    setSlots([...slots, { subject: '', start_time: '17:00', end_time: '18:00', teacher_name: '', is_cancelled: false }]);
  };

  const removeSlotRow = (index) => {
    if (slots.length === 1) return;
    setSlots(slots.filter((_, i) => i !== index));
  };

  const handleCopyPreviousSchedule = async () => {
    setMessage('');
    setError('');
    try {
      const response = await API.get(`/api/schedules/previous/${scheduleGroupId}?before_date=${scheduleDate}`);
      if (response.data?.schedule?.slots && response.data.schedule.slots.length > 0) {
        setSlots(response.data.schedule.slots);
        setMessage(`Successfully loaded schedule slots from previous date (${response.data.schedule.schedule_date})!`);
      } else {
        setError('No previous schedule found for this class group.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to copy previous schedule.');
    }
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

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
      setSlots([{ subject: '', start_time: '16:00', end_time: '17:00', teacher_name: '', is_cancelled: false }]);
      fetchPublishedSchedule(scheduleGroupId, scheduleDate);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to publish schedule.');
    }
  };

  const handleToggleSlotCancel = async (slotId) => {
    setMessage('');
    setError('');
    try {
      await API.put(`/api/schedules/slots/${slotId}/cancel`);
      setMessage('Slot status updated successfully!');
      fetchPublishedSchedule(scheduleGroupId, scheduleDate);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update slot status.');
    }
  };

  const handleCreateHoliday = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await API.post('/api/schedules/holidays', {
        holiday_date: holidayDate,
        reason: holidayReason
      });
      setMessage(`Holiday declared for ${holidayDate} successfully!`);
      setHolidayReason('');
      fetchHolidays();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to declare holiday.');
    }
  };

  const handleRemoveHoliday = async (hDate) => {
    setMessage('');
    setError('');
    try {
      await API.delete(`/api/schedules/holidays/${hDate}`);
      setMessage(`Holiday for ${hDate} revoked successfully!`);
      fetchHolidays();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to revoke holiday.');
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${minutes} ${ampm}`;
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2>ClassFlow — Admin Portal</h2>
        <div>
          <span style={{ marginRight: '15px' }}>Logged in as: <strong>{user.full_name}</strong></span>
          <button onClick={logout} style={styles.logoutBtn}>Logout</button>
        </div>
      </header>

      <main style={styles.content}>
        {message && <div style={styles.successAlert}>{message}</div>}
        {error && <div style={styles.errorAlert}>{error}</div>}

        {/* Schedule Builder */}
        <div style={{ ...styles.card, marginBottom: '25px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <h3>🗓️ Publish Daily Schedule</h3>
            <button
              type="button"
              onClick={handleCopyPreviousSchedule}
              style={styles.copyBtn}
            >
              📋 Copy Previous Schedule
            </button>
          </div>

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
                  <button type="button" onClick={() => removeSlotRow(index)} style={styles.deleteBtn}>
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

        {/* Live Published Schedule & Actions View */}
        <div style={{ ...styles.card, marginBottom: '25px' }}>
          <h3>📋 Live Published Schedule — Actions</h3>
          {!publishedSchedule ? (
            <p style={{ color: '#666' }}>No published schedule found for the selected date and class group.</p>
          ) : (
            <div>
              <p style={{ color: '#27ae60', fontWeight: 'bold' }}>
                Status: Published (Date: {publishedSchedule.schedule_date})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                {publishedSchedule.slots.map((slot) => (
                  <div
                    key={slot.id}
                    style={{
                      display: 'flex',
                      justify: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      backgroundColor: slot.is_cancelled ? '#fdf2f2' : '#f8f9fa',
                      borderLeft: slot.is_cancelled ? '5px solid #e74c3c' : '5px solid #2ecc71',
                      border: '1px solid #e9ecef'
                    }}
                  >
                    <div>
                      <strong>{slot.subject}</strong> — <em>{slot.teacher_name}</em> ({formatTime(slot.start_time)} to {formatTime(slot.end_time)})
                      {slot.is_cancelled && (
                        <span style={{ marginLeft: '10px', color: '#e74c3c', fontWeight: 'bold', fontSize: '12px' }}>
                          [CANCELLED]
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleToggleSlotCancel(slot.id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        color: '#fff',
                        backgroundColor: slot.is_cancelled ? '#27ae60' : '#e74c3c'
                      }}
                    >
                      {slot.is_cancelled ? 'Restore Slot' : 'Cancel Slot'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Holiday Management Section */}
        <div style={{ ...styles.card, marginBottom: '25px' }}>
          <h3>🏖️ Declare Center-Wide Holiday</h3>
          <form onSubmit={handleCreateHoliday} style={styles.form}>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={styles.label}>Holiday Date:</label>
                <input
                  type="date"
                  value={holidayDate}
                  onChange={(e) => setHolidayDate(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
              <div style={{ flex: 2, minWidth: '250px' }}>
                <label style={styles.label}>Reason / Announcement:</label>
                <input
                  type="text"
                  placeholder="e.g. Heavy Rain / Public Holiday"
                  value={holidayReason}
                  onChange={(e) => setHolidayReason(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
            </div>
            <button type="submit" style={{ ...styles.submitBtn, backgroundColor: '#e67e22', alignSelf: 'flex-start' }}>
              📢 Announce Holiday
            </button>
          </form>

          {/* Active Holidays List */}
          <h4 style={{ marginTop: '20px', marginBottom: '10px' }}>Active Declared Holidays</h4>
          {holidays.length === 0 ? (
            <p style={{ color: '#666', fontSize: '14px' }}>No active holidays declared.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {holidays.map((h) => (
                <div
                  key={h.id}
                  style={{
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    padding: '10px 15px',
                    backgroundColor: '#fff3cd',
                    borderRadius: '6px',
                    borderLeft: '5px solid #e67e22',
                    border: '1px solid #ffeeba'
                  }}
                >
                  <div>
                    <strong>Date: {h.holiday_date}</strong> — Reason: <em>{h.reason}</em>
                  </div>
                  <button
                    onClick={() => handleRemoveHoliday(h.holiday_date)}
                    style={{
                      padding: '5px 12px',
                      backgroundColor: '#dc3545',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    🗑️ Revoke Holiday
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Management Grid */}
        <div style={styles.grid}>
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
  copyBtn: { padding: '8px 14px', backgroundColor: '#17a2b8', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' },
  deleteBtn: { backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px' },
  list: { listStyleType: 'none', padding: 0 },
  listItem: { backgroundColor: '#f8f9fa', padding: '10px 14px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #e9ecef' },
  successAlert: { padding: '12px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '6px', marginBottom: '20px' },
  errorAlert: { padding: '12px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '6px', marginBottom: '20px' }
};

export default AdminDashboard;