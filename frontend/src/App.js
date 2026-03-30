import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CourseView from './pages/CourseView';
import CareerPathways from './pages/CareerPathways';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/course/:courseId" element={<CourseView />} />
        <Route path="/careers" element={<CareerPathways />} />
      </Routes>
    </Router>
  );
}

export default App;
