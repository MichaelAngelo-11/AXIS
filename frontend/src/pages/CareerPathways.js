import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import './CareerPathways.css';

const API_URL = 'http://localhost:5000/api';

function CareerPathways() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [careers, setCareers] = useState([]);
  const [trackedCareers, setTrackedCareers] = useState([]);
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!storedUser || !token) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    fetchData(token);
  }, [navigate]);

  const fetchData = async (token) => {
    try {
      // Fetch all career paths
      const careersRes = await fetch(`${API_URL}/careers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (careersRes.ok) {
        const data = await careersRes.json();
        setCareers(data.careers || []);
      }

      // Fetch student's tracked careers
      const progressRes = await fetch(`${API_URL}/careers/my/progress`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (progressRes.ok) {
        const data = await progressRes.json();
        setTrackedCareers(data.progress || []);
      }
    } catch (error) {
      console.error('Error fetching career data:', error);
    } finally {
      setLoading(false);
    }
  };

  const isTracking = (careerId) => {
    return trackedCareers.some(tc => tc.career_path_id === careerId);
  };

  const handleTrackCareer = async (careerId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/careers/${careerId}/track`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        alert('Started tracking this career path!');
        fetchData(token);
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to track career');
      }
    } catch (error) {
      console.error('Track career error:', error);
      alert('Failed to track career path');
    }
  };

  const handleUntrackCareer = async (careerId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/careers/${careerId}/untrack`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        alert('Stopped tracking this career path');
        fetchData(token);
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to untrack career');
      }
    } catch (error) {
      console.error('Untrack career error:', error);
      alert('Failed to untrack career path');
    }
  };

  const openCareerDetails = (career) => {
    setSelectedCareer(career);
    setShowModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (loading) {
    return <div className="loading">Loading career pathways...</div>;
  }

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
            <button onClick={handleLogout} className="btn btn-secondary btn-sm">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="dashboard-content container">
        <div className="dashboard-header">
          <h1>Career Pathways</h1>
          <p>Discover career opportunities and track your progress</p>
        </div>

        {/* Tracked Careers */}
        {trackedCareers.length > 0 && (
          <div className="dashboard-section">
            <h2>My Career Paths</h2>
            <div className="tracked-careers-grid">
              {trackedCareers.map(career => (
                <div key={career.id} className="tracked-career-card">
                  <div className="career-card-header">
                    <h3>{career.name}</h3>
                    <button 
                      className="btn btn-sm btn-outline"
                      onClick={() => handleUntrackCareer(career.career_path_id)}
                    >
                      ✓ Tracking
                    </button>
                  </div>
                  <p className="career-description">{career.description}</p>
                  <div className="career-progress">
                    <div className="progress-label">
                      <span>Progress</span>
                      <span>{career.progress_percentage}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-bar-fill" 
                        style={{ width: `${career.progress_percentage}%` }}
                      />
                    </div>
                  </div>
                  <button 
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: '12px', width: '100%' }}
                    onClick={() => openCareerDetails(career)}
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Available Careers */}
        <div className="dashboard-section">
          <h2>Explore Career Paths</h2>
          <div className="careers-grid">
            {careers.map(career => {
              const tracking = isTracking(career.id);
              const skills = career.required_skills ? career.required_skills.split(',') : [];
              
              return (
                <div key={career.id} className="career-card">
                  <div className="career-card-header">
                    <h3>{career.name}</h3>
                    {tracking && <span className="tracking-badge">✓ Tracking</span>}
                  </div>
                  
                  <p className="career-description">{career.description}</p>
                  
                  <div className="career-info">
                    <div className="info-item">
                      <span className="info-label">💰 Salary:</span>
                      <span>{career.average_salary}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">📈 Outlook:</span>
                      <span>{career.growth_outlook}</span>
                    </div>
                  </div>

                  <div className="career-skills">
                    <strong>Required Skills:</strong>
                    <div className="skills-list">
                      {skills.slice(0, 3).map((skill, index) => (
                        <span key={index} className="skill-tag">{skill.trim()}</span>
                      ))}
                      {skills.length > 3 && (
                        <span className="skill-tag">+{skills.length - 3} more</span>
                      )}
                    </div>
                  </div>

                  <div className="career-actions">
                    {!tracking ? (
                      <button 
                        className="btn btn-primary"
                        onClick={() => handleTrackCareer(career.id)}
                      >
                        Track This Career
                      </button>
                    ) : (
                      <button 
                        className="btn btn-outline"
                        onClick={() => handleUntrackCareer(career.id)}
                      >
                        Stop Tracking
                      </button>
                    )}
                    <button 
                      className="btn btn-secondary"
                      onClick={() => openCareerDetails(career)}
                    >
                      Learn More
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Career Details Modal */}
        {showModal && selectedCareer && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content career-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{selectedCareer.name}</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
              </div>
              
              <div className="modal-body">
                <p className="career-description">{selectedCareer.description}</p>
                
                <div className="career-details-section">
                  <h3>💰 Salary Range</h3>
                  <p>{selectedCareer.average_salary}</p>
                </div>

                <div className="career-details-section">
                  <h3>📈 Career Outlook</h3>
                  <p>{selectedCareer.growth_outlook}</p>
                </div>

                <div className="career-details-section">
                  <h3>🎯 Required Skills</h3>
                  <div className="skills-list">
                    {(selectedCareer.required_skills || '').split(',').map((skill, index) => (
                      <span key={index} className="skill-tag">{skill.trim()}</span>
                    ))}
                  </div>
                </div>

                <div className="modal-actions">
                  {!isTracking(selectedCareer.id) ? (
                    <button 
                      className="btn btn-primary"
                      onClick={() => {
                        handleTrackCareer(selectedCareer.id);
                        setShowModal(false);
                      }}
                    >
                      Track This Career
                    </button>
                  ) : (
                    <button 
                      className="btn btn-outline"
                      onClick={() => {
                        handleUntrackCareer(selectedCareer.id);
                        setShowModal(false);
                      }}
                    >
                      Stop Tracking
                    </button>
                  )}
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CareerPathways;
