import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';

const StudentDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTodaySchedule();
  }, []);

  const fetchTodaySchedule = async () => {
    try {
      const response = await API.get('/api/schedules/today');
      setScheduleData(response.data);
    } catch (err) {
      console.error('Error fetching today schedule:', err);
      setError('Schedule load karne mein masla aaya. Dobara try karein.');
    } finally {
      setLoading(false);
    }
  };

  // Time formatter helper (e.g. "16:00:00" -> "4:00 PM")
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
        <h2>ClassFlow — Student Portal</h2>
        <div>
          <span style={{ marginRight: '15px' }}>Logged in as: <strong>{user.full_name}</strong></span>
          <button onClick={logout} style={styles.logoutBtn}>Logout</button>
        </div>
      </header>

      <main style={styles.content}>
        <div style={styles.card}>
          <h3>📅 Today's Schedule</h3>

          {loading ? (
            <p style={{ color: '#666' }}>Loading schedule...</p>
          ) : error ? (
            <div style={styles.errorAlert}>{error}</div>
          ) : scheduleData?.is_holiday ? (
            <div style={styles.holidayAlert}>
              <h3>🎉 Holiday Declared!</h3>
              <p><strong>Reason:</strong> {scheduleData.reason}</p>
            </div>
          ) : !scheduleData?.schedule ? (
            <div style={styles.infoAlert}>
              {scheduleData?.message || "Aaj ka schedule abhi tak publish nahi hua."}
            </div>
          ) : (
            <div>
              <div style={styles.dateBadge}>
                Date: {scheduleData.schedule.schedule_date}
              </div>

              <div style={styles.slotGrid}>
                {scheduleData.schedule.slots.map((slot) => (
                  <div
                    key={slot.id}
                    style={{
                      ...styles.slotCard,
                      ...(slot.is_cancelled ? styles.cancelledSlotCard : {})
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, color: slot.is_cancelled ? '#721c24' : '#2c3e50' }}>
                        {slot.subject}
                      </h4>
                      {slot.is_cancelled && (
                        <span style={styles.cancelledBadge}>CANCELLED</span>
                      )}
                    </div>
                    <p style={{ margin: '8px 0 4px 0', color: '#555' }}>
                      👨‍🏫 Teacher: <strong>{slot.teacher_name}</strong>
                    </p>
                    <p style={{ margin: 0, fontSize: '13px', color: '#777' }}>
                      ⏰ {formatTime(slot.start_time)} — {formatTime(slot.end_time)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const styles = {
  container: { fontFamily: 'sans-serif', minHeight: '100vh', backgroundColor: '#f4f6f9' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px', backgroundColor: '#34495e', color: '#fff' },
  logoutBtn: { backgroundColor: '#e74c3c', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '4px', cursor: 'pointer' },
  content: { padding: '30px', maxWidth: '800px', margin: '0 auto' },
  card: { backgroundColor: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  dateBadge: { display: 'inline-block', backgroundColor: '#ecf0f1', padding: '6px 12px', borderRadius: '4px', marginBottom: '20px', fontWeight: 'bold', color: '#2c3e50' },
  slotGrid: { display: 'flex', flexDirection: 'column', gap: '15px' },
  slotCard: { backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '6px', borderLeft: '5px solid #3498db', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  cancelledSlotCard: { backgroundColor: '#fdf2f2', borderLeft: '5px solid #e74c3c' },
  cancelledBadge: { backgroundColor: '#e74c3c', color: '#fff', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' },
  holidayAlert: { padding: '20px', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '6px', textAlign: 'center', border: '1px solid #ffeeba' },
  infoAlert: { padding: '15px', backgroundColor: '#d1ecf1', color: '#0c5460', borderRadius: '6px' },
  errorAlert: { padding: '15px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '6px' }
};

export default StudentDashboard;