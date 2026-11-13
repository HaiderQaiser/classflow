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

  // Schedule Revision History Modal State
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisions, setRevisions] = useState([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);

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

  const fetchScheduleRevisions = async (scheduleId) => {
    setLoadingRevisions(true);
    setShowRevisionModal(true);
    try {
      const response = await API.get(`/api/schedules/${scheduleId}/revisions`);
      setRevisions(response.data || []);
    } catch (err) {
      console.error('Error fetching schedule revisions:', err);
      setError('Failed to fetch revision history.');
    } finally {
      setLoadingRevisions(false);
    }
  };

  // Handlers
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await API.post('/api/class-groups/', { class_name: className, group_name: groupName });
      setMessage(`Class Group '${className} — ${groupName}' created successfully!`);
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

  const displayName = user?.first_name 
    ? `${user.first_name} ${user.last_name || ''}`.trim() 
    : (user?.username || 'Admin');

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.brand}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>ClassFlow</h2>
          <span style={styles.badge}>Admin Portal</span>
        </div>
        <div style={styles.userInfo}>
          <span>Logged in as: <strong>{user?.first_name ? `${user.first_name} ${user.last_name || ''}` : (user?.username || 'Admin')}</strong></span>
          <button onClick={logout} style={styles.logoutBtn}>Logout</button>
        </div>
      </header>

      <main style={styles.content}>
        {message && <div style={styles.successAlert}>{message}</div>}
        {error && <div style={styles.errorAlert}>{error}</div>}

        {/* Schedule Builder Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>🗓️ Publish Daily Schedule</h3>
            <button
              type="button"
              onClick={handleCopyPreviousSchedule}
              style={styles.copyBtn}
            >
              📋 Copy Previous Schedule
            </button>
          </div>

          <form onSubmit={handleCreateSchedule} style={styles.form}>
            <div style={styles.rowTwoCol}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Select Class Group:</label>
                <select
                  value={scheduleGroupId}
                  onChange={(e) => setScheduleGroupId(e.target.value)}
                  style={styles.input}
                  required
                >
                  {classGroups.map((group) => (
                    <option key={group.id} value={group.id} style={styles.option}>
                      {group.class_name} — {group.group_name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.fieldGroup}>
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

            <h4 style={{ marginTop: '16px', marginBottom: '8px', color: '#1e293b' }}>Class Slots</h4>
            {slots.map((slot, index) => (
              <div key={index} style={styles.slotRow}>
                <input
                  type="text"
                  placeholder="Subject (e.g. Physics)"
                  value={slot.subject}
                  onChange={(e) => handleSlotChange(index, 'subject', e.target.value)}
                  required
                  style={{ ...styles.input, flex: '2 1 180px' }}
                />
                <input
                  type="text"
                  placeholder="Teacher (e.g. Sir Ahmed)"
                  value={slot.teacher_name}
                  onChange={(e) => handleSlotChange(index, 'teacher_name', e.target.value)}
                  required
                  style={{ ...styles.input, flex: '2 1 180px' }}
                />
                <input
                  type="time"
                  value={slot.start_time}
                  onChange={(e) => handleSlotChange(index, 'start_time', e.target.value)}
                  required
                  style={{ ...styles.input, flex: '1 1 120px' }}
                />
                <input
                  type="time"
                  value={slot.end_time}
                  onChange={(e) => handleSlotChange(index, 'end_time', e.target.value)}
                  required
                  style={{ ...styles.input, flex: '1 1 120px' }}
                />
                {slots.length > 1 && (
                  <button type="button" onClick={() => removeSlotRow(index)} style={styles.deleteBtn} title="Remove slot">
                    ❌
                  </button>
                )}
              </div>
            ))}

            <div style={styles.btnRow}>
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
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>📋 Live Published Schedule — Actions</h3>
            {publishedSchedule && (
              <button
                type="button"
                onClick={() => fetchScheduleRevisions(publishedSchedule.id)}
                style={styles.historyBtn}
              >
                📜 View History Logs
              </button>
            )}
          </div>

          {!publishedSchedule ? (
            <p style={{ color: '#64748b', margin: '10px 0 0 0' }}>No published schedule found for the selected date and class group.</p>
          ) : (
            <div>
              <p style={{ color: '#16a34a', fontWeight: '600', marginBottom: '12px' }}>
                Status: Published (Date: {publishedSchedule.schedule_date})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {publishedSchedule.slots.map((slot) => (
                  <div
                    key={slot.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      backgroundColor: slot.is_cancelled ? '#fef2f2' : '#f8fafc',
                      borderLeft: slot.is_cancelled ? '5px solid #ef4444' : '5px solid #22c55e',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div>
                      <strong style={{ color: '#1e293b' }}>{slot.subject}</strong> — <em style={{ color: '#475569' }}>{slot.teacher_name}</em> ({formatTime(slot.start_time)} to {formatTime(slot.end_time)})
                      {slot.is_cancelled && (
                        <span style={{ marginLeft: '10px', color: '#ef4444', fontWeight: 'bold', fontSize: '12px' }}>
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
                        color: '#ffffff',
                        backgroundColor: slot.is_cancelled ? '#16a34a' : '#dc2626'
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

        {/* Declare Holiday Card */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>🏖️ Declare Center-Wide Holiday</h3>
          <form onSubmit={handleCreateHoliday} style={styles.form}>
            <div style={styles.rowTwoCol}>
              <div style={{ flex: '1 1 200px' }}>
                <label style={styles.label}>Holiday Date:</label>
                <input
                  type="date"
                  value={holidayDate}
                  onChange={(e) => setHolidayDate(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
              <div style={{ flex: '2 1 250px' }}>
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
            <button type="submit" style={{ ...styles.submitBtn, backgroundColor: '#ea580c', alignSelf: 'flex-start' }}>
              📢 Announce Holiday
            </button>
          </form>

          <h4 style={{ marginTop: '20px', marginBottom: '10px', color: '#1e293b' }}>Active Declared Holidays</h4>
          {holidays.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>No active holidays declared.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {holidays.map((h) => (
                <div
                  key={h.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 15px',
                    backgroundColor: '#fff7ed',
                    borderRadius: '6px',
                    borderLeft: '5px solid #ea580c',
                    border: '1px solid #ffedd5'
                  }}
                >
                  <div style={{ color: '#1e293b' }}>
                    <strong>Date: {h.holiday_date}</strong> — Reason: <em>{h.reason}</em>
                  </div>
                  <button
                    onClick={() => handleRemoveHoliday(h.holiday_date)}
                    style={{
                      padding: '5px 12px',
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
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
          {/* Class Groups Management */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Class Groups Management</h3>
            <form onSubmit={handleCreateGroup} style={styles.form}>
              <h4 style={{ margin: '5px 0 0 0', color: '#334155' }}>Add New Class Group</h4>
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

            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #f1f5f9' }} />

            <h4 style={{ margin: '0 0 10px 0', color: '#334155' }}>Active Groups List</h4>
            {loading ? (
              <p style={{ color: '#64748b' }}>Loading class groups...</p>
            ) : classGroups.length === 0 ? (
              <p style={{ color: '#64748b' }}>No class groups found.</p>
            ) : (
              <ul style={styles.list}>
                {classGroups.map((group) => (
                  <li key={group.id} style={styles.listItem}>
                    <strong style={{ color: '#1e293b' }}>{group.class_name}</strong> — {group.group_name} <span style={{ color: '#64748b', fontSize: '12px' }}>(ID: {group.id})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Register New Student */}
          <div style={{ ...styles.card, alignSelf: 'flex-start', height: 'fit-content' }}>
            <h3 style={styles.cardTitle}>Register New Student</h3>
            <form onSubmit={handleCreateStudent} style={styles.form} autoComplete="off">
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Roll No / Username:</label>
                <input
                  type="text"
                  placeholder="e.g. std_1003"
                  value={studentUsername}
                  onChange={(e) => setStudentUsername(e.target.value)}
                  required
                  style={styles.input}
                  autoComplete="off"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 140px' }}>
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
                <div style={{ flex: '1 1 140px' }}>
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

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Password:</label>
                <input
                  type="password"
                  placeholder="Password"
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  required
                  style={styles.input}
                  autoComplete="new-password"
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Assign Class Group:</label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  style={styles.input}
                  required
                >
                  {classGroups.map((group) => (
                    <option key={group.id} value={group.id} style={styles.option}>
                      {group.class_name} — {group.group_name}
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" style={{ ...styles.submitBtn, backgroundColor: '#16a34a' }}>
                Register Student Account
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Schedule Revision History Modal Overlay */}
      {showRevisionModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#1e293b' }}>📜 Schedule Revision History</h3>
              <button onClick={() => setShowRevisionModal(false)} style={styles.closeModalBtn}>✖ Close</button>
            </div>

            {loadingRevisions ? (
              <p style={{ color: '#64748b' }}>Loading revision logs...</p>
            ) : revisions.length === 0 ? (
              <p style={{ color: '#64748b', padding: '15px 0' }}>
                No revisions found for this schedule. (This schedule has not been edited / re-published yet).
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '420px', overflowY: 'auto' }}>
                {revisions.map((rev) => (
                  <div key={rev.id} style={styles.revisionCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                      <span style={{ fontWeight: 'bold', color: '#1e293b' }}>Revision #{rev.revision_number}</span>
                      <small style={{ color: '#64748b' }}>
                        Archived at: {rev.created_at ? new Date(rev.created_at).toLocaleString() : 'N/A'}
                      </small>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {Array.isArray(rev.slots_snapshot) && rev.slots_snapshot.length > 0 ? (
                        rev.slots_snapshot.map((slot, idx) => (
                          <div key={idx} style={styles.revisionSlot}>
                            <span><strong>{slot.subject}</strong> — <em>{slot.teacher_name}</em> ({formatTime(slot.start_time)} to {formatTime(slot.end_time)})</span>
                            {slot.is_cancelled && (
                              <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '11px' }}>[CANCELLED]</span>
                            )}
                          </div>
                        ))
                      ) : (
                        <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Empty slots snapshot.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    minHeight: '100vh',
    backgroundColor: '#f4f6f9',
    color: '#1e293b'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 32px',
    backgroundColor: '#1e293b',
    color: '#ffffff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  badge: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontSize: '11px',
    padding: '3px 8px',
    borderRadius: '12px',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    fontSize: '14px',
    color: '#ffffff'
  },
  logoutBtn: {
    backgroundColor: '#dc2626',
    color: '#ffffff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '13px'
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px 16px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '24px',
    alignItems: 'flex-start'
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '10px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid #e2e8f0',
    marginBottom: '24px',
  },
  cardHeader: {
    display: 'flex',
    justify: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '16px'
  },
  cardTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '700',
    color: '#1e293b'
  },
  form: { 
    display: 'flex', 
    flexDirection: 'column', 
    justifyContent: 'flex-start', 
    alignItems: 'stretch',
    gap: '14px',
    height: 'auto' 
  },
  rowTwoCol: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap'
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  slotRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: '4px'
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155'
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#ffffff',
    color: '#1e293b'
  },
  option: {
    backgroundColor: '#ffffff',
    color: '#1e293b'
  },
  btnRow: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
    flexWrap: 'wrap'
  },
  submitBtn: {
    padding: '10px 18px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer'
  },
  publishBtn: {
    padding: '10px 20px',
    backgroundColor: '#16a34a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer'
  },
  addSlotBtn: {
    padding: '10px 16px',
    backgroundColor: '#7c3aed',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer'
  },
  copyBtn: {
    padding: '8px 14px',
    backgroundColor: '#0891b2',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '13px'
  },
  historyBtn: {
    padding: '8px 14px',
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '13px'
  },
  deleteBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px 8px'
  },
  list: {
    listStyleType: 'none',
    padding: 0,
    margin: 0
  },
  listItem: {
    backgroundColor: '#f8fafc',
    padding: '10px 14px',
    marginBottom: '8px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    color: '#334155'
  },
  successAlert: {
    padding: '12px 16px',
    backgroundColor: '#dcfce7',
    color: '#15803d',
    border: '1px solid #bbf7d0',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    fontWeight: '500'
  },
  errorAlert: {
    padding: '12px 16px',
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    fontWeight: '500'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    justify: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '640px',
    maxHeight: '85vh',
    overflowY: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
  },
  closeModalBtn: {
    backgroundColor: '#dc2626',
    color: '#ffffff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '13px'
  },
  revisionCard: {
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '14px',
    backgroundColor: '#f8fafc'
  },
  revisionSlot: {
    display: 'flex',
    justify: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: '#ffffff',
    borderRadius: '6px',
    border: '1px solid #f1f5f9',
    fontSize: '13px',
    color: '#334155'
  }
};

export default AdminDashboard;