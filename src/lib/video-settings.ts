import { prisma } from './prisma';

export async function getPlatformSettings() {
  let settings = await prisma.platformSettings.findUnique({
    where: { id: 'platform_settings' },
  });

  if (!settings) {
    settings = await prisma.platformSettings.create({
      data: {
        id: 'platform_settings',
        defaultMaxWatchTimeMultiplier: 2.0,
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
  const maxWatchTimeMultiplier =
    video.maxWatchTimeMultiplier ??
    video.class.defaultMaxWatchTimeMultiplier ??
    video.class.academy.defaultMaxWatchTimeMultiplier ??
    platformSettings.defaultMaxWatchTimeMultiplier;

  return {
    maxWatchTimeMultiplier,
  };
}
