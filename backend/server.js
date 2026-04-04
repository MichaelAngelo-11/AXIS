const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '.env') });

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const courseRoutes = require('./routes/courses');
const progressRoutes = require('./routes/progress');
const careerRoutes = require('./routes/careers');
const feedbackRoutes = require('./routes/feedback');

// Initialize database
const { initializeDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Initialize database and auto-seed for production
async function setupDatabase() {
  try {
    await initializeDatabase();
    
    // Auto-seed if in production and database is empty
    if (process.env.NODE_ENV === 'production') {
      const bcrypt = require('bcryptjs');
      const { dbGet, dbRun } = require('./config/database');
      
      // Check if users exist
      const userCount = await dbGet('SELECT COUNT(*) as count FROM users');
      
      if (userCount.count === 0) {
        console.log('🌱 No users found. Auto-seeding database...');
        
        // Create default users
        const testUsers = [
          {
            email: 'student@axis.com',
            password: 'student123',
            role: 'student',
            firstName: 'John',
            lastName: 'Doe'
          },
          {
            email: 'teacher@axis.com',
            password: 'teacher123',
            role: 'teacher',
            firstName: 'Jane',
            lastName: 'Smith'
          },
          {
            email: 'admin@axis.com',
            password: 'admin123',
            role: 'admin',
            firstName: 'Admin',
            lastName: 'User'
          }
        ];

        for (const user of testUsers) {
          const password_hash = await bcrypt.hash(user.password, 10);
          await dbRun(`
            INSERT OR IGNORE INTO users (email, password_hash, role, first_name, last_name)
            VALUES (?, ?, ?, ?, ?)
          `, [user.email, password_hash, user.role, user.firstName, user.lastName]);
        }
        
        // Seed career paths
        const careerPaths = [
          {
            name: 'Software Engineer',
            description: 'Design, develop, and maintain software applications and systems',
            required_skills: 'Math,Physics,English,Computer Science,Logic',
            average_salary: '$70,000 - $120,000',
            growth_outlook: 'Excellent - 22% growth expected'
          },
          {
            name: 'Data Scientist',
            description: 'Analyze and interpret complex data to help organizations make decisions',
            required_skills: 'Math,Statistics,English,Computer Science,Physics',
            average_salary: '$80,000 - $130,000',
            growth_outlook: 'Excellent - 31% growth expected'
          },
          {
            name: 'Medical Doctor',
            description: 'Diagnose and treat illnesses, provide medical care to patients',
            required_skills: 'Biology,Chemistry,Physics,English,Math',
            average_salary: '$150,000 - $250,000',
            growth_outlook: 'Very Good - 16% growth expected'
          },
          {
            name: 'Pharmacist',
            description: 'Dispense medications and advise patients on proper medication use',
            required_skills: 'Chemistry,Biology,Math,English,Physics',
            average_salary: '$100,000 - $140,000',
            growth_outlook: 'Good - 6% growth expected'
          },
          {
            name: 'Civil Engineer',
            description: 'Design, build, and maintain infrastructure like roads, bridges, and buildings',
            required_skills: 'Math,Physics,Chemistry,English,Engineering',
            average_salary: '$70,000 - $110,000',
            growth_outlook: 'Good - 8% growth expected'
          },
          {
            name: 'Science Teacher',
            description: 'Educate students in scientific subjects and inspire scientific thinking',
            required_skills: 'Biology,Chemistry,Physics,Math,English',
            average_salary: '$45,000 - $75,000',
            growth_outlook: 'Good - 8% growth expected'
          }
        ];

        for (const career of careerPaths) {
          await dbRun(`
            INSERT OR IGNORE INTO career_paths (name, description, required_skills, average_salary, growth_outlook)
            VALUES (?, ?, ?, ?, ?)
          `, [career.name, career.description, career.required_skills, career.average_salary, career.growth_outlook]);
        }
        
        console.log('✅ Database auto-seeded successfully');
      } else {
        console.log('✓ Database already contains data, skipping auto-seed');
      }
    }
  } catch (error) {
    console.error('Database setup error:', error);
  }
}

setupDatabase();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/careers', careerRoutes);
app.use('/api/feedback', feedbackRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'AXIS Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to AXIS API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      courses: '/api/courses',
      progress: '/api/progress',
      careers: '/api/careers',
      feedback: '/api/feedback'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('=================================');
  console.log(`AXIS Backend Server Running`);
  console.log(`Port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('=================================');
});

module.exports = app;
