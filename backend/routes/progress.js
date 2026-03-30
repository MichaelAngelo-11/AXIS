const express = require('express');
const { dbGet, dbRun, dbAll } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * Calculate and award badges based on student's progress
 */
async function checkAndAwardBadges(studentId) {
  try {
    const student = await dbGet('SELECT total_xp, level FROM users WHERE id = ?', [studentId]);
    
    if (!student) return;

    // Get completed modules count
    const completedModules = await dbGet(
      'SELECT COUNT(*) as count FROM student_progress WHERE student_id = ? AND status = "completed"',
      [studentId]
    );

    const moduleCount = completedModules.count || 0;

    // Check XP-based badges
    const xpBadges = await dbAll(
      'SELECT * FROM badges WHERE xp_required > 0 AND xp_required <= ?',
      [student.total_xp]
    );

    // Award XP-based badges
    for (const badge of xpBadges) {
      await dbRun(
        'INSERT OR IGNORE INTO student_badges (student_id, badge_id) VALUES (?, ?)',
        [studentId, badge.id]
      );
    }

    // Award module completion badges
    if (moduleCount >= 1) {
      const beginnerBadge = await dbGet('SELECT id FROM badges WHERE name = "Beginner"');
      if (beginnerBadge) {
        await dbRun(
          'INSERT OR IGNORE INTO student_badges (student_id, badge_id) VALUES (?, ?)',
          [studentId, beginnerBadge.id]
        );
      }
    }

    if (moduleCount >= 5) {
      const challengeBadge = await dbGet('SELECT id FROM badges WHERE name = "Challenge Accepted"');
      if (challengeBadge) {
        await dbRun(
          'INSERT OR IGNORE INTO student_badges (student_id, badge_id) VALUES (?, ?)',
          [studentId, challengeBadge.id]
        );
      }
    }

    if (moduleCount >= 20) {
      const dedicatedBadge = await dbGet('SELECT id FROM badges WHERE name = "Dedicated"');
      if (dedicatedBadge) {
        await dbRun(
          'INSERT OR IGNORE INTO student_badges (student_id, badge_id) VALUES (?, ?)',
          [studentId, dedicatedBadge.id]
        );
      }
    }

    // Award level-based badges
    if (student.level >= 10) {
      const expertBadge = await dbGet('SELECT id FROM badges WHERE name = "Expert"');
      if (expertBadge) {
        await dbRun(
          'INSERT OR IGNORE INTO student_badges (student_id, badge_id) VALUES (?, ?)',
          [studentId, expertBadge.id]
        );
      }
    }
  } catch (error) {
    console.error('Error checking badges:', error);
  }
}

/**
 * Update career progress based on completed modules
 */
async function updateCareerProgress(studentId) {
  try {
    // Get all tracked career paths for this student
    const trackedCareers = await dbAll(
      'SELECT * FROM student_career_progress WHERE student_id = ?',
      [studentId]
    );

    for (const careerProgress of trackedCareers) {
      // Get career required skills
      const career = await dbGet(
        'SELECT required_skills FROM career_paths WHERE id = ?',
        [careerProgress.career_path_id]
      );

      if (!career || !career.required_skills) continue;

      const requiredSkills = career.required_skills.split(',').map(s => s.trim().toLowerCase());
      
      // Get all modules the student has completed
      const completedModules = await dbAll(`
        SELECT DISTINCT m.title, c.subject, c.title as course_title
        FROM student_progress sp
        JOIN modules m ON sp.module_id = m.id
        JOIN courses c ON m.course_id = c.id
        WHERE sp.student_id = ? AND sp.status = 'completed'
      `, [studentId]);

      // Calculate which skills have been acquired
      const acquiredSkills = new Set();
      
      for (const module of completedModules) {
        const moduleText = `${module.title} ${module.subject} ${module.course_title}`.toLowerCase();
        
        for (const skill of requiredSkills) {
          if (moduleText.includes(skill)) {
            acquiredSkills.add(skill);
          }
        }
      }

      // Calculate progress percentage
      const progressPercentage = Math.round((acquiredSkills.size / requiredSkills.length) * 100);
      
      // Update career progress
      await dbRun(`
        UPDATE student_career_progress 
        SET progress_percentage = ?, 
            skills_acquired = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE student_id = ? AND career_path_id = ?
      `, [
        progressPercentage,
        Array.from(acquiredSkills).join(','),
        studentId,
        careerProgress.career_path_id
      ]);
    }
  } catch (error) {
    console.error('Error updating career progress:', error);
  }
}

/**
 * POST /api/progress/module/:moduleId/complete
 * Mark a module as completed (students only) - validates answer if module has a question
 */
router.post('/module/:moduleId/complete', requireRole('student'), async (req, res) => {
  try {
    const moduleId = req.params.moduleId;
    const { answer } = req.body;

    // Get module details and XP value
    const module = await dbGet('SELECT * FROM modules WHERE id = ?', [moduleId]);
    
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // If module has a question, validate the answer
    if (module.question && module.correct_answer) {
      if (!answer || answer.trim().length === 0) {
        return res.status(400).json({ error: 'Answer is required to complete this module' });
      }

      // Case-insensitive comparison, trim whitespace
      const userAnswer = answer.trim().toLowerCase();
      const correctAnswer = module.correct_answer.trim().toLowerCase();

      if (userAnswer !== correctAnswer) {
        return res.status(400).json({ 
          error: 'Incorrect answer. Please try again!',
          incorrect: true 
        });
      }
    }

    // Check if already completed
    const existingProgress = await dbGet(`
      SELECT * FROM student_progress 
      WHERE student_id = ? AND module_id = ?
    `, [req.user.id, moduleId]);

    if (existingProgress && existingProgress.status === 'completed') {
      return res.status(400).json({ error: 'Module already completed' });
    }

    // Mark as completed or create new progress record
    if (existingProgress) {
      await dbRun(`
        UPDATE student_progress 
        SET status = 'completed', 
            xp_earned = ?,
            completed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE student_id = ? AND module_id = ?
      `, [module.xp_value, req.user.id, moduleId]);
    } else {
      await dbRun(`
        INSERT INTO student_progress (student_id, module_id, status, xp_earned, completed_at)
        VALUES (?, ?, 'completed', ?, CURRENT_TIMESTAMP)
      `, [req.user.id, moduleId, module.xp_value]);
    }

    // Update user's total XP and level
    const user = await dbGet('SELECT total_xp, level FROM users WHERE id = ?', [req.user.id]);
    const newXP = user.total_xp + module.xp_value;
    const newLevel = Math.floor(newXP / 100) + 1; // Simple leveling: 100 XP per level

    await dbRun(`
      UPDATE users 
      SET total_xp = ?, 
          level = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [newXP, newLevel, req.user.id]);

    // Check and award badges
    await checkAndAwardBadges(req.user.id);

    // Update career progress
    await updateCareerProgress(req.user.id);

    // Get updated user data
    const updatedUser = await dbGet(
      'SELECT id, email, role, first_name, last_name, total_xp, level FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({
      message: 'Module completed successfully!',
      xpEarned: module.xp_value,
      totalXP: newXP,
      level: newLevel,
      user: updatedUser
    });
  } catch (error) {
    console.error('Complete module error:', error);
    res.status(500).json({ error: 'Failed to complete module' });
  }
});

/**
 * POST /api/progress/module/:moduleId/start
 * Mark a module as in progress (students only)
 */
router.post('/module/:moduleId/start', requireRole('student'), async (req, res) => {
  try {
    const moduleId = req.params.moduleId;

    // Verify module exists
    const module = await dbGet('SELECT id FROM modules WHERE id = ?', [moduleId]);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Create or update progress
    await dbRun(`
      INSERT INTO student_progress (student_id, module_id, status)
      VALUES (?, ?, 'in_progress')
      ON CONFLICT(student_id, module_id) 
      DO UPDATE SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP
    `, [req.user.id, moduleId]);

    res.json({ message: 'Module progress started' });
  } catch (error) {
    console.error('Start module error:', error);
    res.status(500).json({ error: 'Failed to start module' });
  }
});

/**
 * GET /api/progress/course/:courseId
 * Get student's progress for a specific course
 */
router.get('/course/:courseId', requireRole('student'), async (req, res) => {
  try {
    const courseId = req.params.courseId;

    // Get all modules for the course with progress
    const modules = await dbAll(`
      SELECT 
        m.*,
        sp.status,
        sp.xp_earned,
        sp.completed_at
      FROM modules m
      LEFT JOIN student_progress sp ON m.id = sp.module_id AND sp.student_id = ?
      WHERE m.course_id = ?
      ORDER BY m.order_index ASC, m.created_at ASC
    `, [req.user.id, courseId]);

    // Calculate overall progress
    const totalModules = modules.length;
    const completedModules = modules.filter(m => m.status === 'completed').length;
    const progressPercentage = totalModules > 0 
      ? Math.round((completedModules / totalModules) * 100) 
      : 0;

    res.json({
      modules,
      totalModules,
      completedModules,
      progressPercentage
    });
  } catch (error) {
    console.error('Get course progress error:', error);
    res.status(500).json({ error: 'Failed to fetch course progress' });
  }
});

/**
 * GET /api/progress/stats
 * Get student's overall progress statistics
 */
router.get('/stats', requireRole('student'), async (req, res) => {
  try {
    // Get total modules completed
    const completedModules = await dbGet(`
      SELECT COUNT(*) as count 
      FROM student_progress 
      WHERE student_id = ? AND status = 'completed'
    `, [req.user.id]);

    // Get badges earned
    const badgesEarned = await dbGet(`
      SELECT COUNT(*) as count 
      FROM student_badges 
      WHERE student_id = ?
    `, [req.user.id]);

    // Get courses enrolled
    const coursesEnrolled = await dbGet(`
      SELECT COUNT(*) as count 
      FROM enrollments 
      WHERE student_id = ?
    `, [req.user.id]);

    // Get user data
    const user = await dbGet(
      'SELECT total_xp, level FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({
      totalXP: user?.total_xp || 0,
      level: user?.level || 1,
      completedModules: completedModules.count,
      badgesEarned: badgesEarned.count,
      coursesEnrolled: coursesEnrolled.count
    });
  } catch (error) {
    console.error('Get progress stats error:', error);
    res.status(500).json({ error: 'Failed to fetch progress statistics' });
  }
});

module.exports = router;
