import { classQueries, academyQueries } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils';
import { z } from 'zod';

const createClassSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  academyId: z.string(),
  defaultMaxWatchTimeMultiplier: z.number().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireRole(['TEACHER', 'ADMIN']);
    const body = await request.json();
    const data = createClassSchema.parse(body);

    // Verify academy ownership (unless admin)
    if (session.role !== 'ADMIN') {
      const academy = await academyQueries.findById(data.academyId) as any;

      if (!academy || academy.ownerId !== session.id) {
        return errorResponse('Forbidden', 403);
      }
    }

    const classRecord = await classQueries.create({
      name: data.name,
      description: data.description,
      academyId: data.academyId,
    });

    const academy = await academyQueries.findById(data.academyId);
    return Response.json(successResponse({ ...classRecord, academy }), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireRole(['ADMIN', 'TEACHER', 'STUDENT', 'ACADEMY']);
    const { searchParams } = new URL(request.url);
    const academyId = searchParams.get('academyId');

    console.log('[API /api/classes] GET request by user:', session.id, 'role:', session.role, 'academyId:', academyId);

    let classes;

    if (session.role === 'STUDENT') {
      // Students see only enrolled classes
      console.log('[API /api/classes] Fetching classes for student...');
      classes = await classQueries.findByStudentEnrollment(session.id);
    } else if (session.role === 'TEACHER') {
      // Teachers see classes in their academies
      console.log('[API /api/classes] Fetching classes for teacher...');
      classes = await classQueries.findByTeacher(session.id, academyId || undefined);
    } else if (session.role === 'ACADEMY') {
      // Academy owners see all classes in their academies
      console.log('[API /api/classes] Fetching classes for academy owner...');
      classes = await classQueries.findByAcademyOwner(session.id);
    } else {
      // Admin sees all classes
      console.log('[API /api/classes] Fetching classes for admin...');
      classes = await classQueries.findByTeacher(session.id, academyId || undefined);
    }

    console.log('[API /api/classes] Found', classes?.length || 0, 'classes');
    return Response.json(successResponse(classes));
  } catch (error) {
    console.error('[API /api/classes] Error:', error);
    return handleApiError(error);
  }
}
