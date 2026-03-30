# AXIS - Gamified Learning Management System

A modern, gamified learning platform designed to boost student engagement and prepare high school students for real-world success.

## 🚀 Features

- **Gamified Learning**: Earn XP, unlock badges, and level up as you learn
- **Progress Tracking**: Real-time tracking of academic performance
- **Career Pathways**: Explore careers, track progress, and align learning with career goals
- **Automatic Skill Matching**: System automatically calculates career progress based on completed courses
- **Feedback System**: Continuous feedback between students and teachers
- **Challenge System**: Complete learning challenges and compete with peers
- **Role-Based Access**: Support for Students, Teachers, and Administrators
- **Leaderboard**: Compete with peers and see top performers

## 🛠️ Tech Stack

### Frontend
- **React.js** - UI framework
- **CSS3** - Styling with green and white theme
- **Responsive Design** - Works on desktop and mobile

### Backend
- **Node.js & Express** - REST API server
- **SQLite** - Lightweight database (easy to get started)
- **JWT** - Secure authentication
- **bcrypt** - Password hashing

## 📁 Project Structure

```
AXIS/
├── frontend/           # React frontend application
│   ├── src/
│   │   ├── App.js     # Main landing page
│   │   ├── App.css    # Component styles
│   │   └── index.css  # Global styles & theme
│   └── package.json
│
├── backend/           # Node.js backend API
│   ├── config/
│   │   └── database.js     # SQLite database setup
│   ├── middleware/
│   │   └── auth.js         # JWT authentication
│   ├── routes/
│   │   ├── auth.js         # Login/Register endpoints
│   │   ├── users.js        # User management
│   │   ├── courses.js      # Course management
│   │   ├── progress.js     # Progress tracking & badges
│   │   └── careers.js      # Career pathways management
│   ├── server.js           # Express server
│   ├── seed.js             # Database seeding script
│   ├── .env                # Environment variables
│   └── package.json
│
├── implementation-plan.md           # Development roadmap
├── srs.txt                         # Software Requirements Specification
├── COURSE_CREATION_GUIDE.md        # Teacher guide for creating courses
├── STUDENT_ENROLLMENT_GUIDE.md     # Student guide for enrolling & learning
├── CAREER_PATHWAYS_GUIDE.md        # Career pathways feature documentation
├── QUICK_START_CAREER_PATHWAYS.md  # Quick testing guide
└── README.md                       # This file
```

## 🎮 Database Schema

### Core Tables
- **users** - Student, teacher, and admin accounts
- **courses** - Learning courses created by teachers
- **modules** - Individual lessons within courses
- **student_progress** - Track completion and XP earned
- **badges** - Achievement badges
- **student_badges** - Badges earned by students
- **enrollments** - Student-course relationships
- **feedback** - Peer and teacher feedback
- **career_paths** - Career pathway information with required skills
- **student_career_progress** - Track student progress toward career goals

## 🚀 Getting Started

### What You Need
- **Node.js** (version 14 or higher) - Download from https://nodejs.org/
- **npm** (comes automatically with Node.js)

**Check if you have them:**
```bash
node --version
npm --version
```

---

### 5-Step Setup

#### **Step 1: Install Node.js** 
If you don't have it:
1. Go to https://nodejs.org/
2. Download and install the LTS version
3. Restart your computer

---

#### **Step 2: Setup Backend (Server)**

Open terminal/command prompt and run these commands **one by one**:

```bash
# Navigate to backend folder
cd backend

# Install packages
npm install

# Create environment file (copy-paste all 5 lines together)
echo PORT=5000 > .env
echo NODE_ENV=development >> .env
echo JWT_SECRET=your-secret-key >> .env
echo DB_PATH=./database/axis.db >> .env
echo FRONTEND_URL=http://localhost:3000 >> .env

# Create database with test data
npm run seed

# Start backend server
npm start
```

✅ You should see: **"AXIS Backend Server Running"**  
✅ Keep this terminal window open!

---

#### **Step 3: Setup Frontend (Website)**

Open a **NEW** terminal window and run:

```bash
# Navigate to frontend folder
cd frontend

# Install packages
npm install

# Start frontend server
npm start
```

✅ Browser should open automatically to http://localhost:3000  
✅ Keep this terminal window open too!

---

#### **Step 4: Login**

Use these test accounts:

| Role | Email | Password |
|------|-------|----------|
| **Student** | student@axis.com | student123 |
| **Teacher** | teacher@axis.com | teacher123 |
| **Admin** | admin@axis.com | admin123 |

---

#### **Step 5: Stop the App**

When you're done:
- Press `Ctrl + C` in both terminal windows

---

### Quick Restart

Next time you want to run AXIS:

**Terminal 1:**
```bash
cd backend
npm start
```

**Terminal 2:**
```bash
cd frontend
npm start
```

---

### Troubleshooting

**"Port already in use"**
- Close other apps using port 5000 or 3000
- Or restart your computer

**"Cannot find module"**
```bash
cd backend
npm install
# then in another terminal:
cd frontend
npm install
```

**"Database error"**
```bash
cd backend
npm run seed
```

**Can't login**
- Make sure backend is running (check Terminal 1)
- Run `npm run seed` again in backend folder

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify` - Verify JWT token

### Users
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update profile
- `GET /api/users/leaderboard` - Get top students by XP

### Courses
- `GET /api/courses` - Get all published courses
- `POST /api/courses` - Create course (teachers only)
- `GET /api/courses/:id` - Get course details
- `POST /api/courses/:id/enroll` - Enroll in course
- `GET /api/courses/enrolled` - Get enrolled courses
- `POST /api/courses/:id/modules` - Add module to course

### Progress
- `POST /api/progress/module/:id/complete` - Complete a module (earns XP, updates career progress)
- `POST /api/progress/module/:id/start` - Mark module as in progress
- `GET /api/progress/course/:id` - Get progress for specific course
- `GET /api/progress/stats` - Get overall progress statistics

### Careers
- `GET /api/careers` - Get all career paths
- `GET /api/careers/:id` - Get specific career details
- `GET /api/careers/my/progress` - Get tracked careers with progress
- `POST /api/careers/:id/track` - Start tracking a career
- `DELETE /api/careers/:id/untrack` - Stop tracking a career
- `GET /api/careers/:id/recommended-courses` - Get recommended courses for career

## 🎨 Color Theme

- Primary Green: `#27ae60`
- Dark Green: `#229954`
- White: `#ffffff`
- Light Gray: `#f8f9fa`
- Text Dark: `#2c3e50`

## 🏆 Gamification System

### XP & Levels
- Students earn XP by completing modules
- Every 100 XP = 1 Level
- Each module has a configurable XP value

### Badges
- 🌱 **Beginner** - Complete your first module
- ⚡ **Quick Learner** - Earn 100 XP
- 📚 **Knowledge Seeker** - Earn 500 XP
- 🎓 **Master Student** - Earn 1000 XP
- 🎯 **Challenge Accepted** - Complete 5 modules
- 💪 **Dedicated** - Complete 20 modules
- ⭐ **Expert** - Reach Level 10

## 👥 User Roles

### Student
- Enroll in courses
- Complete modules and earn XP
- Track progress and badges
- View leaderboard

### Teacher
- Create and manage courses
- Add modules to courses
- View student progress
- Provide feedback

### Admin
- Full system access
- Manage all users and courses
- System configuration

## 🔒 Security

- Passwords hashed with bcrypt
- JWT tokens for authentication
- Role-based access control
- Input validation on all endpoints

## 📝 Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-key
DB_PATH=./database/axis.db
FRONTEND_URL=http://localhost:3000
```

## 🎯 Completed Features

### Phase 1: Core Foundation ✅
- ✅ User authentication (register/login)
- ✅ Role-based access (student/teacher/admin)
- ✅ Course creation and management
- ✅ Module system with XP rewards
- ✅ Progress tracking
- ✅ Badge system
- ✅ Leaderboard
- ✅ Responsive landing page

### Phase 2: Career Pathways ✅
- ✅ Career discovery and exploration
- ✅ Career tracking system
- ✅ Automatic progress calculation
- ✅ Skill acquisition tracking
- ✅ Real-time progress updates
- ✅ 6 pre-seeded career paths

## 🔜 Future Enhancements (Phase 3-4)

- [ ] Advanced feedback system
- [ ] Interactive challenges
- [ ] Real-time notifications
- [ ] File uploads for course materials
- [ ] Student-teacher messaging
- [ ] Analytics dashboard
- [ ] Enhanced career recommendations with AI
- [ ] Mobile app

## 📚 Documentation

- **[Course Creation Guide](COURSE_CREATION_GUIDE.md)** - Complete guide for teachers
- **[Student Enrollment Guide](STUDENT_ENROLLMENT_GUIDE.md)** - Guide for students
- **[Career Pathways Guide](CAREER_PATHWAYS_GUIDE.md)** - Detailed career pathways documentation
- **[Quick Start: Career Pathways](QUICK_START_CAREER_PATHWAYS.md)** - Quick testing guide
- **[Implementation Plan](implementation-plan.md)** - Technical architecture & roadmap

## 🎓 Career Pathways Feature

The Career Pathways system helps students:
- **Explore** 6 different career options with salary and growth data
- **Track** multiple careers simultaneously
- **Monitor** automatic progress based on completed courses
- **Align** their learning with real-world career requirements

### How It Works
1. Students browse and select careers to track
2. As they complete modules, the system analyzes content
3. Progress updates automatically when skills match career requirements
4. Students see their advancement toward each career goal (0-100%)

### Pre-Loaded Careers
- Software Developer (22% growth expected)
- Data Scientist (31% growth expected)
- Healthcare Professional (16% growth expected)
- Business Analyst (11% growth expected)
- Mechanical Engineer (7% growth expected)
- Digital Marketing Specialist (19% growth expected)

For detailed information, see [CAREER_PATHWAYS_GUIDE.md](CAREER_PATHWAYS_GUIDE.md)

## 👨‍💻 Developer

**Peter Michael Angelo Rucakibungo**  
African Leadership University  
2026

## 📄 License

MIT License - feel free to use this project for educational purposes.

## 🤝 Contributing

This is a university project, but suggestions and feedback are welcome!

---

**Built with ❤️ for transforming education in Africa**
