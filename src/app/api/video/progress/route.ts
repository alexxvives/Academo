import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils';
import { z } from 'zod';

const progressSchema = z.object({
  videoId: z.string(),
  studentId: z.string(),
  currentPositionSeconds: z.number(),
  watchTimeElapsed: z.number(),
});

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const data = progressSchema.parse(body);

    // Verify student ID matches session
    if (session.role === 'STUDENT' && data.studentId !== session.id) {
      return errorResponse('Unauthorized', 403);
    }

    // Get current play state
    const playState = await prisma.videoPlayState.findUnique({
      where: {
        videoId_studentId: {
          videoId: data.videoId,
          studentId: data.studentId,
        },
      },
    });

    if (!playState) {
      return errorResponse('Play state not found', 404);
    }

    // Update watch time
    const newTotalWatchTime = playState.totalWatchTimeSeconds + data.watchTimeElapsed;

    const updatedPlayState = await prisma.videoPlayState.update({
      where: {
        videoId_studentId: {
          videoId: data.videoId,
          studentId: data.studentId,
        },
      },
      data: {
        totalWatchTimeSeconds: newTotalWatchTime,
        lastWatchedAt: new Date(),
        sessionStartTime: playState.sessionStartTime || new Date(),
      },
    });

    return Response.json(
      successResponse({
        playState: updatedPlayState,
      })
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');
    const studentId = searchParams.get('studentId');

    if (!videoId) {
      return errorResponse('Video ID required');
    }

    const targetStudentId = studentId || session.id;

    // Verify authorization
    if (session.role === 'STUDENT' && targetStudentId !== session.id) {
      return errorResponse('Unauthorized', 403);
    }

    const playState = await prisma.videoPlayState.findUnique({
      where: {
        videoId_studentId: {
          videoId,
          studentId: targetStudentId,
        },
      },
    });

    if (!playState) {
      // Create initial play state
      const newPlayState = await prisma.videoPlayState.create({
        data: {
          videoId,
          studentId: targetStudentId,
          totalWatchTimeSeconds: 0,
        },
      });

      return Response.json(
        successResponse({
          playState: newPlayState,
        })
      );
    }

    return Response.json(
      successResponse({
        playState,
      })
    );
  } catch (error) {
    return handleApiError(error);
  }
}
