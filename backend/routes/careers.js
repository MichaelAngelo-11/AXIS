const express = require('express');
const { dbGet, dbRun, dbAll } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/careers
 * Get all available career paths
 */
router.get('/', async (req, res) => {
  try {
    const careers = await dbAll('SELECT * FROM career_paths ORDER BY name ASC');
    res.json({ careers });
  } catch (error) {
    console.error('Get careers error:', error);
    res.status(500).json({ error: 'Failed to fetch career paths' });
  }
});

/**
 * GET /api/careers/:id
 * Get specific career path details
 */
router.get('/:id', async (req, res) => {
  try {
    const career = await dbGet('SELECT * FROM career_paths WHERE id = ?', [req.params.id]);
    
    if (!career) {
      return res.status(404).json({ error: 'Career path not found' });
    }

    res.json({ career });
  } catch (error) {
    console.error('Get career error:', error);
    res.status(500).json({ error: 'Failed to fetch career path' });
  }
});

/**
 * GET /api/careers/my-progress
 * Get student's career progress (students only)
 */
router.get('/my/progress', requireRole('student'), async (req, res) => {
  try {
    const progress = await dbAll(`
      SELECT scp.*, cp.name, cp.description, cp.required_skills, cp.average_salary, cp.growth_outlook
      FROM student_career_progress scp
      JOIN career_paths cp ON scp.career_path_id = cp.id
      WHERE scp.student_id = ?
      ORDER BY scp.updated_at DESC
    `, [req.user.id]);

    res.json({ progress });
  } catch (error) {
    console.error('Get career progress error:', error);
    res.status(500).json({ error: 'Failed to fetch career progress' });
  }
});

/**
 * POST /api/careers/:id/track
 * Start tracking a career path (students only)
 */
router.post('/:id/track', requireRole('student'), async (req, res) => {
  try {
    const careerPathId = req.params.id;

    // Check if career path exists
    const career = await dbGet('SELECT id FROM career_paths WHERE id = ?', [careerPathId]);
    if (!career) {
      return res.status(404).json({ error: 'Career path not found' });
    }

    // Check if already tracking
    const existing = await dbGet(`
      SELECT id FROM student_career_progress 
      WHERE student_id = ? AND career_path_id = ?
    `, [req.user.id, careerPathId]);

    if (existing) {
      return res.status(400).json({ error: 'Already tracking this career path' });
    }

    // Start tracking
    await dbRun(`
      INSERT INTO student_career_progress (student_id, career_path_id, progress_percentage, skills_acquired)
      VALUES (?, ?, 0, '')
    `, [req.user.id, careerPathId]);

    res.json({ message: 'Started tracking career path successfully' });
  } catch (error) {
    console.error('Track career error:', error);
    res.status(500).json({ error: 'Failed to track career path' });
  }
});

/**
 * DELETE /api/careers/:id/untrack
 * Stop tracking a career path (students only)
 */
router.delete('/:id/untrack', requireRole('student'), async (req, res) => {
  try {
    const careerPathId = req.params.id;

    await dbRun(`
      DELETE FROM student_career_progress 
      WHERE student_id = ? AND career_path_id = ?
    `, [req.user.id, careerPathId]);

    res.json({ message: 'Stopped tracking career path' });
  } catch (error) {
    console.error('Untrack career error:', error);
    res.status(500).json({ error: 'Failed to untrack career path' });
  }
});

/**
 * GET /api/careers/:id/recommended-courses
 * Get courses that match a career path's required skills
 */
router.get('/:id/recommended-courses', async (req, res) => {
  try {
    const career = await dbGet('SELECT required_skills FROM career_paths WHERE id = ?', [req.params.id]);
    
    if (!career) {
      return res.status(404).json({ error: 'Career path not found' });
    }

    // Get all published courses
    // In a real system, you'd match by skills/tags
    const courses = await dbAll(`
      SELECT c.*, u.first_name, u.last_name
      FROM courses c
      JOIN users u ON c.teacher_id = u.id
      WHERE c.is_published = 1
      ORDER BY c.created_at DESC
      LIMIT 10
    `);

    res.json({ courses, requiredSkills: career.required_skills.split(',') });
  } catch (error) {
    console.error('Get recommended courses error:', error);
    res.status(500).json({ error: 'Failed to fetch recommended courses' });
  }
});

module.exports = router;
