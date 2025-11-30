import { prisma } from '@/lib/prisma';
import { requireRole, getSession } from '@/lib/auth';
import { generateDeviceFingerprint, getClientIP } from '@/lib/device-fingerprint';
import { handleApiError, successResponse } from '@/lib/api-utils';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    
    if (!session) {
      return Response.json(successResponse({ valid: false }));
    }

    const userAgent = request.headers.get('user-agent') || '';
    const ip = getClientIP(request);
    const fingerprint = generateDeviceFingerprint(userAgent, ip);

    // For students, enforce single active session
    if (session.role === 'STUDENT') {
      // Deactivate all other sessions
      await prisma.deviceSession.updateMany({
        where: {
          userId: session.id,
          deviceFingerprint: {
            not: fingerprint.fingerprint,
          },
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });

      // Create or update current session
      await prisma.deviceSession.upsert({
        where: {
          userId_deviceFingerprint: {
            userId: session.id,
            deviceFingerprint: fingerprint.fingerprint,
          },
        },
        create: {
          userId: session.id,
          deviceFingerprint: fingerprint.fingerprint,
          userAgent: fingerprint.userAgent,
          ipHash: fingerprint.ipHash,
          browser: fingerprint.browser,
          os: fingerprint.os,
          isActive: true,
        },
        update: {
          lastActiveAt: new Date(),
          isActive: true,
        },
      });
    }

    return Response.json(
      successResponse({
        valid: true,
        deviceFingerprint: fingerprint.fingerprint,
      })
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSession();
    
    if (!session) {
      return Response.json(successResponse({ valid: false }));
    }

    const userAgent = request.headers.get('user-agent') || '';
    const ip = getClientIP(request);
    const fingerprint = generateDeviceFingerprint(userAgent, ip);

    // Check if this device has an active session
    const deviceSession = await prisma.deviceSession.findUnique({
      where: {
        userId_deviceFingerprint: {
          userId: session.id,
          deviceFingerprint: fingerprint.fingerprint,
        },
      },
    });

    if (!deviceSession || !deviceSession.isActive) {
      return Response.json(
        successResponse({
          valid: false,
          message: 'Your session has been terminated because you logged in from another device.',
        })
      );
    }

    return Response.json(successResponse({ valid: true }));
  } catch (error) {
    return handleApiError(error);
  }
}
