import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';
import './Dashboard.css';

function StudentDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [studentBadges, setStudentBadges] = useState([]);
  const [showBrowseCourses, setShowBrowseCourses] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);

  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!storedUser || !token) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    fetchDashboardData(token, parsedUser);
    
    // Refresh data when window gains focus (user returns from course)
    const handleFocus = () => {
      const updatedUser = JSON.parse(localStorage.getItem('user'));
      setUser(updatedUser);
      fetchDashboardData(token, updatedUser);
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [navigate]);

  const fetchDashboardData = async (token, parsedUser) => {
    try {
      // Fetch enrolled courses
      const coursesRes = await fetch(`${API_URL}/courses/enrolled`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (coursesRes.ok) {
        const data = await coursesRes.json();
        setEnrolledCourses(data.courses || []);
      }

      // Fetch available courses
      const availableRes = await fetch(`${API_URL}/courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (availableRes.ok) {
        const data = await availableRes.json();
        setAvailableCourses(data.courses || []);
      }

      // Fetch student's badges
      const userRes = await fetch(`${API_URL}/users/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (userRes.ok) {
        const data = await userRes.json();
        setStudentBadges(data.user?.badges || []);
      }

      // Fetch leaderboard
      const leaderboardRes = await fetch(`${API_URL}/users/leaderboard?limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (leaderboardRes.ok) {
        const data = await leaderboardRes.json();
        setLeaderboard(data.leaderboard || []);
        
        // Find current user's rank
        if (parsedUser) {
          const rank = data.leaderboard.findIndex(u => u.id === parsedUser.id);
          setUserRank(rank >= 0 ? rank + 1 : null);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleEnroll = async (courseId) => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    // Check if user is actually a student
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.role !== 'student') {
        alert(`Cannot enroll: You are logged in as ${user.role}. Only students can enroll in courses.`);
        return;
      }
    }
    
    try {
      const res = await fetch(`${API_URL}/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        alert('Successfully enrolled in course!');
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
        fetchDashboardData(token, parsedUser);
      } else {
        const data = await res.json();
        
        // Better error messages
        if (res.status === 403) {
          alert('Permission Error: Your account may have the wrong role. Please logout and login again as a student.');
        } else if (data.error === 'Already enrolled in this course') {
          alert('You are already enrolled in this course!');
        } else {
          alert(data.error || 'Failed to enroll in course');
        }
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      alert('Failed to enroll in course. Please check your connection and try again.');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="container navbar-content">
          <h2 className="dashboard-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>AXIS</h2>
          <div className="dashboard-user">
            <span>Welcome, {user?.first_name}!</span>
            <button onClick={handleLogout} className="btn btn-secondary btn-sm">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="dashboard-content container">
        <div className="dashboard-header">
          <h1>Student Dashboard</h1>
          <p>Level {user?.level} • {user?.total_xp} XP</p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>My Courses</h3>
            <p className="card-value">{enrolledCourses.length}</p>
            <p className="card-subtitle">Enrolled courses</p>
          </div>

          <div className="dashboard-card">
            <h3>Total XP</h3>
            <p className="card-value">{user?.total_xp || 0}</p>
            <p className="card-subtitle">Experience points</p>
          </div>

          <div className="dashboard-card">
            <h3>Badges</h3>
            <p className="card-value">{studentBadges.length}</p>
            <p className="card-subtitle">Achievements</p>
          </div>

          <div className="dashboard-card" onClick={() => navigate('/careers')} style={{ cursor: 'pointer' }}>
            <h3>Career Pathways</h3>
            <p className="card-value">→</p>
            <p className="card-subtitle">View pathways</p>
          </div>
        </div>

        {enrolledCourses.length > 0 && (
          <div className="dashboard-section">
            <h2>My Enrolled Courses</h2>
            <div className="courses-grid">
              {enrolledCourses.map(course => (
                <div key={course.id} className="course-card">
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                  <div className="course-meta">
                    {course.subject && <span className="badge">{course.subject}</span>}
                    {course.grade_level && <span className="badge">{course.grade_level}</span>}
                  </div>
                  <div style={{ marginTop: '8px', color: '#666', fontSize: '0.9rem' }}>
                    Instructor: {course.first_name} {course.last_name}
                  </div>
                  <button 
                    className="btn btn-primary btn-sm" 
                    style={{ marginTop: '12px', width: '100%' }}
                    onClick={() => navigate(`/course/${course.id}`)}
                  >
                    Continue Learning
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Leaderboard</h2>
            {userRank && (
              <span className="user-rank-badge">Your Rank: #{userRank}</span>
            )}
          </div>
          
          {leaderboard.length > 0 ? (
            <div className="leaderboard-table">
              <div className="leaderboard-header">
                <div className="rank-col">Rank</div>
                <div className="name-col">Student</div>
                <div className="stats-col">Level</div>
                <div className="stats-col">XP</div>
                <div className="stats-col">Modules</div>
                <div className="stats-col">Badges</div>
              </div>
              {leaderboard.map((student, index) => {
                const isCurrentUser = student.id === user?.id;
                const rank = index + 1;
                
                return (
                  <div 
                    key={student.id} 
                    className={`leaderboard-row ${isCurrentUser ? 'current-user' : ''}`}
                  >
                    <div className="rank-col">
                      <span className="rank-number">#{rank}</span>
                    </div>
                    <div className="name-col">
                      <strong>{student.first_name} {student.last_name}</strong>
                      {isCurrentUser && <span className="you-badge">You</span>}
                    </div>
                    <div className="stats-col">
                      <span className="level-badge">Lvl {student.level}</span>
                    </div>
                    <div className="stats-col">
                      <span className="xp-value">{student.total_xp} XP</span>
                    </div>
                    <div className="stats-col">{student.completed_modules || 0}</div>
                    <div className="stats-col">{student.badges_earned || 0}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <p>No rankings yet. Be the first to earn XP!</p>
            </div>
          )}
        </div>

        {studentBadges.length > 0 && (
          <div className="dashboard-section">
            <h2>My Badges</h2>
            <div className="badges-grid">
              {studentBadges.map(badge => (
                <div key={badge.id} className="badge-item">
                  <span className="badge-icon">{badge.icon}</span>
                  <div>
                    <strong>{badge.name}</strong>
                    <p>{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="dashboard-section">
          <div className="section-header">
            <h2>Browse Courses</h2>
            <button 
              className="btn btn-secondary"
              onClick={() => setShowBrowseCourses(!showBrowseCourses)}
            >
              {showBrowseCourses ? 'Hide Courses' : 'Show All Courses'}
            </button>
          </div>
          
          {showBrowseCourses && (
            <>
              {availableCourses.length > 0 ? (
                <div className="courses-grid">
                  {availableCourses.map(course => {
                    const isEnrolled = enrolledCourses.some(c => c.id === course.id);
                    return (
                      <div key={course.id} className="course-card">
                        <div className="course-header">
                          <h3>{course.title}</h3>
                          {isEnrolled && (
                            <span className="course-status published">✓ Enrolled</span>
                          )}
                        </div>
                        <p className="course-description">{course.description || 'No description available'}</p>
                        <div className="course-meta">
                          {course.subject && <span className="badge">{course.subject}</span>}
                          {course.grade_level && <span className="badge">{course.grade_level}</span>}
                        </div>
                        <div style={{ marginTop: '8px', color: '#666', fontSize: '0.9rem' }}>
                          Instructor: {course.first_name} {course.last_name}
                        </div>
                        <div className="course-actions" style={{ marginTop: '12px' }}>
                          {!isEnrolled ? (
                            <button 
                              onClick={() => handleEnroll(course.id)}
                              className="btn btn-primary"
                              style={{ width: '100%' }}
                            >
                              Enroll Now
                            </button>
                          ) : (
                            <button 
                              className="btn btn-outline"
                              style={{ width: '100%' }}
                              onClick={() => navigate(`/course/${course.id}`)}
                            >
                              View Course
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No courses available yet. Check back later.</p>
                </div>
              )}
            </>
          )}
          
          {!showBrowseCourses && (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p>Click "Show All Courses" to browse available courses</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
