import { videoQueries, academyQueries, settingsQueries } from './db';

// Types for database records
interface VideoWithDetails {
  classId: string;
  academyId: string;
  lessonMultiplier?: number | null;
}

interface Academy {
  defaultMaxWatchTimeMultiplier?: number | null;
}

interface PlatformSettings {
  defaultMaxWatchTimeMultiplier: number;
}

export async function getPlatformSettings() {
  return await settingsQueries.get();
}

export async function getEffectiveVideoSettings(videoId: string) {
  // Use findWithDetails to get video with classId and academyId from Lesson join
  const video = await videoQueries.findWithDetails(videoId) as VideoWithDetails | null;

  if (!video) {
    throw new Error('Video not found');
  }

  if (!video.classId || !video.academyId) {
    throw new Error('Video has no associated class');
  }

  const academy = await academyQueries.findById(video.academyId) as Academy | null;
  if (!academy) {
    throw new Error('Academy not found');
  }

  const platformSettings = await getPlatformSettings() as PlatformSettings;

  // Priority: Lesson > Academy > Platform
  const maxWatchTimeMultiplier =
    video.lessonMultiplier ??
    academy.defaultMaxWatchTimeMultiplier ??
    platformSettings.defaultMaxWatchTimeMultiplier;

  return {
    maxWatchTimeMultiplier,
  };
}
