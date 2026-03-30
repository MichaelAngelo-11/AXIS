import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './Dashboard.css';
import './CourseView.css';

const API_URL = 'http://localhost:5000/api';

function CourseView() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState({});
  const [completedCount, setCompletedCount] = useState(0);
  const [moduleComments, setModuleComments] = useState({});
  const [commentInput, setCommentInput] = useState({});
  const [showComments, setShowComments] = useState({});
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [currentModule, setCurrentModule] = useState(null);
  const [modalAnswer, setModalAnswer] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!storedUser || !token) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    fetchCourseData(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, navigate]);

  const fetchCourseData = async (token) => {
    try {
      // Fetch course details and modules
      const courseRes = await fetch(`${API_URL}/courses/${courseId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (courseRes.ok) {
        const data = await courseRes.json();
        setCourse(data.course);
        setModules(data.modules || []);
      } else {
        alert('Failed to load course');
        navigate('/dashboard');
        return;
      }

      // Fetch student's progress for this specific course
      const progressRes = await fetch(`${API_URL}/progress/course/${courseId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (progressRes.ok) {
        const progressData = await progressRes.json();
        
        // The response contains modules with their progress
        const progressMap = {};
        let completed = 0;
        
        if (progressData.modules) {
          progressData.modules.forEach(m => {
            progressMap[m.id] = {
              status: m.status || 'not_started',
              xp_earned: m.xp_earned || 0,
              completed_at: m.completed_at
            };
            if (m.status === 'completed') {
              completed++;
            }
          });
        }
        
        setProgress(progressMap);
        setCompletedCount(completed);
      }
    } catch (error) {
      console.error('Error fetching course data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openQuestionModal = (module) => {
    if (module.question) {
      setCurrentModule(module);
      setShowQuestionModal(true);
      setModalAnswer('');
    } else {
      // No question, complete directly
      handleCompleteModule(module);
    }
  };

  const handleCompleteModule = async (module) => {
    const token = localStorage.getItem('token');
    const answer = module.question ? modalAnswer : null;
    
    try {
      const res = await fetch(`${API_URL}/progress/module/${module.id}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answer })
      });

      if (res.ok) {
        const data = await res.json();
        
        // Close modal if open
        setShowQuestionModal(false);
        setModalAnswer('');
        setCurrentModule(null);
        
        // Show success message with XP earned
        const leveledUp = data.level > user.level;
        let message = `🎉 Module completed! +${data.xpEarned} XP earned!`;
        
        if (leveledUp) {
          message += `\n\n⭐ LEVEL UP! You reached Level ${data.level}!`;
        }
        
        alert(message);
        
        // Update user in localStorage
        const updatedUser = { ...user, total_xp: data.totalXP, level: data.level };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        // Refresh course data to update progress
        fetchCourseData(token);
      } else {
        const error = await res.json();
        if (error.incorrect) {
          alert('❌ ' + error.error);
        } else {
          alert(error.error || 'Failed to complete module');
        }
      }
    } catch (error) {
      console.error('Complete module error:', error);
      alert('Failed to complete module');
    }
  };

  const getModuleStatus = (moduleId) => {
    if (!progress[moduleId]) return 'not_started';
    return progress[moduleId].status;
  };

  const isModuleCompleted = (moduleId) => {
    return getModuleStatus(moduleId) === 'completed';
  };

  const calculateProgress = () => {
    if (modules.length === 0) return 0;
    return Math.round((completedCount / modules.length) * 100);
  };

  const fetchModuleComments = async (moduleId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/feedback/module/${moduleId}/comments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setModuleComments(prev => ({ ...prev, [moduleId]: data.comments || [] }));
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleAddComment = async (moduleId) => {
    const content = commentInput[moduleId];
    if (!content || content.trim().length === 0) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/feedback/module/${moduleId}/comment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });

      if (res.ok) {
        setCommentInput(prev => ({ ...prev, [moduleId]: '' }));
        fetchModuleComments(moduleId);
        alert('Comment added successfully!');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Add comment error:', error);
      alert('Failed to add comment');
    }
  };

  const toggleComments = (moduleId) => {
    const newShowState = !showComments[moduleId];
    setShowComments(prev => ({ ...prev, [moduleId]: newShowState }));
    
    // Fetch comments when opening
    if (newShowState && !moduleComments[moduleId]) {
      fetchModuleComments(moduleId);
    }
  };

  if (loading) {
    return <div className="loading">Loading course...</div>;
  }

  if (!course) {
    return (
      <div className="dashboard">
        <div className="dashboard-content container">
          <div className="empty-state">
            <p>Course not found</p>
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progressPercentage = calculateProgress();

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="container navbar-content">
          <h2 className="dashboard-logo">AXIS</h2>
          <div className="dashboard-user">
            <span>Level {user?.level} • {user?.total_xp} XP</span>
            <button onClick={() => navigate('/student/dashboard')} className="btn btn-secondary btn-sm">
              Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="dashboard-content container">
        {/* Course Header */}
        <div className="course-view-header">
          <div className="course-info">
            <h1>{course.title}</h1>
            <p className="course-instructor">
              👨‍🏫 {course.first_name} {course.last_name}
            </p>
            {course.description && (
              <p className="course-desc">{course.description}</p>
            )}
            <div className="course-meta">
              {course.subject && <span className="badge">📚 {course.subject}</span>}
              {course.grade_level && <span className="badge">🎓 {course.grade_level}</span>}
            </div>
          </div>
          
          <div className="course-progress-card">
            <h3>Your Progress</h3>
            <div className="progress-circle">
              <span className="progress-value">{progressPercentage}%</span>
            </div>
            <p className="progress-text">
              {completedCount} of {modules.length} modules completed
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar-container">
          <div className="progress-bar">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Modules List */}
        <div className="dashboard-section">
          <h2>Course Modules</h2>
          
          {modules.length === 0 ? (
            <div className="empty-state">
              <p>No modules available yet. Check back later!</p>
            </div>
          ) : (
            <div className="modules-list">
              {modules.map((module, index) => {
                const completed = isModuleCompleted(module.id);
                
                return (
                  <div key={module.id} className={`module-card ${completed ? 'completed' : ''}`}>
                    <div className="module-header">
                      <div className="module-number">Module {index + 1}</div>
                      {completed && <span className="completed-badge">✓ Completed</span>}
                    </div>
                    
                    <h3 className="module-title">{module.title}</h3>
                    
                    {module.description && (
                      <p className="module-description">{module.description}</p>
                    )}
                    
                    <div className="module-content">
                      <p>{module.content}</p>
                    </div>

                    {/* Show question indicator if module has question */}
                    {module.question && !completed && (
                      <div className="module-question-indicator">
                        <span>❓ This module includes a question to test your knowledge</span>
                      </div>
                    )}
                    
                    <div className="module-footer">
                      <div className="module-xp">
                        <span className="xp-icon">⚡</span>
                        <span>{module.xp_value} XP</span>
                      </div>
                      
                      {!completed ? (
                        <button 
                          className="btn btn-primary"
                          onClick={() => openQuestionModal(module)}
                        >
                          Complete Module
                        </button>
                      ) : (
                        <div className="completed-info">
                          <span>✓ Earned {progress[module.id]?.xp_earned || module.xp_value} XP</span>
                        </div>
                      )}
                    </div>

                    {/* Comments Section */}
                    <div className="module-comments-section">
                      <button 
                        className="btn btn-sm btn-outline" 
                        onClick={() => toggleComments(module.id)}
                        style={{ width: '100%', marginTop: '12px' }}
                      >
                        💬 {showComments[module.id] ? 'Hide' : 'Show'} Comments 
                        {moduleComments[module.id] && ` (${moduleComments[module.id].length})`}
                      </button>

                      {showComments[module.id] && (
                        <div className="comments-container">
                          <div className="add-comment">
                            <textarea
                              placeholder="Add a comment or ask a question..."
                              value={commentInput[module.id] || ''}
                              onChange={(e) => setCommentInput(prev => ({ ...prev, [module.id]: e.target.value }))}
                              rows="3"
                            />
                            <button 
                              className="btn btn-primary btn-sm"
                              onClick={() => handleAddComment(module.id)}
                            >
                              Post Comment
                            </button>
                          </div>

                          <div className="comments-list">
                            {moduleComments[module.id]?.length > 0 ? (
                              moduleComments[module.id].map((comment) => (
                                <div key={comment.id} className="comment">
                                  <div className="comment-header">
                                    <strong>
                                      {comment.first_name} {comment.last_name}
                                      {comment.role === 'teacher' && <span className="teacher-badge">👨‍🏫 Teacher</span>}
                                    </strong>
                                    <span className="comment-date">
                                      {new Date(comment.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="comment-content">{comment.content}</p>
                                </div>
                              ))
                            ) : (
                              <p className="no-comments">No comments yet. Be the first to comment!</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {progressPercentage === 100 && (
          <div className="course-completion-banner">
            <h2>🎉 Congratulations!</h2>
            <p>You've completed all modules in this course!</p>
            <p>Total XP Earned: {modules.reduce((sum, m) => sum + m.xp_value, 0)} XP</p>
          </div>
        )}
      </div>

      {/* Question Modal */}
      {showQuestionModal && currentModule && (
        <div className="modal-overlay" onClick={() => setShowQuestionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>❓ Answer to Complete Module</h2>
              <button className="modal-close" onClick={() => setShowQuestionModal(false)}>×</button>
            </div>
            <div className="question-modal-body">
              <div className="question-display">
                <p><strong>Question:</strong></p>
                <p className="question-text">{currentModule.question}</p>
              </div>
              <div className="form-group">
                <label htmlFor="modalAnswer">Your Answer:</label>
                <input
                  type="text"
                  id="modalAnswer"
                  value={modalAnswer}
                  onChange={(e) => setModalAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && modalAnswer.trim()) {
                      handleCompleteModule(currentModule);
                    }
                  }}
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowQuestionModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => handleCompleteModule(currentModule)}
                  disabled={!modalAnswer.trim()}
                >
                  Submit Answer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseView;
