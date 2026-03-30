const express = require('express');
const { dbGet, dbRun, dbAll } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /api/feedback/module/:moduleId/comment
 * Add a comment to a module (students and teachers)
 */
router.post('/module/:moduleId/comment', async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    // Verify module exists
    const module = await dbGet('SELECT id FROM modules WHERE id = ?', [moduleId]);
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Insert comment
    await dbRun(`
      INSERT INTO feedback (from_user_id, module_id, content, to_user_id)
      VALUES (?, ?, ?, NULL)
    `, [req.user.id, moduleId, content.trim()]);

    res.status(201).json({ message: 'Comment added successfully' });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

/**
 * GET /api/feedback/module/:moduleId/comments
 * Get all comments for a module
 */
router.get('/module/:moduleId/comments', async (req, res) => {
  try {
    const { moduleId } = req.params;

    const comments = await dbAll(`
      SELECT 
        f.id,
        f.content,
        f.created_at,
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.role
      FROM feedback f
      JOIN users u ON f.from_user_id = u.id
      WHERE f.module_id = ?
      ORDER BY f.created_at DESC
    `, [moduleId]);

    res.json({ comments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

/**
 * POST /api/feedback/course/:courseId/rating
 * Rate a course (students only)
 */
router.post('/course/:courseId/rating', requireRole('student'), async (req, res) => {
  try {
    const { courseId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Verify course exists
    const course = await dbGet('SELECT id, teacher_id FROM courses WHERE id = ?', [courseId]);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check if student is enrolled
    const enrollment = await dbGet(`
      SELECT id FROM enrollments 
      WHERE student_id = ? AND course_id = ?
    `, [req.user.id, courseId]);

    if (!enrollment) {
      return res.status(403).json({ error: 'You must be enrolled to rate this course' });
    }

    // Check if already rated
    const existingRating = await dbGet(`
      SELECT id FROM feedback 
      WHERE from_user_id = ? AND to_user_id = ? AND module_id IS NULL AND rating IS NOT NULL
    `, [req.user.id, course.teacher_id]);

    if (existingRating) {
      // Update existing rating
      await dbRun(`
        UPDATE feedback 
        SET rating = ?, content = ?, created_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [rating, comment || '', existingRating.id]);

      res.json({ message: 'Rating updated successfully' });
    } else {
      // Insert new rating
      await dbRun(`
        INSERT INTO feedback (from_user_id, to_user_id, rating, content)
        VALUES (?, ?, ?, ?)
      `, [req.user.id, course.teacher_id, rating, comment || '']);

      res.status(201).json({ message: 'Rating added successfully' });
    }
  } catch (error) {
    console.error('Rate course error:', error);
    res.status(500).json({ error: 'Failed to rate course' });
  }
});

/**
 * GET /api/feedback/course/:courseId/ratings
 * Get all ratings for a course
 */
router.get('/course/:courseId/ratings', async (req, res) => {
  try {
    const { courseId } = req.params;

    // Get course teacher
    const course = await dbGet('SELECT teacher_id FROM courses WHERE id = ?', [courseId]);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Get all ratings for this course (directed to the teacher)
    const ratings = await dbAll(`
      SELECT 
        f.id,
        f.rating,
        f.content as comment,
        f.created_at,
        u.first_name,
        u.last_name
      FROM feedback f
      JOIN users u ON f.from_user_id = u.id
      WHERE f.to_user_id = ? AND f.rating IS NOT NULL AND f.module_id IS NULL
      ORDER BY f.created_at DESC
    `, [course.teacher_id]);

    // Calculate average rating
    const averageRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

    res.json({
      ratings,
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings: ratings.length
    });
  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
});

/**
 * GET /api/feedback/course/:courseId/my-rating
 * Get current user's rating for a course (students only)
 */
router.get('/course/:courseId/my-rating', requireRole('student'), async (req, res) => {
  try {
    const { courseId } = req.params;

    // Get course teacher
    const course = await dbGet('SELECT teacher_id FROM courses WHERE id = ?', [courseId]);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Get user's rating
    const rating = await dbGet(`
      SELECT rating, content as comment, created_at
      FROM feedback
      WHERE from_user_id = ? AND to_user_id = ? AND rating IS NOT NULL AND module_id IS NULL
    `, [req.user.id, course.teacher_id]);

    res.json({ rating: rating || null });
  } catch (error) {
    console.error('Get my rating error:', error);
    res.status(500).json({ error: 'Failed to fetch rating' });
  }
});

/**
 * POST /api/feedback/student/:studentId/comment
 * Teacher adds feedback for a specific student (teachers only)
 */
router.post('/student/:studentId/comment', requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const { studentId } = req.params;
    const { content, moduleId } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Feedback content is required' });
    }

    // Verify student exists
    const student = await dbGet('SELECT id FROM users WHERE id = ? AND role = "student"', [studentId]);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Insert feedback
    await dbRun(`
      INSERT INTO feedback (from_user_id, to_user_id, module_id, content)
      VALUES (?, ?, ?, ?)
    `, [req.user.id, studentId, moduleId || null, content.trim()]);

    res.status(201).json({ message: 'Feedback sent successfully' });
  } catch (error) {
    console.error('Add student feedback error:', error);
    res.status(500).json({ error: 'Failed to send feedback' });
  }
});

/**
 * GET /api/feedback/my-feedback
 * Get feedback received by current user
 */
router.get('/my-feedback', async (req, res) => {
  try {
    const feedback = await dbAll(`
      SELECT 
        f.id,
        f.content,
        f.rating,
        f.created_at,
        f.module_id,
        u.first_name,
        u.last_name,
        u.role,
        m.title as module_title
      FROM feedback f
      JOIN users u ON f.from_user_id = u.id
      LEFT JOIN modules m ON f.module_id = m.id
      WHERE f.to_user_id = ?
      ORDER BY f.created_at DESC
      LIMIT 50
    `, [req.user.id]);

    res.json({ feedback });
  } catch (error) {
    console.error('Get my feedback error:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

/**
 * DELETE /api/feedback/:id
 * Delete a comment (only the author or admin can delete)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get feedback
    const feedback = await dbGet('SELECT from_user_id FROM feedback WHERE id = ?', [id]);
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    // Check permissions
    if (feedback.from_user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this feedback' });
    }

    // Delete feedback
    await dbRun('DELETE FROM feedback WHERE id = ?', [id]);

    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Delete feedback error:', error);
    res.status(500).json({ error: 'Failed to delete feedback' });
  }
});

module.exports = router;
