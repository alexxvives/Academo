import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils';
import { z } from 'zod';

const enrollSchema = z.object({
  classId: z.string(),
  studentId: z.string(),
});

export async function POST(request: Request) {
  try {
    const session = await requireRole(['TEACHER', 'ADMIN']);
    const body = await request.json();
    const data = enrollSchema.parse(body);

    // Verify class ownership (unless admin)
    if (session.role !== 'ADMIN') {
      const classRecord = await prisma.class.findUnique({
        where: { id: data.classId },
        include: { academy: true },
      });

      if (!classRecord || classRecord.academy.ownerId !== session.id) {
        return errorResponse('Forbidden', 403);
      }
    }

    // Check if already enrolled
    const existing = await prisma.classEnrollment.findUnique({
      where: {
        classId_studentId: {
          classId: data.classId,
          studentId: data.studentId,
        },
      },
    });

    if (existing) {
      return errorResponse('Student already enrolled');
    }

    // Create enrollment
    const enrollment = await prisma.classEnrollment.create({
      data: {
        classId: data.classId,
        studentId: data.studentId,
      },
      include: {
        student: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        class: true,
      },
    });

    return Response.json(successResponse(enrollment), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireRole(['ADMIN', 'TEACHER']);
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');

    if (!classId) {
      return errorResponse('Class ID required');
    }

    // Verify class ownership (unless admin)
    if (session.role !== 'ADMIN') {
      const classRecord = await prisma.class.findUnique({
        where: { id: classId },
        include: { academy: true },
      });

      if (!classRecord || classRecord.academy.ownerId !== session.id) {
        return errorResponse('Forbidden', 403);
      }
    }

    const enrollments = await prisma.classEnrollment.findMany({
      where: { classId },
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
    });

    return Response.json(successResponse(enrollments));
  } catch (error) {
    return handleApiError(error);
  }
}
