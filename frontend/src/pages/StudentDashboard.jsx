import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';

const StudentDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Time ko '16:00:00' se '04:00 PM' mein convert karne ka function
const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  let h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const formattedHours = String(h).padStart(2, '0');
  return `${formattedHours}:${minutes} ${ampm}`;
};

  useEffect(() => {
    fetchTodaySchedule();
  }, []);

  const fetchTodaySchedule = async () => {
    try {
      const response = await API.get('/api/schedules/today');
      setScheduleData(response.data);
    } catch (err) {
      console.error('Error fetching today schedule:', err);
      setError('Schedule load karne mein masla aaya.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Top Navigation */}
      <header style={styles.header}>
        <h2>ClassFlow — Student Portal</h2>
        <div>
          <span style={{ marginRight: '15px' }}>Student: <strong>{user.full_name}</strong></span>
          <button onClick={logout} style={styles.logoutBtn}>Logout</button>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.content}>
        <h3>Today's Timetable</h3>

        {loading && <p>Schedule load ho raha hai...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {!loading && scheduleData && (
          <div>
            {scheduleData.is_holiday ? (
              <div style={styles.holidayBox}>
                <h4>🎉 Holiday Declared!</h4>
                <p>{scheduleData.reason}</p>
              </div>
            ) : scheduleData.schedule ? (
              <div>
                <p style={{ color: '#555', marginBottom: '20px' }}>
                  Date: <strong>{scheduleData.schedule.schedule_date}</strong> | Status: <strong>{scheduleData.schedule.status}</strong>
                </p>

                <div style={styles.slotsContainer}>
                  {scheduleData.schedule.slots.map((slot) => (
                    <div 
                      key={slot.id} 
                      style={{
                        ...styles.slotCard,
                        borderLeft: slot.is_cancelled ? '5px solid #e74c3c' : '5px solid #2ecc71'
                      }}
                    >
                      <h4>
                        {slot.subject}{' '}
                        {slot.is_cancelled && <span style={{ color: '#e74c3c', fontSize: '14px' }}>(Cancelled)</span>}
                      </h4>
                      <p>⏰ <strong>Time:</strong> {formatTime(slot.start_time)} - {formatTime(slot.end_time)}</p>
                      <p>👨‍🏫 <strong>Teacher:</strong> {slot.teacher_name}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={styles.noScheduleBox}>
                <p>📌 {scheduleData.message || 'Aaj ka koi published schedule available nahi hai.'}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

const styles = {
  container: { fontFamily: 'sans-serif', minHeight: '100vh', backgroundColor: '#f8f9fa' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px', backgroundColor: '#27ae60', color: '#fff' },
  logoutBtn: { backgroundColor: '#e74c3c', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '4px', cursor: 'pointer' },
  content: { padding: '30px' },
  holidayBox: { backgroundColor: '#fff3cd', color: '#856404', padding: '20px', borderRadius: '8px', border: '1px solid #ffeeba' },
  noScheduleBox: { backgroundColor: '#e8f4f8', color: '#2980b9', padding: '20px', borderRadius: '8px', border: '1px solid #d4e6f1' },
  slotsContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '15px' },
  slotCard: { backgroundColor: '#fff', padding: '15px 20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.08)' }
};

export default StudentDashboard;