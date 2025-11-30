import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['STUDENT', 'TEACHER']).default('STUDENT'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return errorResponse('Email already registered');
    }

    // Create user
    const hashedPassword = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    // Auto-create academy for teachers
    if (data.role === 'TEACHER') {
      await prisma.academy.create({
        data: {
          name: `${data.firstName} ${data.lastName}'s Academy`,
          description: `Welcome to ${data.firstName}'s teaching space`,
          ownerId: user.id,
        },
      });
    }

    return Response.json(successResponse(user), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
