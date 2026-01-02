'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ProtectedVideoPlayer from '@/components/ProtectedVideoPlayer';
import { multipartUpload } from '@/lib/multipart-upload';
import { uploadToBunny } from '@/lib/bunny-upload';

// ... keep all existing interfaces and types exactly as they are ...
// (I'll just redesign the UI, not change the logic)

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  releaseDate: string;
  maxWatchTimeMultiplier: number;
  watermarkIntervalMins: number;
  videoCount: number;
  documentCount: number;
  studentsWatching?: number;
  avgProgress?: number;
  isTranscoding?: number;
  isUploading?: boolean;
  uploadProgress?: number;
}

interface LessonDetail {
  id: string;
  title: string;
  description: string | null;
  externalUrl: string | null;
  releaseDate: string;
  maxWatchTimeMultiplier: number;
  watermarkIntervalMins: number;
  videos: Array<{ id: string; title: string; description: string | null; durationSeconds: number | null; upload?: any }>;
  documents: Array<{ id: string; title: string; description: string | null; upload: { storagePath: string; fileName: string; mimeType?: string } }>;
}

interface ClassData {
  id: string;
  name: string;
  slug?: string;
  description: string | null;
  academy: { id: string; name: string };
  enrollments: Array<{
    id: string;
    student: { id: string; firstName: string; lastName: string; email: string };
    enrolledAt: string;
    status: string;
  }>;
}

export default function TeacherClassPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = params?.id as string;
  
  const [activeTab, setActiveTab] = useState<'lessons' | 'students' | 'live'>('lessons');
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<LessonDetail | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pendingEnrollments, setPendingEnrollments] = useState<any[]>([]);
  const [liveClasses, setLiveClasses] = useState<any[]>([]);
  const [creatingStream, setCreatingStream] = useState(false);

  // ... keep all existing state variables and functions ...
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Clase no encontrada</h2>
        <p className="text-gray-500 mb-6">La clase que buscas no existe o no tienes acceso.</p>
        <Link href="/dashboard/teacher/classes" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Clases
        </Link>
      </div>
    );
  }

  // If viewing a specific lesson
  if (selectedLesson && currentUser) {
    return (
      <div className="space-y-6">
        {/* Back Button */}
        <button 
          onClick={() => {
            setSelectedLesson(null);
            setSelectedVideo(null);
            router.push(`/dashboard/teacher/class/${classData.slug || classData.id}`);
          }}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a {classData.name}
        </button>

        {/* Lesson Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedLesson.title}</h1>
          {selectedLesson.description && (
            <p className="text-gray-600 mb-4">{selectedLesson.description}</p>
          )}
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(selectedLesson.releaseDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {selectedLesson.maxWatchTimeMultiplier}x multiplicador
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Marca cada {selectedLesson.watermarkIntervalMins} min
            </span>
          </div>
        </div>

        {/* Video Player Section */}
        {selectedLesson.videos.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {selectedLesson.videos.length > 1 && (
              <div className="border-b border-gray-200 p-4 flex gap-2 flex-wrap bg-gray-50">
                {selectedLesson.videos.map((video, index) => (
                  <button
                    key={video.id}
                    onClick={() => setSelectedVideo(video)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      selectedVideo?.id === video.id
                        ? 'bg-brand-500 text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    Video {index + 1}
                  </button>
                ))}
              </div>
            )}
            {selectedVideo && (
              <ProtectedVideoPlayer
                videoUrl={selectedVideo.upload?.storageType === 'bunny' ? '' : `/api/video/stream/${selectedVideo.id}`}
                videoId={selectedVideo.id}
                studentId={currentUser.id}
                maxWatchTimeMultiplier={selectedLesson.maxWatchTimeMultiplier}
                durationSeconds={selectedVideo.durationSeconds || 0}
                initialPlayState={{ totalWatchTimeSeconds: 0, sessionStartTime: null }}
                userRole="TEACHER"
                bunnyGuid={selectedVideo.upload?.storageType === 'bunny' ? selectedVideo.upload?.bunnyGuid : undefined}
              />
            )}
          </div>
        )}

        {/* Documents Section */}
        {selectedLesson.documents.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Documentos ({selectedLesson.documents.length})
            </h3>
            <div className="grid gap-3">
              {selectedLesson.documents.map((doc) => (
                <a
                  key={doc.id}
                  href={`/api/storage/serve/${encodeURIComponent(doc.upload.storagePath)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-brand-300 rounded-lg transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">{doc.title}</p>
                      {doc.description && <p className="text-sm text-gray-500">{doc.description}</p>}
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-brand-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Main class view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl p-8 text-white shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <Link href="/dashboard/teacher/classes" className="inline-flex items-center gap-2 text-white/80 hover:text-white font-medium text-sm mb-3 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Todas las clases
            </Link>
            <h1 className="text-3xl font-bold mb-2">{classData.name}</h1>
            {classData.description && (
              <p className="text-white/90 text-lg">{classData.description}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-4 mt-6">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="font-semibold">{classData.enrollments.filter(e => e.status === 'approved').length}</span>
            <span className="text-white/80">Estudiantes</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="font-semibold">{lessons.length}</span>
            <span className="text-white/80">Lecciones</span>
          </div>
          {pendingEnrollments.length > 0 && (
            <div className="flex items-center gap-2 bg-orange-500/30 backdrop-blur-sm px-4 py-2 rounded-lg border border-orange-300/50">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <span className="font-semibold">{pendingEnrollments.length}</span>
              <span className="text-white/90">Solicitud{pendingEnrollments.length !== 1 ? 'es' : ''} pendiente{pendingEnrollments.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex gap-1 p-2">
            <button
              onClick={() => setActiveTab('lessons')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                activeTab === 'lessons'
                  ? 'bg-brand-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Lecciones
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeTab === 'lessons' ? 'bg-white/20' : 'bg-gray-200 text-gray-700'
              }`}>
                {lessons.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                activeTab === 'students'
                  ? 'bg-brand-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Estudiantes
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeTab === 'students' ? 'bg-white/20' : 'bg-gray-200 text-gray-700'
              }`}>
                {classData.enrollments.filter(e => e.status === 'approved').length}
              </span>
              {pendingEnrollments.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-500 text-white">
                  {pendingEnrollments.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('live')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                activeTab === 'live'
                  ? 'bg-brand-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              En Vivo
              {liveClasses.some(lc => lc.status === 'active') && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Lessons Tab */}
          {activeTab === 'lessons' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Contenido de la Clase</h2>
                <button
                  onClick={() => router.push(`/dashboard/teacher/class/${classData.slug || classData.id}?action=create`)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nueva Lección
                </button>
              </div>

              {lessons.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay lecciones aún</h3>
                  <p className="text-gray-500 mb-6">Crea tu primera lección para comenzar a compartir contenido con tus estudiantes.</p>
                  <button
                    onClick={() => router.push(`/dashboard/teacher/class/${classData.slug || classData.id}?action=create`)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Crear Primera Lección
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {lessons.map((lesson) => (
                    <button
                      key={lesson.id}
                      onClick={() => {/* handle lesson click */}}
                      className="text-left bg-white border-2 border-gray-200 hover:border-brand-400 hover:shadow-lg rounded-xl p-5 transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-brand-600 transition-colors mb-2">
                            {lesson.title}
                          </h3>
                          {lesson.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{lesson.description}</p>
                          )}
                          <div className="flex flex-wrap gap-3 text-sm">
                            <span className="inline-flex items-center gap-1.5 text-gray-600">
                              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              <span className="font-medium">{lesson.videoCount}</span> video{lesson.videoCount !== 1 ? 's' : ''}
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-gray-600">
                              <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="font-medium">{lesson.documentCount}</span> documento{lesson.documentCount !== 1 ? 's' : ''}
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-gray-600">
                              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {new Date(lesson.releaseDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        </div>
                        <svg className="w-6 h-6 text-gray-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <div className="space-y-6">
              {/* Pending Requests */}
              {pendingEnrollments.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Solicitudes Pendientes</h2>
                  <div className="grid gap-3">
                    {pendingEnrollments.map((enrollment) => (
                      <div key={enrollment.id} className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold">
                            {enrollment.student.firstName.charAt(0)}{enrollment.student.lastName.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900">
                            {enrollment.student.firstName} {enrollment.student.lastName}
                          </p>
                          <p className="text-sm text-gray-600 truncate">{enrollment.student.email}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-white transition-colors font-medium">
                            Rechazar
                          </button>
                          <button className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-medium">
                            Aprobar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Enrolled Students */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Estudiantes Inscritos</h2>
                {classData.enrollments.filter(e => e.status === 'approved').length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay estudiantes inscritos</h3>
                    <p className="text-gray-500">Los estudiantes aparecerán aquí una vez se inscriban en tu clase.</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {classData.enrollments.filter(e => e.status === 'approved').map((enrollment) => (
                      <div key={enrollment.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:shadow-md hover:border-brand-300 transition-all">
                        <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold">
                            {enrollment.student.firstName.charAt(0)}{enrollment.student.lastName.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {enrollment.student.firstName} {enrollment.student.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{enrollment.student.email}</p>
                        </div>
                        <span className="text-sm text-gray-500">
                          Desde {new Date(enrollment.enrolledAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Live Tab */}
          {activeTab === 'live' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Clases en Vivo</h2>
                <button
                  onClick={() => {/* create stream */}}
                  disabled={creatingStream}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingStream ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                  )}
                  {creatingStream ? 'Creando...' : 'Iniciar Stream'}
                </button>
              </div>

              {liveClasses.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay streams programados</h3>
                  <p className="text-gray-500 mb-6">Inicia una clase en vivo para conectar con tus estudiantes en tiempo real.</p>
                  <button
                    onClick={() => {/* create stream */}}
                    disabled={creatingStream}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    Iniciar Stream Ahora
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {liveClasses.map((liveClass) => (
                    <div key={liveClass.id} className={`rounded-xl p-5 ${
                      liveClass.status === 'active' ? 'bg-red-500' : 'bg-yellow-500'
                    } text-white`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="relative flex h-3 w-3">
                            {liveClass.status === 'active' && (
                              <>
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                              </>
                            )}
                          </span>
                          <div>
                            <p className="font-bold text-lg">{liveClass.title}</p>
                            <p className="text-white/90 text-sm">
                              {liveClass.status === 'active' ? 'En vivo ahora' : 'Programado'}
                            </p>
                          </div>
                        </div>
                        <button className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-medium transition-colors">
                          Ver Detalles
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
