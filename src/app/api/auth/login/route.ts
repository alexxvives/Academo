import { prisma } from '@/lib/prisma';
import { verifyPassword, createSession } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = loginSchema.parse(body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      return errorResponse('Invalid credentials', 401);
    }

    // Verify password
    const valid = await verifyPassword(data.password, user.password);
    if (!valid) {
      return errorResponse('Invalid credentials', 401);
    }

    // Create session
    const sessionId = await createSession(user.id);

    return Response.json(
      successResponse({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      })
    );
  } catch (error) {
    return handleApiError(error);
  }
}
