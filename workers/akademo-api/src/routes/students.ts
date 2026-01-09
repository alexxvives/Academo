import { Hono } from 'hono';
import { Bindings } from '../types';
import { requireAuth, requireRole } from '../lib/auth';
import { successResponse, errorResponse } from '../lib/utils';

const students = new Hono<{ Bindings: Bindings }>();

// GET /students/progress - Get student progress for teacher's classes
students.get('/progress', async (c) => {
  try {
    const session = await requireAuth(c);

    if (session.role !== 'TEACHER' && session.role !== 'ACADEMY') {
      return c.json(errorResponse('Not authorized'), 403);
    }

    let query = '';
    let params: any[] = [];

    if (session.role === 'TEACHER') {
      // Get progress for students in teacher's classes
      query = `
        SELECT 
          u.id as studentId,
          u.firstName,
          u.lastName,
          u.email,
          c.id as classId,
          c.name as className,
          COUNT(DISTINCT vps.videoId) as videosWatched,
          COUNT(DISTINCT l.id) as totalLessons,
          COALESCE(AVG(lr.rating), 0) as averageRating
        FROM ClassEnrollment e
        JOIN User u ON e.userId = u.id
        JOIN Class c ON e.classId = c.id
        LEFT JOIN Lesson l ON l.classId = c.id
        LEFT JOIN VideoPlayState vps ON vps.studentId = u.id AND vps.status = 'COMPLETED'
        LEFT JOIN LessonRating lr ON lr.studentId = u.id AND lr.lessonId = l.id
        WHERE c.teacherId = ? AND e.status = 'APPROVED'
        GROUP BY u.id, u.firstName, u.lastName, u.email, c.id, c.name
        ORDER BY u.lastName, u.firstName
      `;
      params = [session.id];
    } else if (session.role === 'ACADEMY') {
      // Get progress for all students in academy owner's classes
      query = `
        SELECT 
          u.id as studentId,
          u.firstName,
          u.lastName,
          u.email,
          c.id as classId,
          c.name as className,
          COUNT(DISTINCT vps.videoId) as videosWatched,
          COUNT(DISTINCT l.id) as totalLessons,
          COALESCE(AVG(lr.rating), 0) as averageRating
        FROM ClassEnrollment e
        JOIN User u ON e.userId = u.id
        JOIN Class c ON e.classId = c.id
        JOIN Academy a ON c.academyId = a.id
        LEFT JOIN Lesson l ON l.classId = c.id
        LEFT JOIN VideoPlayState vps ON vps.studentId = u.id AND vps.status = 'COMPLETED'
        LEFT JOIN LessonRating lr ON lr.studentId = u.id AND lr.lessonId = l.id
        WHERE a.ownerId = ? AND e.status = 'APPROVED'
        GROUP BY u.id, u.firstName, u.lastName, u.email, c.id, c.name
        ORDER BY u.lastName, u.firstName
      `;
      params = [session.id];
    }

    const result = await c.env.DB.prepare(query).bind(...params).all();

    return c.json(successResponse(result.results || []));
  } catch (error: any) {
    console.error('[Students Progress] Error:', error);
    return c.json(errorResponse(error.message || 'Internal server error'), 500);
  }
});

export default students;
