import { requireRole } from '@/lib/auth';
import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils';
import { enrollmentQueries, classQueries } from '@/lib/db';

// POST: Student requests to join a class
export async function POST(request: Request) {
  try {
    const session = await requireRole(['STUDENT']);
    const body = await request.json();
    const { classId } = body;

    if (!classId) {
      return errorResponse('Class ID is required');
    }

    // Check if class exists
    const classData = await classQueries.findById(classId);
    if (!classData) {
      return errorResponse('Class not found', 404);
    }

    // Check if student already has an enrollment (pending or approved)
    const existingEnrollment = await enrollmentQueries.findByClassAndStudent(classId, session.id);
    if (existingEnrollment) {
      const status = (existingEnrollment as any).status;
      if (status === 'APPROVED') {
        return errorResponse('Ya tienes acceso a esta clase');
      } else if (status === 'PENDING') {
        return errorResponse('Ya tienes una solicitud pendiente para esta clase');
      }
    }

    // Create enrollment request with PENDING status
    const enrollment = await enrollmentQueries.create({
      classId,
      studentId: session.id,
      status: 'PENDING',
    });

    return Response.json(successResponse({
      message: 'Solicitud enviada correctamente',
      enrollment,
    }), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

// GET: Get student's enrollment requests
export async function GET(request: Request) {
  try {
    const session = await requireRole(['STUDENT']);
    
    const { getDB } = await import('@/lib/db');
    const db = await getDB();
    
    const result = await db.prepare(`
      SELECT e.*, c.name as className, a.name as academyName
      FROM ClassEnrollment e
      JOIN Class c ON e.classId = c.id
      JOIN Academy a ON c.academyId = a.id
      WHERE e.studentId = ?
      ORDER BY e.createdAt DESC
    `).bind(session.id).all();

    return Response.json(successResponse(result.results || []));
  } catch (error) {
    return handleApiError(error);
  }
}
