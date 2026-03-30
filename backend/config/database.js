const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure database directory exists
const dbDir = path.join(__dirname, '..', 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'axis.db');
const db = new sqlite3.Database(dbPath);

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Promisify db methods for easier use
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

/**
 * Initialize database with all required tables
 */
async function initializeDatabase() {
  console.log('Initializing database...');

  // Users table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student', 'teacher', 'admin')),
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      profile_picture TEXT,
      total_xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Courses table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      subject TEXT,
      grade_level TEXT,
      is_published BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Modules table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS modules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      content TEXT,
      question TEXT,
      correct_answer TEXT,
      xp_value INTEGER DEFAULT 10,
      order_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    )
  `);

  // Add question and correct_answer columns if they don't exist (for existing databases)
  try {
    await dbRun(`ALTER TABLE modules ADD COLUMN question TEXT`);
    await dbRun(`ALTER TABLE modules ADD COLUMN correct_answer TEXT`);
    console.log('✓ Added question and correct_answer columns to modules');
  } catch (err) {
    // Columns already exist, ignore error
  }

  // Student Progress table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS student_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      module_id INTEGER NOT NULL,
      status TEXT DEFAULT 'not_started' CHECK(status IN ('not_started', 'in_progress', 'completed')),
      xp_earned INTEGER DEFAULT 0,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
      UNIQUE(student_id, module_id)
    )
  `);

  // Badges table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      criteria TEXT,
      xp_required INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Student Badges table (achievements)
  await dbRun(`
    CREATE TABLE IF NOT EXISTS student_badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      badge_id INTEGER NOT NULL,
      earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
      UNIQUE(student_id, badge_id)
    )
  `);

  // Feedback table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user_id INTEGER NOT NULL,
      to_user_id INTEGER NOT NULL,
      module_id INTEGER,
      content TEXT NOT NULL,
      rating INTEGER CHECK(rating >= 1 AND rating <= 5),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE SET NULL
    )
  `);

  // Career Paths table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS career_paths (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      required_skills TEXT,
      average_salary TEXT,
      growth_outlook TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Student Career Progress table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS student_career_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      career_path_id INTEGER NOT NULL,
      progress_percentage INTEGER DEFAULT 0,
      skills_acquired TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (career_path_id) REFERENCES career_paths(id) ON DELETE CASCADE,
      UNIQUE(student_id, career_path_id)
    )
  `);

  // Enrollments table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      UNIQUE(student_id, course_id)
    )
  `);

  // Insert default badges
  const badgeCount = await dbGet('SELECT COUNT(*) as count FROM badges');
  if (badgeCount.count === 0) {
    const badges = [
      ['Beginner', 'Complete your first module', '🌱', 0],
      ['Quick Learner', 'Earn 100 XP', '⚡', 100],
      ['Knowledge Seeker', 'Earn 500 XP', '📚', 500],
      ['Master Student', 'Earn 1000 XP', '🎓', 1000],
      ['Challenge Accepted', 'Complete 5 modules', '🎯', 0],
      ['Dedicated', 'Complete 20 modules', '💪', 0],
      ['Expert', 'Reach Level 10', '⭐', 0]
    ];

    for (const badge of badges) {
      await dbRun(`INSERT INTO badges (name, description, icon, xp_required) VALUES (?, ?, ?, ?)`, badge);
    }
    console.log('✓ Default badges inserted');
  }

  console.log('✓ Database initialized successfully');
}

/**
 * Get database instance
 */
function getDatabase() {
  return db;
}

module.exports = {
  initializeDatabase,
  getDatabase,
  db,
  dbRun,
  dbGet,
  dbAll
};
