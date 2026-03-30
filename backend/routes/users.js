const express = require('express');
const { dbGet, dbAll, dbRun } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Admin routes (must come before parameterized routes)
/**
 * GET /api/users/admin/stats
 * Get system statistics (admin only)
 */
router.get('/admin/stats', requireRole('admin'), async (req, res) => {
  try {
    // Total users by role
    const totalUsers = await dbGet('SELECT COUNT(*) as count FROM users');
    const totalStudents = await dbGet('SELECT COUNT(*) as count FROM users WHERE role = "student"');
    const totalTeachers = await dbGet('SELECT COUNT(*) as count FROM users WHERE role = "teacher"');
    
    // Total courses
    const totalCourses = await dbGet('SELECT COUNT(*) as count FROM courses');
    const publishedCourses = await dbGet('SELECT COUNT(*) as count FROM courses WHERE is_published = 1');
    
    // Total modules
    const totalModules = await dbGet('SELECT COUNT(*) as count FROM modules');
    
    // Total XP earned
    const totalXP = await dbGet('SELECT SUM(total_xp) as sum FROM users');
    
    // Total badges earned
    const totalBadges = await dbGet('SELECT COUNT(*) as count FROM student_badges');
    
    res.json({
      stats: {
        totalUsers: totalUsers.count,
        totalStudents: totalStudents.count,
        totalTeachers: totalTeachers.count,
        totalCourses: totalCourses.count,
        publishedCourses: publishedCourses.count,
        totalModules: totalModules.count,
        totalXP: totalXP.sum || 0,
        totalBadges: totalBadges.count
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * GET /api/users/admin/all-users
 * Get all users (admin only)
 */
router.get('/admin/all-users', requireRole('admin'), async (req, res) => {
  try {
    const users = await dbAll(`
      SELECT id, email, role, first_name, last_name, total_xp, level, created_at
      FROM users
      ORDER BY created_at DESC
    `);
    
    res.json({ users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * GET /api/users/admin/all-courses
 * Get all courses with details (admin only)
 */
router.get('/admin/all-courses', requireRole('admin'), async (req, res) => {
  try {
    const courses = await dbAll(`
      SELECT 
        c.*,
        u.first_name || ' ' || u.last_name as teacher_name,
        (SELECT COUNT(*) FROM modules WHERE course_id = c.id) as module_count
      FROM courses c
      JOIN users u ON c.teacher_id = u.id
      ORDER BY c.created_at DESC
    `);
    
    res.json({ courses });
  } catch (error) {
    console.error('Get all courses error:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

/**
 * DELETE /api/users/admin/user/:id
 * Delete a user (admin only)
 */
router.delete('/admin/user/:id', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    // Delete user (CASCADE will handle related data)
    await dbRun('DELETE FROM users WHERE id = ?', [id]);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Regular user routes
/**
 * GET /api/users/leaderboard
 * Get top students by XP
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const leaderboard = await dbAll(`
      SELECT 
        id,
        first_name,
        last_name,
        total_xp,
        level,
        (SELECT COUNT(*) FROM student_progress WHERE student_id = users.id AND status = 'completed') as completed_modules,
        (SELECT COUNT(*) FROM student_badges WHERE student_id = users.id) as badges_earned
      FROM users
      WHERE role = 'student'
      ORDER BY total_xp DESC, level DESC
      LIMIT ?
    `, [limit]);

    res.json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

/**
 * GET /api/users/me
 * Get current user profile
 */
router.get('/me', async (req, res) => {
  try {
    const user = await dbGet(`
      SELECT id, email, role, first_name, last_name, profile_picture, 
             total_xp, level, created_at
      FROM users WHERE id = ?
    `, [req.user.id]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's badges
    const badges = await dbAll(`
      SELECT b.id, b.name, b.description, b.icon, sb.earned_at
      FROM student_badges sb
      JOIN badges b ON sb.badge_id = b.id
      WHERE sb.student_id = ?
      ORDER BY sb.earned_at DESC
    `, [req.user.id]);

    res.json({ user, badges });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

/**
 * PUT /api/users/me
 * Update current user profile
 */
router.put('/me', async (req, res) => {
  try {
    const { firstName, lastName, profilePicture } = req.body;
    
    await dbRun(`
      UPDATE users 
      SET first_name = COALESCE(?, first_name),
          last_name = COALESCE(?, last_name),
          profile_picture = COALESCE(?, profile_picture),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [firstName, lastName, profilePicture, req.user.id]);

    const updatedUser = await dbGet(`
      SELECT id, email, role, first_name, last_name, profile_picture, 
             total_xp, level
      FROM users WHERE id = ?
    `, [req.user.id]);

    res.json({ 
      message: 'Profile updated successfully',
      user: updatedUser 
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * GET /api/users/:id
 * Get user by ID (teachers and admins only)
 */
router.get('/:id', requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const user = await dbGet(`
      SELECT id, email, role, first_name, last_name, total_xp, level, created_at
      FROM users WHERE id = ?
    `, [req.params.id]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});


module.exports = router;
