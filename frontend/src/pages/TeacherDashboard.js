import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function TeacherDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    subject: '',
    gradeLevel: ''
  });
  const [moduleForm, setModuleForm] = useState({
    title: '',
    description: '',
    content: '',
    question: '',
    correctAnswer: '',
    xpValue: 10,
    orderIndex: 0
  });
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    pendingAssignments: 0,
    feedbackCount: 0
  });
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [courseStudents, setCourseStudents] = useState([]);
  const [selectedCourseForStudents, setSelectedCourseForStudents] = useState(null);
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!storedUser || !token) {
      navigate('/login');
      return;
    }

    const userObj = JSON.parse(storedUser);
    setUser(userObj);
    setLoading(false);
    
    // Fetch teacher's courses
    fetchCourses();
  }, [navigate]);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/courses/my-courses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched courses data:', data);
        
        // Ensure courses is always an array
        const coursesArray = Array.isArray(data.courses) ? data.courses : [];
        setCourses(coursesArray);
        setStats(prev => ({ ...prev, totalCourses: coursesArray.length }));
        
        // Fetch total students across all courses
        fetchTotalStudents(coursesArray, token);
      } else {
        console.error('Failed to fetch courses, status:', response.status);
        setCourses([]);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      setCourses([]);
    }
  };

  const fetchTotalStudents = async (coursesArray, token) => {
    try {
      const uniqueStudentIds = new Set();
      
      // Fetch students for each course and track unique IDs
      for (const course of coursesArray) {
        const res = await fetch(`http://localhost:5000/api/courses/${course.id}/students`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          // Add each student ID to the Set (duplicates automatically ignored)
          data.students.forEach(student => uniqueStudentIds.add(student.id));
        }
      }
      
      // Set size gives us the count of unique students
      setStats(prev => ({ ...prev, totalStudents: uniqueStudentIds.size }));
    } catch (error) {
      console.error('Failed to fetch total students:', error);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(courseForm)
      });

      if (response.ok) {
        const data = await response.json();
        alert('Course created successfully!');
        setShowCourseModal(false);
        setCourseForm({ title: '', description: '', subject: '', gradeLevel: '' });
        fetchCourses(); // Refresh courses list
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create course');
      }
    } catch (error) {
      console.error('Create course error:', error);
      alert('Failed to create course. Please try again.');
    }
  };

  const handleAddModule = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/courses/${selectedCourse.id}/modules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(moduleForm)
      });

      if (response.ok) {
        alert('Module added successfully!');
        setShowModuleModal(false);
        setModuleForm({ title: '', description: '', content: '', question: '', correctAnswer: '', xpValue: 10, orderIndex: 0 });
        setSelectedCourse(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add module');
      }
    } catch (error) {
      console.error('Add module error:', error);
      alert('Failed to add module. Please try again.');
    }
  };

  const openModuleModal = (course) => {
    setSelectedCourse(course);
    setShowModuleModal(true);
  };

  const fetchCourseStudents = async (courseId, courseName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/courses/${courseId}/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setCourseStudents(data.students || []);
        setSelectedCourseForStudents({ id: courseId, title: courseName });
        setShowStudentsModal(true);
      } else {
        alert('Failed to fetch students');
      }
    } catch (error) {
      console.error('Fetch students error:', error);
      alert('Failed to fetch students');
    }
  };

  const handlePublishToggle = async (course) => {
    const token = localStorage.getItem('token');
    const newStatus = !course.is_published;
    
    try {
      const response = await fetch(`http://localhost:5000/api/courses/${course.id}/publish`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isPublished: newStatus })
      });

      if (response.ok) {
        alert(newStatus ? 'Course published! Students can now see it.' : 'Course unpublished');
        fetchCourses(); // Refresh courses list
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update course status');
      }
    } catch (error) {
      console.error('Publish toggle error:', error);
      alert('Failed to update course status. Please try again.');
    }
  };

  const openEditCourseModal = (course) => {
    setEditingCourse(course);
    setCourseForm({
      title: course.title,
      description: course.description || '',
      subject: course.subject || '',
      gradeLevel: course.grade_level || ''
    });
    setShowEditCourseModal(true);
  };

  const handleEditCourse = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/courses/${editingCourse.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(courseForm)
      });

      if (response.ok) {
        alert('Course updated successfully!');
        setShowEditCourseModal(false);
        setEditingCourse(null);
        setCourseForm({ title: '', description: '', subject: '', gradeLevel: '' });
        fetchCourses();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update course');
      }
    } catch (error) {
      console.error('Update course error:', error);
      alert('Failed to update course. Please try again.');
    }
  };

  const handleDeleteCourse = async (courseId, courseTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${courseTitle}"? This will also delete all modules and cannot be undone.`)) {
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/api/courses/${courseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('Course deleted successfully');
        fetchCourses();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete course');
      }
    } catch (error) {
      console.error('Delete course error:', error);
      alert('Failed to delete course. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="container navbar-content">
          <h2 className="dashboard-logo">AXIS</h2>
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
          <h1>Teacher Dashboard</h1>
          <p>Manage your courses and students</p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="card-icon">📚</div>
            <h3>My Courses</h3>
            <p className="card-value">{stats.totalCourses}</p>
            <p className="card-subtitle">Created courses</p>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">👥</div>
            <h3>Students</h3>
            <p className="card-value">{stats.totalStudents}</p>
            <p className="card-subtitle">Total enrolled</p>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">📝</div>
            <h3>Assignments</h3>
            <p className="card-value">{stats.pendingAssignments}</p>
            <p className="card-subtitle">Pending reviews</p>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">⭐</div>
            <h3>Feedback</h3>
            <p className="card-value">{stats.feedbackCount}</p>
            <p className="card-subtitle">Given this week</p>
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>My Courses</h2>
            <button className="btn btn-primary" onClick={() => setShowCourseModal(true)}>
              + Create Course
            </button>
          </div>
          
          {courses.length === 0 ? (
            <div className="empty-state">
              <p>📚 No courses yet. Create your first course to get started!</p>
            </div>
          ) : (
            <div className="courses-grid">
              {courses.map(course => (
                <div key={course.id} className="course-card">
                  <div className="course-header">
                    <h3>{course.title}</h3>
                    <span className={`course-status ${course.is_published ? 'published' : 'draft'}`}>
                      {course.is_published ? '✓ Published' : '📝 Draft'}
                    </span>
                  </div>
                  <p className="course-description">{course.description || 'No description'}</p>
                  <div className="course-meta">
                    {course.subject && <span className="badge">{course.subject}</span>}
                    {course.grade_level && <span className="badge">{course.grade_level}</span>}
                  </div>
                  <div className="course-actions">
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => fetchCourseStudents(course.id, course.title)}
                    >
                      👥 Students
                    </button>
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => openEditCourseModal(course)}
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      className={`btn btn-sm ${course.is_published ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={() => handlePublishToggle(course)}
                    >
                      {course.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button className="btn btn-sm btn-secondary" onClick={() => openModuleModal(course)}>
                      + Module
                    </button>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteCourse(course.id, course.title)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit Course Modal */}
        {showEditCourseModal && editingCourse && (
          <div className="modal-overlay" onClick={() => setShowEditCourseModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Edit Course</h2>
                <button className="modal-close" onClick={() => setShowEditCourseModal(false)}>×</button>
              </div>
              <form onSubmit={handleEditCourse} className="course-form">
                <div className="form-group">
                  <label htmlFor="editTitle">Course Title *</label>
                  <input
                    type="text"
                    id="editTitle"
                    required
                    value={courseForm.title}
                    onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                    placeholder="e.g., Introduction to Python Programming"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="editDescription">Description</label>
                  <textarea
                    id="editDescription"
                    rows="4"
                    value={courseForm.description}
                    onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                    placeholder="Describe what students will learn in this course"
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="editSubject">Subject</label>
                    <input
                      type="text"
                      id="editSubject"
                      value={courseForm.subject}
                      onChange={(e) => setCourseForm({ ...courseForm, subject: e.target.value })}
                      placeholder="e.g., Computer Science"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="editGradeLevel">Grade Level</label>
                    <select
                      id="editGradeLevel"
                      value={courseForm.gradeLevel}
                      onChange={(e) => setCourseForm({ ...courseForm, gradeLevel: e.target.value })}
                    >
                      <option value="">Select grade level</option>
                      <option value="6-8">Grade 6-8</option>
                      <option value="9-10">Grade 9-10</option>
                      <option value="11-12">Grade 11-12</option>
                      <option value="College">College</option>
                    </select>
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEditCourseModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Update Course
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Course Creation Modal */}
        {showCourseModal && (
          <div className="modal-overlay" onClick={() => setShowCourseModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Create New Course</h2>
                <button className="modal-close" onClick={() => setShowCourseModal(false)}>×</button>
              </div>
              <form onSubmit={handleCreateCourse} className="course-form">
                <div className="form-group">
                  <label htmlFor="title">Course Title *</label>
                  <input
                    type="text"
                    id="title"
                    required
                    value={courseForm.title}
                    onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                    placeholder="e.g., Introduction to Python Programming"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    rows="4"
                    value={courseForm.description}
                    onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                    placeholder="Describe what students will learn in this course"
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="subject">Subject</label>
                    <input
                      type="text"
                      id="subject"
                      value={courseForm.subject}
                      onChange={(e) => setCourseForm({ ...courseForm, subject: e.target.value })}
                      placeholder="e.g., Computer Science"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="gradeLevel">Grade Level</label>
                    <select
                      id="gradeLevel"
                      value={courseForm.gradeLevel}
                      onChange={(e) => setCourseForm({ ...courseForm, gradeLevel: e.target.value })}
                    >
                      <option value="">Select grade level</option>
                      <option value="6-8">Grade 6-8</option>
                      <option value="9-10">Grade 9-10</option>
                      <option value="11-12">Grade 11-12</option>
                      <option value="College">College</option>
                    </select>
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCourseModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Course
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Students Analytics Modal */}
        {showStudentsModal && selectedCourseForStudents && (
          <div className="modal-overlay" onClick={() => setShowStudentsModal(false)}>
            <div className="modal-content" style={{ maxWidth: '900px' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Students in "{selectedCourseForStudents.title}"</h2>
                <button className="modal-close" onClick={() => setShowStudentsModal(false)}>×</button>
              </div>
              <div style={{ padding: 'var(--spacing-xl)' }}>
                {courseStudents.length === 0 ? (
                  <div className="empty-state">
                    <p>No students enrolled yet</p>
                  </div>
                ) : (
                  <div className="admin-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Email</th>
                          <th>Level</th>
                          <th>Progress</th>
                          <th>Modules</th>
                          <th>XP Earned</th>
                          <th>Enrolled</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courseStudents.map(student => (
                          <tr key={student.id}>
                            <td><strong>{student.first_name} {student.last_name}</strong></td>
                            <td>{student.email}</td>
                            <td>
                              <span className="level-badge">Lvl {student.level}</span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ 
                                  flex: 1, 
                                  height: '8px', 
                                  backgroundColor: '#e0e0e0', 
                                  borderRadius: '4px',
                                  overflow: 'hidden'
                                }}>
                                  <div style={{
                                    width: `${student.progress_percentage}%`,
                                    height: '100%',
                                    backgroundColor: 'var(--primary-green)',
                                    transition: 'width 0.3s ease'
                                  }} />
                                </div>
                                <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                                  {student.progress_percentage}%
                                </span>
                              </div>
                            </td>
                            <td>{student.completed_modules}/{student.total_modules}</td>
                            <td className="xp-value">{student.course_xp || 0} XP</td>
                            <td>{new Date(student.enrolled_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Module Creation Modal */}
        {showModuleModal && selectedCourse && (
          <div className="modal-overlay" onClick={() => setShowModuleModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Add Module to "{selectedCourse.title}"</h2>
                <button className="modal-close" onClick={() => setShowModuleModal(false)}>×</button>
              </div>
              <form onSubmit={handleAddModule} className="course-form">
                <div className="form-group">
                  <label htmlFor="moduleTitle">Module Title *</label>
                  <input
                    type="text"
                    id="moduleTitle"
                    required
                    value={moduleForm.title}
                    onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                    placeholder="e.g., Introduction to Variables"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="moduleDescription">Description</label>
                  <textarea
                    id="moduleDescription"
                    rows="3"
                    value={moduleForm.description}
                    onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                    placeholder="Brief description of this module"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="moduleContent">Content *</label>
                  <textarea
                    id="moduleContent"
                    rows="6"
                    required
                    value={moduleForm.content}
                    onChange={(e) => setModuleForm({ ...moduleForm, content: e.target.value })}
                    placeholder="Module content, lessons, and instructions..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="moduleQuestion">Question (optional)</label>
                  <input
                    type="text"
                    id="moduleQuestion"
                    value={moduleForm.question}
                    onChange={(e) => setModuleForm({ ...moduleForm, question: e.target.value })}
                    placeholder="e.g., What is 2 + 2?"
                  />
                  <small style={{ color: 'var(--dark-gray)', fontSize: '0.85rem', display: 'block', marginTop: '4px' }}>
                    If you add a question, students must answer correctly to earn XP
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="correctAnswer">Correct Answer (if question provided)</label>
                  <input
                    type="text"
                    id="correctAnswer"
                    value={moduleForm.correctAnswer}
                    onChange={(e) => setModuleForm({ ...moduleForm, correctAnswer: e.target.value })}
                    placeholder="e.g., 4"
                    disabled={!moduleForm.question}
                  />
                  <small style={{ color: 'var(--dark-gray)', fontSize: '0.85rem', display: 'block', marginTop: '4px' }}>
                    Answer validation is case-insensitive
                  </small>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="xpValue">XP Value</label>
                    <input
                      type="number"
                      id="xpValue"
                      min="1"
                      value={moduleForm.xpValue}
                      onChange={(e) => setModuleForm({ ...moduleForm, xpValue: parseInt(e.target.value) })}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="orderIndex">Order</label>
                    <input
                      type="number"
                      id="orderIndex"
                      min="0"
                      value={moduleForm.orderIndex}
                      onChange={(e) => setModuleForm({ ...moduleForm, orderIndex: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModuleModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Add Module
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TeacherDashboard;
