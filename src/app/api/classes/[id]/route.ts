import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const classData = await prisma.class.findUnique({
      where: { id },
      include: {
        academy: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
        videos: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        documents: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        enrollments: {
          include: {
            student: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            enrolledAt: 'desc',
          },
        },
      },
    });

    if (!classData) {
      return errorResponse('Class not found', 404);
    }

    // Check access permissions
    if (session.role === 'TEACHER') {
      // Teachers can only access classes in their academies
      if (classData.academy.ownerId !== session.id) {
        return errorResponse('Forbidden', 403);
      }
    } else if (session.role === 'STUDENT') {
      // Students can only access classes they're enrolled in
      const enrollment = await prisma.classEnrollment.findUnique({
        where: {
          classId_studentId: {
            classId: id,
            studentId: session.id,
          },
        },
      });

      if (!enrollment) {
        return errorResponse('Forbidden - not enrolled in this class', 403);
      }
    }
    // Admins can access all classes

    return Response.json(successResponse(classData));
  } catch (error) {
    return handleApiError(error);
  }
}
