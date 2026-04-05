# AXIS - Gamified Learning Management System

A modern, gamified learning platform designed to boost student engagement and prepare high school students for real-world success.

## Live Demo

**Try it now!**
- **Frontend:** https://axis-1-lslu.onrender.com
- **Backend API:** https://axis-5acz.onrender.com

**Test Accounts:**
- Student: `student@axis.com` / `student123`
- Teacher: `teacher@axis.com` / `teacher123`
- Admin: `admin@axis.com` / `admin123`

> **Note:** Backend may take 30-60 seconds to wake up on first request (free tier limitation).

##  Features

- **Gamified Learning**: Earn XP, unlock badges, and level up as you learn
- **Progress Tracking**: Real-time tracking of academic performance
- **Career Pathways**: Explore careers, track progress, and align learning with career goals
- **Automatic Skill Matching**: System automatically calculates career progress based on completed courses
- **Feedback System**: Continuous feedback between students and teachers
- **Challenge System**: Complete learning challenges and compete with peers
- **Role-Based Access**: Support for Students, Teachers, and Administrators
- **Leaderboard**: Compete with peers and see top performers

## Tech Stack

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

## Database Schema

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

## Getting Started

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

#### **Step 3: Setup Frontend **

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

---

## 🚀 Deployment on Render.com

The app is deployed on Render with separate services for frontend and backend.

### Production URLs
- **Frontend:** https://axis-1-lslu.onrender.com
- **Backend API:** https://axis-5acz.onrender.com

### Deployment Configuration

**Backend Service:**
- Platform: Render Web Service
- Build Command: `npm install`
- Start Command: `npm start`
- Environment Variables:
  - `NODE_ENV=production`
  - `JWT_SECRET=<secure-key>`
  - `DB_PATH=./database/axis.db`
  - `FRONTEND_URL=https://axis-1-lslu.onrender.com`

**Frontend Service:**
- Platform: Render Static Site
- Build Command: `npm install && npm run build`
- Publish Directory: `build`
- Environment Variables:
  - `REACT_APP_API_URL=https://axis-5acz.onrender.com`

### Free Tier Notes
⚠️ Backend sleeps after 15 minutes of inactivity
- First request takes 30-60 seconds to wake up
- Subsequent requests are fast
- Database persists across sleeps



---

##  API Endpoints

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



##  Gamification System

### XP & Levels
- Students earn XP by completing modules
- Every 100 XP = 1 Level
- Each module has a configurable XP value

##  User Roles

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

##  Security

- Passwords hashed with bcrypt
- JWT tokens for authentication
- Role-based access control
- Input validation on all endpoints


##  Developer

**Peter Michael Angelo Rucakibungo**  

