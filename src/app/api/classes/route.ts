import { prisma } from '@/lib/prisma';
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
      const academy = await prisma.academy.findUnique({
        where: { id: data.academyId, ownerId: session.id },
      });

      if (!academy) {
        return errorResponse('Forbidden', 403);
      }
    }

    const classRecord = await prisma.class.create({
      data: {
        name: data.name,
        description: data.description,
        academyId: data.academyId,
        defaultMaxWatchTimeMultiplier: data.defaultMaxWatchTimeMultiplier,
      },
      include: {
        academy: true,
      },
    });

    return Response.json(successResponse(classRecord), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireRole(['ADMIN', 'TEACHER', 'STUDENT']);
    const { searchParams } = new URL(request.url);
    const academyId = searchParams.get('academyId');

    let classes;

    if (session.role === 'STUDENT') {
      // Students see only enrolled classes
      classes = await prisma.class.findMany({
        where: {
          academyId: academyId || undefined,
          enrollments: {
            some: {
              studentId: session.id,
            },
          },
        },
        include: {
          academy: true,
          _count: {
            select: {
              enrollments: true,
              videos: true,
              documents: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } else {
      // Teachers and admins see classes in their academies
      const where: any = academyId ? { academyId } : {};

      if (session.role === 'TEACHER') {
        where.academy = {
          ownerId: session.id,
        };
      }

      classes = await prisma.class.findMany({
        where,
        include: {
          academy: true,
          _count: {
            select: {
              enrollments: true,
              videos: true,
              documents: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    return Response.json(successResponse(classes));
  } catch (error) {
    return handleApiError(error);
  }
}
