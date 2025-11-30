'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedVideoPlayer from '@/components/ProtectedVideoPlayer';

interface Video {
  id: string;
  title: string;
  description: string | null;
  durationSeconds: number | null;
  maxWatchTimeMultiplier: number;
  playStates: Array<{
    totalWatchTimeSeconds: number;
    sessionStartTime: string | null;
  }>;
}

interface Document {
  id: string;
  title: string;
  description: string | null;
  upload: {
    fileName: string;
  };
}

interface ClassData {
  id: string;
  name: string;
  description: string | null;
  academy: {
    name: string;
  };
}

export default function ClassPage() {
  const params = useParams();
  const classId = params.id as string;

  const [classData, setClassData] = useState<ClassData | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [classId]);

  const loadData = async () => {
    try {
      const [userRes, videosRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch(`/api/videos?classId=${classId}`),
      ]);

      const [userResult, videosResult] = await Promise.all([
        userRes.json(),
        videosRes.json(),
      ]);

      if (userResult.success) {
        setUser(userResult.data);
      }

      if (videosResult.success) {
        setVideos(videosResult.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="STUDENT">
        <div className="text-center py-12">
          <div className="text-xl text-primary-600">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="STUDENT">
      <div className="space-y-8">
        {/* Class Header */}
        <div className="bg-white rounded-lg border border-primary-100 shadow-sm p-6">
          <h2 className="text-2xl font-bold text-primary-900 mb-2">
            Class Videos
          </h2>
          <p className="text-primary-700">
            Select a video below to start watching
          </p>
        </div>

        {/* Video Player */}
        {selectedVideo && user && (
          <div>
            <ProtectedVideoPlayer
              videoUrl={`/api/video/stream/${selectedVideo.id}`}
              videoId={selectedVideo.id}
              studentId={user.id}
              maxWatchTimeMultiplier={selectedVideo.maxWatchTimeMultiplier}
              durationSeconds={selectedVideo.durationSeconds || 0}
              initialPlayState={selectedVideo.playStates[0] || { totalWatchTimeSeconds: 0, sessionStartTime: null }}
            />
            <button
              onClick={() => setSelectedVideo(null)}
              className="mt-4 px-4 py-2 bg-primary-100 text-primary-700 border border-primary-200 rounded-lg hover:bg-primary-200 transition-all"
            >
              ← Back to video list
            </button>
          </div>
        )}

        {/* Video List */}
        {!selectedVideo && (
          <div>
            <h3 className="text-xl font-bold text-primary-900 mb-4">Videos</h3>
            {videos.length === 0 ? (
              <div className="bg-white rounded-lg border border-primary-100 shadow-sm p-8 text-center">
                <p className="text-primary-700">
                  No videos available in this class yet.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => {
                  const playState = video.playStates[0];
                  const maxWatchTime = (video.durationSeconds || 0) * video.maxWatchTimeMultiplier;
                  const watchProgress = playState && maxWatchTime > 0
                    ? (playState.totalWatchTimeSeconds / maxWatchTime) * 100
                    : 0;

                  return (
                    <div
                      key={video.id}
                      className="bg-white rounded-lg border border-primary-100 hover:border-primary-300 hover:shadow-sm transition-all p-6 cursor-pointer"
                      onClick={() => setSelectedVideo(video)}
                    >
                      <div className="aspect-video bg-primary-50 rounded-lg mb-4 flex items-center justify-center border border-primary-100">
                        <span className="text-4xl">▶️</span>
                      </div>
                      <h4 className="text-lg font-semibold text-primary-900 mb-2">
                        {video.title}
                      </h4>
                      {video.description && (
                        <p className="text-sm text-primary-700 mb-4 line-clamp-2">
                          {video.description}
                        </p>
                      )}

                      {/* Watch Time Progress Bar */}
                      {playState && playState.totalWatchTimeSeconds > 0 && (
                        <div className="mb-2">
                          <div className="w-full bg-primary-100 rounded-full h-2">
                            <div
                              className="bg-primary-500 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(watchProgress, 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-primary-600 mt-1">
                            {Math.round(watchProgress)}% of watch time used
                          </p>
                        </div>
                      )}

                      {playState && (
                        <div className="text-sm text-primary-600">
                          <p>Watch time: {Math.floor(playState.totalWatchTimeSeconds / 60)}min / {Math.floor(maxWatchTime / 60)}min</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
