'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedVideoPlayer from '@/components/ProtectedVideoPlayer';

interface Video {
  id: string;
  title: string;
  description: string | null;
  durationSeconds: number | null;
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
    storagePath: string;
    mimeType?: string;
  };
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  releaseDate: string;
  maxWatchTimeMultiplier: number;
  watermarkIntervalMins: number;
  videos: Video[];
  documents: Document[];
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = params.id as string;
  const lessonParam = searchParams.get('lesson');
  const watchVideoId = searchParams.get('watch');

  const [classData, setClassData] = useState<ClassData | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [classId]);

  // Handle URL parameters for lesson and video selection
  useEffect(() => {
    if (lessons.length === 0) return;

    if (lessonParam) {
      const lesson = lessons.find(l => l.id === lessonParam);
      if (lesson) {
        setSelectedLesson(lesson);
        // If watching a specific video
        if (watchVideoId) {
          const video = lesson.videos.find(v => v.id === watchVideoId);
          if (video) {
            setSelectedVideo(video);
          }
        } else if (lesson.videos.length > 0) {
          // Auto-select first video
          setSelectedVideo(lesson.videos[0]);
        }
      }
    } else {
      setSelectedLesson(null);
      setSelectedVideo(null);
    }
  }, [lessonParam, watchVideoId, lessons]);

  const loadData = async () => {
    try {
      const [userRes, lessonsRes, classRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch(`/api/lessons?classId=${classId}`),
        fetch(`/api/classes/${classId}`),
      ]);

      const [userResult, lessonsResult, classResult] = await Promise.all([
        userRes.json(),
        lessonsRes.json(),
        classRes.json(),
      ]);

      if (userResult.success) {
        setUser(userResult.data);
      }

      if (lessonsResult.success) {
        // Fetch detailed lesson data with videos and documents
        const detailedLessons = await Promise.all(
          lessonsResult.data.map(async (lesson: any) => {
            const res = await fetch(`/api/lessons/${lesson.id}`);
            const result = await res.json();
            return result.success ? result.data : lesson;
          })
        );
        setLessons(detailedLessons);
      }

      if (classResult.success) {
        setClassData(classResult.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectLesson = (lesson: Lesson) => {
    const isReleased = new Date(lesson.releaseDate) <= new Date();
    if (!isReleased) return;
    
    router.push(`/dashboard/student/class/${classId}?lesson=${lesson.id}`);
  };

  const goBackToLessons = async () => {
    router.push(`/dashboard/student/class/${classId}`);
    setSelectedLesson(null);
    setSelectedVideo(null);
    await loadData();
  };

  const selectVideoInLesson = (video: Video) => {
    if (!selectedLesson) return;
    router.push(`/dashboard/student/class/${classId}?lesson=${selectedLesson.id}&watch=${video.id}`);
  };

  const isPdfDocument = (doc: Document) => {
    return doc.upload.mimeType?.includes('pdf') || doc.upload.fileName.toLowerCase().endsWith('.pdf');
  };

  if (loading) {
    return (
      <DashboardLayout role="STUDENT">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600">Loading class...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="STUDENT">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Header - Always visible */}
        <div>
          <Link href="/dashboard/student" className="text-sm text-gray-500 hover:text-gray-900 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          {classData && (
            <div className="mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{classData.name}</h1>
              {classData.description && (
                <p className="text-gray-600 mt-1">{classData.description}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">{classData.academy.name}</p>
            </div>
          )}
          <div className="flex gap-4 text-sm text-gray-600">
            <span>{lessons.length} lesson{lessons.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Lesson Content View - When a lesson is selected */}
        {selectedLesson && user && (
          <div className="space-y-6">
            {/* Lesson Header */}
            <button
              onClick={goBackToLessons}
              className="text-sm text-gray-500 hover:text-gray-900 inline-block"
            >
              ← Back to lessons
            </button>

            {/* Video Selection - if multiple videos */}
            {selectedLesson.videos.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {selectedLesson.videos.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => selectVideoInLesson(video)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      selectedVideo?.id === video.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {video.title}
                  </button>
                ))}
              </div>
            )}

            {/* Video Player */}
            {selectedVideo && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <ProtectedVideoPlayer
                  videoUrl={`/api/video/stream/${selectedVideo.id}`}
                  videoId={selectedVideo.id}
                  studentId={user.id}
                  studentName={`${user.firstName} ${user.lastName}`}
                  studentEmail={user.email}
                  maxWatchTimeMultiplier={selectedLesson.maxWatchTimeMultiplier}
                  durationSeconds={selectedVideo.durationSeconds || 0}
                  initialPlayState={selectedVideo.playStates?.[0] || { totalWatchTimeSeconds: 0, sessionStartTime: null }}
                  userRole={user.role}
                  watermarkIntervalMins={selectedLesson.watermarkIntervalMins}
                />
              </div>
            )}

            {/* No videos message */}
            {selectedLesson.videos.length === 0 && (
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
                <p className="text-gray-600">No videos in this lesson yet.</p>
              </div>
            )}

            {/* Documents Section - Below Video */}
            {selectedLesson.documents.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-medium text-gray-900 mb-4">
                  Documents ({selectedLesson.documents.length})
                </h3>
                
                <div className="space-y-3">
                  {selectedLesson.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={`/api/storage/serve/${encodeURIComponent(doc.upload.storagePath)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 group-hover:text-blue-600">{doc.title}</p>
                          {doc.description && (
                            <p className="text-xs text-gray-500">{doc.description}</p>
                          )}
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Lessons Grid - When no lesson is selected */}
        {!selectedLesson && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Lessons</h2>
            
            {lessons.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <p className="text-gray-600">No lessons available in this class yet.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {lessons.map((lesson) => {
                  const isReleased = new Date(lesson.releaseDate) <= new Date();
                  const videoCount = lesson.videos?.length || 0;
                  const docCount = lesson.documents?.length || 0;
                  
                  return (
                    <div
                      key={lesson.id}
                      onClick={() => selectLesson(lesson)}
                      className={`bg-white rounded-xl border border-gray-200 p-5 transition-all ${
                        isReleased
                          ? 'cursor-pointer hover:border-blue-300 hover:shadow-md'
                          : 'opacity-60 cursor-not-allowed'
                      }`}
                    >
                      {/* Lesson Card Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        {!isReleased && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                            Scheduled
                          </span>
                        )}
                      </div>
                      
                      {/* Title & Description */}
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{lesson.title}</h3>
                      {lesson.description && (
                        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{lesson.description}</p>
                      )}
                      
                      {/* Video Progress Bars */}
                      {lesson.videos && lesson.videos.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {lesson.videos.map((video: any) => {
                            const playState = video.playStates?.[0];
                            const watchedSeconds = playState?.totalWatchTimeSeconds || 0;
                            const videoDuration = video.durationSeconds || 0;
                            const maxWatchSeconds = videoDuration * lesson.maxWatchTimeMultiplier;
                            const remainingSeconds = Math.max(0, maxWatchSeconds - watchedSeconds);
                            const progressPercent = videoDuration > 0 ? Math.min(100, (watchedSeconds / videoDuration) * 100) : 0;
                            const remainingMinutes = Math.ceil(remainingSeconds / 60);
                            
                            return (
                              <div key={video.id}>
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-gray-600 truncate flex-1">{video.title}</span>
                                  <span className="text-gray-500 ml-2">{remainingMinutes}min left</span>
                                </div>
                                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-blue-600 rounded-full transition-all"
                                    style={{ width: `${progressPercent}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* Content Count */}
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                        {videoCount > 0 && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {videoCount} video{videoCount !== 1 ? 's' : ''}
                          </span>
                        )}
                        {docCount > 0 && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {docCount} doc{docCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      
                      {/* Release Date */}
                      <p className="text-xs text-gray-400">
                        {isReleased ? 'Released' : 'Available'}: {new Date(lesson.releaseDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
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
