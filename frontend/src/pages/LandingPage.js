import React from 'react';
import { Link } from 'react-router-dom';

function LandingPage() {
  return (
    <div className="App">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="container navbar-content">
          <Link to="/" className="navbar-logo">
            AXIS
          </Link>
          <div className="navbar-links">
            <a href="#features" className="navbar-link">Features</a>
            <a href="#how-it-works" className="navbar-link">How It Works</a>
            <Link to="/login" className="btn btn-secondary">Login</Link>
            <Link to="/register" className="btn btn-primary">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-overlay"></div>
        <div className="container hero-content">
          <h1>Transform Learning into an Adventure</h1>
          <p>
            AXIS is a gamified learning platform designed to boost student engagement, 
            improve retention, and prepare high school students for real-world success.
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary">Start Your Journey</Link>
            <a href="#features" className="btn btn-secondary">Learn More</a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <h2 className="section-title">Why Choose AXIS?</h2>
          <p className="section-subtitle">
            Experience a new way of learning that's engaging, rewarding, and prepares you for the future.
          </p>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎮</div>
              <h3>Gamified Learning</h3>
              <p>
                Earn XP, unlock badges, and level up as you master new skills. 
                Learning becomes addictive when it's fun!
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Track Your Progress</h3>
              <p>
                Real-time progress tracking helps you see how far you've come 
                and where you're heading.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">💼</div>
              <h3>Career Pathways</h3>
              <p>
                Discover how your skills translate to real-world careers. 
                Visualize your future and make informed decisions.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Continuous Feedback</h3>
              <p>
                Get constructive feedback from teachers and peers. 
                Improve together through meaningful engagement.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Challenge System</h3>
              <p>
                Complete learning challenges, compete with classmates, 
                and celebrate achievements along the way.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🤝</div>
              <h3>Better Student-Teacher Dynamics</h3>
              <p>
                Foster a collaborative environment where teachers mentor 
                and students thrive together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works">
        <div className="container">
          <h2 className="section-title">How AXIS Works</h2>
          <p className="section-subtitle">
            Get started in three simple steps
          </p>
          
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Create Your Account</h3>
              <p>Sign up as a student, teacher, or school admin in seconds.</p>
            </div>

            <div className="step">
              <div className="step-number">2</div>
              <h3>Join Your Classes</h3>
              <p>Access courses, challenges, and learning materials created by your teachers.</p>
            </div>

            <div className="step">
              <div className="step-number">3</div>
              <h3>Learn & Level Up</h3>
              <p>Complete challenges, earn XP, unlock badges, and track your career progress.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta">
        <div className="container">
          <h2>Ready to Transform Your Learning Experience?</h2>
          <p>Join thousands of students already learning the AXIS way.</p>
          <Link to="/register" className="btn btn-secondary">Get Started Free</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; 2026 AXIS - Gamified Learning Management System</p>
          <p>Developed by Peter Michael Angelo Rucakibungo | African Leadership University</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
