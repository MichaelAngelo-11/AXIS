const express = require('express');
const { dbGet, dbRun, dbAll } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/courses
 * Get all published courses
 */
router.get('/', async (req, res) => {
  try {
    const courses = await dbAll(`
      SELECT c.*, u.first_name, u.last_name
      FROM courses c
      JOIN users u ON c.teacher_id = u.id
      WHERE c.is_published = 1
      ORDER BY c.created_at DESC
    `);

    res.json({ courses });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

/**
 * GET /api/courses/my-courses
 * Get courses taught by current teacher
 */
router.get('/my-courses', requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const courses = await dbAll(`
      SELECT * FROM courses
      WHERE teacher_id = ?
      ORDER BY created_at DESC
    `, [req.user.id]);

    res.json({ courses });
  } catch (error) {
    console.error('Get my courses error:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

/**
 * GET /api/courses/enrolled
 * Get courses the current student is enrolled in
 */
router.get('/enrolled', requireRole('student'), async (req, res) => {
  try {
    const courses = await dbAll(`
      SELECT c.*, u.first_name, u.last_name, e.enrolled_at
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      JOIN users u ON c.teacher_id = u.id
      WHERE e.student_id = ?
      ORDER BY e.enrolled_at DESC
    `, [req.user.id]);

    res.json({ courses });
  } catch (error) {
    console.error('Get enrolled courses error:', error);
    res.status(500).json({ error: 'Failed to fetch enrolled courses' });
  }
});

/**
 * GET /api/courses/:id/students
 * Get enrolled students for a course (teachers/admins only)
 * MUST come before /:id route
 */
router.get('/:id/students', requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const courseId = req.params.id;

    // Verify course exists and belongs to teacher (unless admin)
    const course = await dbGet('SELECT teacher_id FROM courses WHERE id = ?', [courseId]);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (req.user.role !== 'admin' && course.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this course' });
    }

    // Get enrolled students with their progress
    const students = await dbAll(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.total_xp,
        u.level,
        e.enrolled_at,
        (SELECT COUNT(*) FROM student_progress sp 
         JOIN modules m ON sp.module_id = m.id 
         WHERE sp.student_id = u.id AND m.course_id = ? AND sp.status = 'completed') as completed_modules,
        (SELECT COUNT(*) FROM modules WHERE course_id = ?) as total_modules,
        (SELECT SUM(xp_earned) FROM student_progress sp 
         JOIN modules m ON sp.module_id = m.id 
         WHERE sp.student_id = u.id AND m.course_id = ?) as course_xp
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      WHERE e.course_id = ?
      ORDER BY e.enrolled_at DESC
    `, [courseId, courseId, courseId, courseId]);

    // Calculate progress percentage for each student
    const studentsWithProgress = students.map(student => ({
      ...student,
      progress_percentage: student.total_modules > 0 
        ? Math.round((student.completed_modules / student.total_modules) * 100)
        : 0
    }));

    res.json({ students: studentsWithProgress });
  } catch (error) {
    console.error('Get course students error:', error);
    res.status(500).json({ error: 'Failed to fetch course students' });
  }
});

/**
 * GET /api/courses/:courseId/student/:studentId/progress
 * Get detailed progress for a specific student in a course (teachers/admins only)
 * MUST come before /:id route
 */
router.get('/:courseId/student/:studentId/progress', requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const { courseId, studentId } = req.params;

    // Verify course exists and belongs to teacher (unless admin)
    const course = await dbGet('SELECT teacher_id FROM courses WHERE id = ?', [courseId]);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (req.user.role !== 'admin' && course.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this course' });
    }

    // Get student info
    const student = await dbGet(`
      SELECT id, first_name, last_name, email, total_xp, level
      FROM users WHERE id = ? AND role = 'student'
    `, [studentId]);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get module progress
    const moduleProgress = await dbAll(`
      SELECT 
        m.id,
        m.title,
        m.xp_value,
        sp.status,
        sp.xp_earned,
        sp.completed_at
      FROM modules m
      LEFT JOIN student_progress sp ON m.id = sp.module_id AND sp.student_id = ?
      WHERE m.course_id = ?
      ORDER BY m.order_index ASC, m.created_at ASC
    `, [studentId, courseId]);

    res.json({ student, moduleProgress });
  } catch (error) {
    console.error('Get student progress error:', error);
    res.status(500).json({ error: 'Failed to fetch student progress' });
  }
});

/**
 * GET /api/courses/:id
 * Get course details with modules
 */
router.get('/:id', async (req, res) => {
  try {
    const course = await dbGet(`
      SELECT c.*, u.first_name, u.last_name
      FROM courses c
      JOIN users u ON c.teacher_id = u.id
      WHERE c.id = ?
    `, [req.params.id]);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Get modules for this course
    const modules = await dbAll(`
      SELECT * FROM modules
      WHERE course_id = ?
      ORDER BY order_index ASC
    `, [req.params.id]);

    res.json({ course, modules });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

/**
 * POST /api/courses
 * Create a new course (teachers only)
 */
router.post('/', requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const { title, description, subject, gradeLevel } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const result = await dbRun(`
      INSERT INTO courses (teacher_id, title, description, subject, grade_level)
      VALUES (?, ?, ?, ?, ?)
    `, [req.user.id, title, description, subject, gradeLevel]);

    const course = await dbGet('SELECT * FROM courses WHERE id = ?', [result.lastID]);

    res.status(201).json({ 
      message: 'Course created successfully',
      course 
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

/**
 * POST /api/courses/:id/enroll
 * Enroll in a course (students only)
 */
router.post('/:id/enroll', requireRole('student'), async (req, res) => {
  try {
    const courseId = req.params.id;

    // Check if course exists
    const course = await dbGet('SELECT id FROM courses WHERE id = ? AND is_published = 1', [courseId]);

    if (!course) {
      return res.status(404).json({ error: 'Course not found or not published' });
    }

    // Check if already enrolled
    const existing = await dbGet(`
      SELECT id FROM enrollments 
      WHERE student_id = ? AND course_id = ?
    `, [req.user.id, courseId]);

    if (existing) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    // Enroll student
    await dbRun(`
      INSERT INTO enrollments (student_id, course_id)
      VALUES (?, ?)
    `, [req.user.id, courseId]);

    res.json({ message: 'Successfully enrolled in course' });
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({ error: 'Failed to enroll in course' });
  }
});

/**
 * PUT /api/courses/:id/publish
 * Publish or unpublish a course (teachers only)
 */
router.put('/:id/publish', requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const courseId = req.params.id;
    const { isPublished } = req.body;

    // Verify course belongs to teacher
    const course = await dbGet('SELECT teacher_id FROM courses WHERE id = ?', [courseId]);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to modify this course' });
    }

    // Update publish status
    await dbRun(`
      UPDATE courses 
      SET is_published = ? 
      WHERE id = ?
    `, [isPublished ? 1 : 0, courseId]);

    res.json({ 
      message: isPublished ? 'Course published successfully' : 'Course unpublished',
      isPublished 
    });
  } catch (error) {
    console.error('Publish course error:', error);
    res.status(500).json({ error: 'Failed to update course status' });
  }
});

/**
 * POST /api/courses/:id/modules
 * Add a module to a course (teachers only)
 */
router.post('/:id/modules', requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const { title, description, content, question, correctAnswer, xpValue, orderIndex } = req.body;
    const courseId = req.params.id;

    // Verify course belongs to teacher
    const course = await dbGet('SELECT teacher_id FROM courses WHERE id = ?', [courseId]);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to modify this course' });
    }

    const result = await dbRun(`
      INSERT INTO modules (course_id, title, description, content, question, correct_answer, xp_value, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [courseId, title, description, content, question || null, correctAnswer || null, xpValue || 10, orderIndex || 0]);

    const module = await dbGet('SELECT * FROM modules WHERE id = ?', [result.lastID]);

    res.status(201).json({ 
      message: 'Module created successfully',
      module 
    });
  } catch (error) {
    console.error('Create module error:', error);
    res.status(500).json({ error: 'Failed to create module' });
  }
});

/**
 * PUT /api/courses/:id
 * Update a course (teachers only)
 */
router.put('/:id', requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const courseId = req.params.id;
    const { title, description, subject, gradeLevel } = req.body;

    // Verify course belongs to teacher
    const course = await dbGet('SELECT teacher_id FROM courses WHERE id = ?', [courseId]);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to modify this course' });
    }

    // Update course
    await dbRun(`
      UPDATE courses 
      SET title = ?, description = ?, subject = ?, grade_level = ?
      WHERE id = ?
    `, [title, description, subject, gradeLevel, courseId]);

    const updatedCourse = await dbGet('SELECT * FROM courses WHERE id = ?', [courseId]);

    res.json({ 
      message: 'Course updated successfully',
      course: updatedCourse 
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

/**
 * DELETE /api/courses/:id
 * Delete a course (teachers only)
 */
router.delete('/:id', requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const courseId = req.params.id;

    // Verify course belongs to teacher
    const course = await dbGet('SELECT teacher_id FROM courses WHERE id = ?', [courseId]);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this course' });
    }

    // Delete course (CASCADE will handle modules, enrollments, etc.)
    await dbRun('DELETE FROM courses WHERE id = ?', [courseId]);

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

/**
 * PUT /api/courses/:courseId/modules/:moduleId
 * Update a module (teachers only)
 */
router.put('/:courseId/modules/:moduleId', requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const { courseId, moduleId } = req.params;
    const { title, description, content, question, correctAnswer, xpValue, orderIndex } = req.body;

    // Verify course belongs to teacher
    const course = await dbGet('SELECT teacher_id FROM courses WHERE id = ?', [courseId]);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to modify this course' });
    }

    // Update module
    await dbRun(`
      UPDATE modules 
      SET title = ?, description = ?, content = ?, question = ?, correct_answer = ?, xp_value = ?, order_index = ?
      WHERE id = ? AND course_id = ?
    `, [title, description, content, question || null, correctAnswer || null, xpValue, orderIndex, moduleId, courseId]);

    const updatedModule = await dbGet('SELECT * FROM modules WHERE id = ?', [moduleId]);

    res.json({ 
      message: 'Module updated successfully',
      module: updatedModule 
    });
  } catch (error) {
    console.error('Update module error:', error);
    res.status(500).json({ error: 'Failed to update module' });
  }
});

/**
 * DELETE /api/courses/:courseId/modules/:moduleId
 * Delete a module (teachers only)
 */
router.delete('/:courseId/modules/:moduleId', requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const { courseId, moduleId } = req.params;

    // Verify course belongs to teacher
    const course = await dbGet('SELECT teacher_id FROM courses WHERE id = ?', [courseId]);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to modify this course' });
    }

    // Delete module
    await dbRun('DELETE FROM modules WHERE id = ? AND course_id = ?', [moduleId, courseId]);

    res.json({ message: 'Module deleted successfully' });
  } catch (error) {
    console.error('Delete module error:', error);
    res.status(500).json({ error: 'Failed to delete module' });
  }
});

module.exports = router;
