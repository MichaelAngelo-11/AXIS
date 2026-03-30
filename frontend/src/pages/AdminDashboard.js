import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const API_URL = 'http://localhost:5000/api';

function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Statistics
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    publishedCourses: 0,
    totalModules: 0,
    totalXP: 0,
    totalBadges: 0
  });
  
  // Users data
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  
  // Courses data
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [courseSearch, setCourseSearch] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!storedUser || !token) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    
    // Check if user is admin
    if (parsedUser.role !== 'admin') {
      alert('Access denied. Admin privileges required.');
      navigate('/');
      return;
    }

    setUser(parsedUser);
    fetchAdminData(token);
  }, [navigate]);

  const fetchAdminData = async (token) => {
    try {
      // Fetch system statistics
      const statsRes = await fetch(`${API_URL}/users/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }

      // Fetch all users
      const usersRes = await fetch(`${API_URL}/users/admin/all-users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
        setFilteredUsers(data.users || []);
      }

      // Fetch all courses
      const coursesRes = await fetch(`${API_URL}/users/admin/all-courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (coursesRes.ok) {
        const data = await coursesRes.json();
        setCourses(data.courses || []);
        setFilteredCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter users
  useEffect(() => {
    let filtered = users;
    
    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }
    
    // Filter by search
    if (userSearch.trim()) {
      const search = userSearch.toLowerCase();
      filtered = filtered.filter(u => 
        u.first_name.toLowerCase().includes(search) ||
        u.last_name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search)
      );
    }
    
    setFilteredUsers(filtered);
  }, [users, roleFilter, userSearch]);

  // Filter courses
  useEffect(() => {
    if (courseSearch.trim()) {
      const search = courseSearch.toLowerCase();
      setFilteredCourses(
        courses.filter(c => 
          c.title.toLowerCase().includes(search) ||
          c.teacher_name.toLowerCase().includes(search) ||
          (c.subject && c.subject.toLowerCase().includes(search))
        )
      );
    } else {
      setFilteredCourses(courses);
    }
  }, [courses, courseSearch]);

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This cannot be undone.`)) {
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/users/admin/user/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        alert('User deleted successfully');
        fetchAdminData(token);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Delete user error:', error);
      alert('Failed to delete user');
    }
  };

  const handleToggleCoursePublish = async (courseId, currentStatus) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/courses/${courseId}/publish`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isPublished: !currentStatus })
      });

      if (res.ok) {
        alert(currentStatus ? 'Course unpublished' : 'Course published');
        fetchAdminData(token);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update course');
      }
    } catch (error) {
      console.error('Toggle publish error:', error);
      alert('Failed to update course');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (loading) {
    return <div className="loading">Loading admin dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="container navbar-content">
          <h2 className="dashboard-logo">AXIS Admin</h2>
          <div className="dashboard-user">
            <span>Welcome, {user?.first_name}! 👑</span>
            <button onClick={handleLogout} className="btn btn-secondary btn-sm">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="dashboard-content container">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <p>System Management & Oversight</p>
        </div>

        {/* Admin Tabs */}
        <div className="admin-tabs">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Users ({users.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            📚 Courses ({courses.length})
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <div className="dashboard-grid">
              <div className="dashboard-card">
                <div className="card-icon">👥</div>
                <h3>Total Users</h3>
                <p className="card-value">{stats.totalUsers}</p>
                <p className="card-subtitle">Registered accounts</p>
              </div>

              <div className="dashboard-card">
                <div className="card-icon">🎓</div>
                <h3>Students</h3>
                <p className="card-value">{stats.totalStudents}</p>
                <p className="card-subtitle">Active learners</p>
              </div>

              <div className="dashboard-card">
                <div className="card-icon">👨‍🏫</div>
                <h3>Teachers</h3>
                <p className="card-value">{stats.totalTeachers}</p>
                <p className="card-subtitle">Content creators</p>
              </div>

              <div className="dashboard-card">
                <div className="card-icon">📚</div>
                <h3>Total Courses</h3>
                <p className="card-value">{stats.totalCourses}</p>
                <p className="card-subtitle">{stats.publishedCourses} published</p>
              </div>

              <div className="dashboard-card">
                <div className="card-icon">📝</div>
                <h3>Total Modules</h3>
                <p className="card-value">{stats.totalModules}</p>
                <p className="card-subtitle">Learning content</p>
              </div>

              <div className="dashboard-card">
                <div className="card-icon">⚡</div>
                <h3>Total XP</h3>
                <p className="card-value">{stats.totalXP}</p>
                <p className="card-subtitle">Experience earned</p>
              </div>

              <div className="dashboard-card">
                <div className="card-icon">🏆</div>
                <h3>Badges Earned</h3>
                <p className="card-value">{stats.totalBadges}</p>
                <p className="card-subtitle">Achievements unlocked</p>
              </div>

              <div className="dashboard-card">
                <div className="card-icon">🎯</div>
                <h3>System Health</h3>
                <p className="card-value">✓</p>
                <p className="card-subtitle">All systems operational</p>
              </div>
            </div>

            <div className="dashboard-section">
              <h2>Quick Actions</h2>
              <div className="quick-actions-grid">
                <button className="btn btn-primary" onClick={() => setActiveTab('users')}>
                  Manage Users
                </button>
                <button className="btn btn-primary" onClick={() => setActiveTab('courses')}>
                  Manage Courses
                </button>
                <button className="btn btn-secondary" onClick={() => navigate('/careers')}>
                  View Career Paths
                </button>
                <button className="btn btn-secondary" onClick={() => {
                  const token = localStorage.getItem('token');
                  fetchAdminData(token);
                  alert('Data refreshed!');
                }}>
                  Refresh Data
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="dashboard-section">
            <div className="section-header">
              <h2>User Management</h2>
              <div className="filters">
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="teacher">Teachers</option>
                  <option value="admin">Admins</option>
                </select>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            <div className="admin-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Level</th>
                    <th>XP</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.first_name} {u.last_name}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`role-badge role-${u.role}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>{u.level}</td>
                      <td>{u.total_xp}</td>
                      <td>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteUser(u.id, `${u.first_name} ${u.last_name}`)}
                          disabled={u.id === user.id}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Course Management</h2>
              <input
                type="text"
                placeholder="Search courses..."
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="admin-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Teacher</th>
                    <th>Subject</th>
                    <th>Modules</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map(c => (
                    <tr key={c.id}>
                      <td>{c.id}</td>
                      <td>{c.title}</td>
                      <td>{c.teacher_name}</td>
                      <td>{c.subject || '-'}</td>
                      <td>{c.module_count || 0}</td>
                      <td>
                        <span className={`status-badge ${c.is_published ? 'published' : 'draft'}`}>
                          {c.is_published ? '✓ Published' : 'Draft'}
                        </span>
                      </td>
                      <td>{new Date(c.created_at).toLocaleDateString()}</td>
                      <td>
                        <button 
                          className="btn btn-sm btn-outline"
                          onClick={() => handleToggleCoursePublish(c.id, c.is_published)}
                        >
                          {c.is_published ? 'Unpublish' : 'Publish'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
