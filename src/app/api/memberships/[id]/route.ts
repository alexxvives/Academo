import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils';
import { z } from 'zod';

const updateMembershipSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(['TEACHER', 'ADMIN']);
    const { id } = await params;
    const body = await request.json();
    const data = updateMembershipSchema.parse(body);

    // Get membership with academy
    const membership = await prisma.academyMembership.findUnique({
      where: { id },
      include: { academy: true },
    });

    if (!membership) {
      return errorResponse('Membership not found', 404);
    }

    // Check if user owns the academy (unless admin)
    if (session.role !== 'ADMIN' && membership.academy.ownerId !== session.id) {
      return errorResponse('Forbidden', 403);
    }

    // Update membership
    const updated = await prisma.academyMembership.update({
      where: { id },
      data: {
        status: data.status,
        approvedAt: data.status === 'APPROVED' ? new Date() : null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        academy: true,
      },
    });

    return Response.json(successResponse(updated));
  } catch (error) {
    return handleApiError(error);
  }
}
