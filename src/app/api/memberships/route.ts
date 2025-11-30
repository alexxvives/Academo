import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';
import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils';
import { z } from 'zod';

const membershipRequestSchema = z.object({
  academyId: z.string(),
});

const updateMembershipSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const data = membershipRequestSchema.parse(body);

    // Check if academy exists
    const academy = await prisma.academy.findUnique({
      where: { id: data.academyId },
    });

    if (!academy) {
      return errorResponse('Academy not found', 404);
    }

    // Check if membership already exists
    const existing = await prisma.academyMembership.findUnique({
      where: {
        userId_academyId: {
          userId: session.id,
          academyId: data.academyId,
        },
      },
    });

    if (existing) {
      return errorResponse('Membership request already exists');
    }

    // Create membership request
    const membership = await prisma.academyMembership.create({
      data: {
        userId: session.id,
        academyId: data.academyId,
        status: 'PENDING',
      },
      include: {
        academy: true,
      },
    });

    return Response.json(successResponse(membership), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const academyId = searchParams.get('academyId');
    const status = searchParams.get('status');

    if (session.role === 'TEACHER' && academyId) {
      // Teachers can see membership requests for their academies
      const academy = await prisma.academy.findUnique({
        where: { id: academyId, ownerId: session.id },
      });

      if (!academy) {
        return errorResponse('Forbidden', 403);
      }

      const memberships = await prisma.academyMembership.findMany({
        where: {
          academyId,
          status: status ? (status as any) : undefined,
        },
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
        orderBy: {
          requestedAt: 'desc',
        },
      });

      return Response.json(successResponse(memberships));
    }

    // Students see their own memberships
    const memberships = await prisma.academyMembership.findMany({
      where: {
        userId: session.id,
      },
      include: {
        academy: true,
      },
      orderBy: {
        requestedAt: 'desc',
      },
    });

    return Response.json(successResponse(memberships));
  } catch (error) {
    return handleApiError(error);
  }
}
