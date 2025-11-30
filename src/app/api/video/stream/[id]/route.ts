import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { handleApiError, errorResponse } from '@/lib/api-utils';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireAuth();

    // Get video with enrollment check
    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        upload: true,
        class: {
          include: {
            enrollments: {
              where: {
                studentId: session.id,
              },
            },
          },
        },
      },
    });

    if (!video) {
      return errorResponse('Video not found', 404);
    }

    // Check if user has access (admin, teacher of academy, or enrolled student)
    if (session.role === 'STUDENT') {
      if (video.class.enrollments.length === 0) {
        return errorResponse('Not enrolled in this class', 403);
      }
    }

    // Get or create play state
    let playState = await prisma.videoPlayState.findUnique({
      where: {
        videoId_studentId: {
          videoId: id,
          studentId: session.id,
        },
      },
    });

    if (!playState) {
      playState = await prisma.videoPlayState.create({
        data: {
          videoId: id,
          studentId: session.id,
          totalWatchTimeSeconds: 0,
        },
      });
    }

    // Note: Watch time limit is now enforced client-side via the player
    // The video stream is always available, but the player stops playback
    // when totalWatchTimeSeconds >= (durationSeconds × maxWatchTimeMultiplier)

    // Serve video file
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const filePath = path.join(uploadDir, video.upload.storagePath);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return errorResponse('Video file not found', 404);
    }

    const stat = await fs.stat(filePath);
    const fileSize = stat.size;
    const range = request.headers.get('range');

    if (range) {
      // Handle range request for seeking
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = await fs.readFile(filePath);
      const chunk = file.slice(start, end + 1);

      return new Response(chunk, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize.toString(),
          'Content-Type': video.upload.mimeType,
        },
      });
    } else {
      // Send entire file
      const file = await fs.readFile(filePath);
      return new Response(file, {
        headers: {
          'Content-Length': fileSize.toString(),
          'Content-Type': video.upload.mimeType,
        },
      });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
