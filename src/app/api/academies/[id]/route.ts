import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const academy = await prisma.academy.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
        },
        classes: {
          include: {
            _count: {
              select: {
                enrollments: true,
                videos: true,
                documents: true,
              },
            },
          },
        },
      },
    });

    if (!academy) {
      return errorResponse('Academy not found', 404);
    }

    return Response.json(successResponse(academy));
  } catch (error) {
    return handleApiError(error);
  }
}
