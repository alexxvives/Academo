import { prisma } from './prisma';

export async function getPlatformSettings() {
  let settings = await prisma.platformSettings.findUnique({
    where: { id: 'platform_settings' },
  });

  if (!settings) {
    settings = await prisma.platformSettings.create({
      data: {
        id: 'platform_settings',
        defaultMaxPlays: 2,
        defaultMaxSeekBackMinutes: 10,
      },
    });
  }

  return settings;
}

export async function getEffectiveVideoSettings(videoId: string) {
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: {
      class: {
        include: {
          academy: true,
        },
      },
    },
  });

  if (!video) {
    throw new Error('Video not found');
  }

  const platformSettings = await getPlatformSettings();

  // Priority: Video > Class > Academy > Platform
  const maxPlays =
    video.maxPlays ??
    video.class.defaultMaxPlays ??
    video.class.academy.defaultMaxPlays ??
    platformSettings.defaultMaxPlays;

  const maxSeekBackMinutes =
    video.maxSeekBackMinutes ??
    video.class.defaultMaxSeekBackMinutes ??
    video.class.academy.defaultMaxSeekBackMinutes ??
    platformSettings.defaultMaxSeekBackMinutes;

  return {
    maxPlays,
    maxSeekBackMinutes,
  };
}
