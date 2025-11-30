import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { getStorageAdapter } from '@/lib/storage';
import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils';

export async function POST(request: Request) {
  try {
    const session = await requireRole(['ADMIN', 'TEACHER']);
    const formData = await request.formData();

    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const classId = formData.get('classId') as string;
    const maxWatchTimeMultiplier = formData.get('maxWatchTimeMultiplier') as string;

    if (!file || !title || !classId) {
      return errorResponse('Missing required fields');
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      return errorResponse('Only video files are allowed');
    }

    // Upload file
    const storage = getStorageAdapter();
    const storagePath = await storage.upload(file, 'videos');

    // Create upload record
    const upload = await prisma.upload.create({
      data: {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        storageType: process.env.STORAGE_TYPE || 'local',
        storagePath,
        uploadedById: session.id,
      },
    });

    // Create video record
    const video = await prisma.video.create({
      data: {
        title,
        description: description || null,
        classId,
        uploadId: upload.id,
        maxWatchTimeMultiplier: maxWatchTimeMultiplier
          ? parseFloat(maxWatchTimeMultiplier)
          : 2.0,
      },
      include: {
        upload: true,
        class: true,
      },
    });

    return Response.json(successResponse(video), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireRole(['ADMIN', 'TEACHER', 'STUDENT']);
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');

    if (!classId) {
      return errorResponse('Class ID required');
    }

    // Check access
    if (session.role === 'STUDENT') {
      const enrollment = await prisma.classEnrollment.findUnique({
        where: {
          classId_studentId: {
            classId,
            studentId: session.id,
          },
        },
      });

      if (!enrollment) {
        return errorResponse('Not enrolled in this class', 403);
      }
    }

    const videos = await prisma.video.findMany({
      where: { classId },
      include: {
        upload: true,
        playStates: {
          where: {
            studentId: session.id,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return Response.json(successResponse(videos));
  } catch (error) {
    return handleApiError(error);
  }
}
