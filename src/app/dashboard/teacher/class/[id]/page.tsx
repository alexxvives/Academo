'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import ProtectedVideoPlayer from '@/components/ProtectedVideoPlayer';

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  releaseDate: string;
  maxWatchTimeMultiplier: number;
  watermarkIntervalMins: number;
  videoCount: number;
  documentCount: number;
}

interface LessonDetail {
  id: string;
  title: string;
  description: string | null;
  releaseDate: string;
  maxWatchTimeMultiplier: number;
  watermarkIntervalMins: number;
  videos: Array<{ id: string; title: string; description: string | null; durationSeconds: number | null }>;
  documents: Array<{ id: string; title: string; description: string | null; upload: { storagePath: string; fileName: string; mimeType?: string } }>;
}

interface ClassData {
  id: string;
  name: string;
  description: string | null;
  academy: { id: string; name: string };
  enrollments: Array<{
    id: string;
    student: { id: string; firstName: string; lastName: string; email: string };
    enrolledAt: string;
  }>;
}

export default function TeacherClassPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = params?.id as string;
  const lessonParam = searchParams.get('lesson');
  const watchVideoId = searchParams.get('watch');

  const [classData, setClassData] = useState<ClassData | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<LessonDetail | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lessonFormData, setLessonFormData] = useState({
    title: '',
    description: '',
    releaseDate: new Date().toISOString().split('T')[0],
    maxWatchTimeMultiplier: 2.0,
    watermarkIntervalMins: 5,
    videos: [] as { file: File; title: string; duration: number }[],
    documents: [] as { file: File; title: string }[],
  });

  // Analytics
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  useEffect(() => {
    if (classId) {
      loadData();
      loadUser();
    }
  }, [classId]);

  // Handle URL params for lesson/video selection
  useEffect(() => {
    if (lessons.length === 0) return;

    if (lessonParam) {
      loadLessonDetail(lessonParam).then(lesson => {
        if (lesson && watchVideoId) {
          const video = lesson.videos.find((v: any) => v.id === watchVideoId);
          if (video) setSelectedVideo(video);
        } else if (lesson && lesson.videos.length > 0) {
          setSelectedVideo(lesson.videos[0]);
        }
      });
    } else {
      setSelectedLesson(null);
      setSelectedVideo(null);
    }
  }, [lessonParam, watchVideoId, lessons]);

  const loadUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const result = await res.json();
      if (result.success) setCurrentUser(result.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadData = async () => {
    try {
      const [classRes, lessonsRes] = await Promise.all([
        fetch(`/api/classes/${classId}`),
        fetch(`/api/lessons?classId=${classId}`)
      ]);
      const [classResult, lessonsResult] = await Promise.all([classRes.json(), lessonsRes.json()]);
      if (classResult.success) setClassData(classResult.data);
      if (lessonsResult.success) setLessons(lessonsResult.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadLessonDetail = async (lessonId: string): Promise<LessonDetail | null> => {
    try {
      const res = await fetch(`/api/lessons/${lessonId}`);
      const result = await res.json();
      if (result.success) {
        setSelectedLesson(result.data);
        return result.data;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const selectLesson = (lesson: Lesson) => {
    router.push(`/dashboard/teacher/class/${classId}?lesson=${lesson.id}`);
  };

  const goBackToLessons = () => {
    router.push(`/dashboard/teacher/class/${classId}`);
    setSelectedLesson(null);
    setSelectedVideo(null);
    loadData();
  };

  const selectVideoInLesson = (video: any) => {
    if (!selectedLesson) return;
    router.push(`/dashboard/teacher/class/${classId}?lesson=${selectedLesson.id}&watch=${video.id}`);
  };

  const isPdfDocument = (doc: any) => {
    return doc.upload?.mimeType?.includes('pdf') || doc.upload?.fileName?.toLowerCase().endsWith('.pdf');
  };

  const handleLessonCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lessonFormData.videos.length === 0 && lessonFormData.documents.length === 0) {
      return alert('Please add at least one video or document');
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('classId', classId);
      formData.append('title', lessonFormData.title || new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }));
      formData.append('description', lessonFormData.description);
      formData.append('releaseDate', new Date(lessonFormData.releaseDate).toISOString());
      formData.append('maxWatchTimeMultiplier', lessonFormData.maxWatchTimeMultiplier.toString());
      formData.append('watermarkIntervalMins', lessonFormData.watermarkIntervalMins.toString());
      lessonFormData.videos.forEach((v, i) => {
        formData.append(`video_${i}`, v.file);
        formData.append(`video_title_${i}`, v.title);
        formData.append(`video_duration_${i}`, v.duration.toString());
      });
      lessonFormData.documents.forEach((d, i) => {
        formData.append(`document_${i}`, d.file);
        formData.append(`document_title_${i}`, d.title);
      });
      const res = await fetch('/api/lessons', { method: 'POST', body: formData });
      const result = await res.json();
      if (result.success) {
        setLessonFormData({
          title: '', description: '', releaseDate: new Date().toISOString().split('T')[0],
          maxWatchTimeMultiplier: 2.0, watermarkIntervalMins: 5, videos: [], documents: []
        });
        setShowLessonForm(false);
        loadData();
      } else {
        alert(result.error || 'Failed to create lesson');
      }
    } catch (e) {
      console.error(e);
      alert('Error. Check file sizes are under 100MB.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Delete this lesson? All videos and documents will be deleted.')) return;
    try {
      const res = await fetch(`/api/lessons/${lessonId}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) loadData();
      else alert(result.error || 'Failed to delete');
    } catch (e) {
      alert('Error occurred');
    }
  };

  const addVideoToForm = (file: File) => {
    if (file.size > 100 * 1024 * 1024) {
      alert('File size must be under 100MB');
      return;
    }
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      setLessonFormData(p => ({
        ...p,
        videos: [...p.videos, { file, title: file.name.replace(/\.[^/.]+$/, ''), duration: Math.floor(video.duration) }]
      }));
    };
    video.src = URL.createObjectURL(file);
  };

  const addDocumentToForm = (file: File) => {
    setLessonFormData(p => ({
      ...p,
      documents: [...p.documents, { file, title: file.name.replace(/\.[^/.]+$/, '') }]
    }));
  };

  const loadAnalytics = async () => {
    try {
      const res = await fetch(`/api/analytics?classId=${classId}`);
      const result = await res.json();
      if (result.success) setAnalyticsData(result.data);
    } catch (e) {
      console.error(e);
    }
  };

  const formatDuration = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  const isReleased = (d: string) => new Date(d) <= new Date();

  if (loading) {
    return (
      <DashboardLayout role="TEACHER">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!classData) {
    return (
      <DashboardLayout role="TEACHER">
        <div className="max-w-6xl mx-auto text-center py-12">
          <p className="text-gray-500">Class not found</p>
          <Link href="/dashboard/teacher" className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block">
            ← Back to Dashboard
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="TEACHER">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div>
          <Link href="/dashboard/teacher" className="text-sm text-gray-500 hover:text-gray-900 mb-4 inline-block">
            ← {classData.academy.name}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{classData.name}</h1>
          {classData.description && <p className="text-gray-600 mt-1">{classData.description}</p>}
          <div className="flex gap-6 mt-2 text-sm text-gray-500">
            <span>{classData.enrollments.length} students</span>
            <span>{lessons.length} lessons</span>
          </div>
        </div>

        {/* Selected Lesson View */}
        {selectedLesson && currentUser && (
          <div className="space-y-6">
            <div>
              <button onClick={goBackToLessons} className="text-sm text-gray-500 hover:text-gray-900 mb-2">
                ← Back to lessons
              </button>
              <h2 className="text-xl font-semibold text-gray-900">{selectedLesson.title}</h2>
              {selectedLesson.description && <p className="text-gray-600 mt-1">{selectedLesson.description}</p>}
              <div className="flex gap-4 mt-2 text-sm text-gray-500">
                <span>Release: {formatDate(selectedLesson.releaseDate)}</span>
                <span>Multiplier: {selectedLesson.maxWatchTimeMultiplier}x</span>
                <span>Watermark: every {selectedLesson.watermarkIntervalMins} min</span>
              </div>
            </div>

            {/* Video Tabs */}
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
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-medium text-gray-900">{selectedVideo.title}</h3>
                  {selectedVideo.description && <p className="text-sm text-gray-600 mt-1">{selectedVideo.description}</p>}
                </div>
                <ProtectedVideoPlayer
                  videoUrl={`/api/video/stream/${selectedVideo.id}`}
                  videoId={selectedVideo.id}
                  studentId={currentUser.id}
                  maxWatchTimeMultiplier={selectedLesson.maxWatchTimeMultiplier}
                  durationSeconds={selectedVideo.durationSeconds || 0}
                  initialPlayState={{ totalWatchTimeSeconds: 0, sessionStartTime: null }}
                  userRole="TEACHER"
                />
              </div>
            )}

            {/* No videos */}
            {selectedLesson.videos.length === 0 && (
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
                <p className="text-gray-600">No videos in this lesson.</p>
              </div>
            )}

            {/* Documents */}
            {selectedLesson.documents.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-medium text-gray-900 mb-4">Documents ({selectedLesson.documents.length})</h3>
                <div className="space-y-4">
                  {selectedLesson.documents.map((doc) => (
                    <div key={doc.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between p-3 bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{doc.title}</p>
                            {doc.description && <p className="text-xs text-gray-500">{doc.description}</p>}
                          </div>
                        </div>
                        <a
                          href={`/api/storage/serve/${encodeURIComponent(doc.upload.storagePath)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg"
                        >
                          Open
                        </a>
                      </div>
                      {isPdfDocument(doc) && (
                        <div className="border-t border-gray-200">
                          <iframe
                            src={`/api/storage/serve/${encodeURIComponent(doc.upload.storagePath)}#toolbar=0`}
                            className="w-full h-[500px]"
                            title={doc.title}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main View - No Lesson Selected */}
        {!selectedLesson && (
          <>
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowLessonForm(!showLessonForm)}
                className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  showLessonForm ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                + Create Lesson
              </button>
              <button
                onClick={() => { setShowAnalytics(!showAnalytics); if (!showAnalytics) loadAnalytics(); }}
                className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  showAnalytics ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                📊 Analytics
              </button>
            </div>

            {/* Lesson Form */}
            {showLessonForm && (
              <form onSubmit={handleLessonCreate} className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
                <h3 className="font-semibold text-gray-900">Create New Lesson</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                    <input type="text" value={lessonFormData.title} onChange={e => setLessonFormData({ ...lessonFormData, title: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Lesson title"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Release Date</label>
                    <input type="date" value={lessonFormData.releaseDate} onChange={e => setLessonFormData({ ...lessonFormData, releaseDate: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"/>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <textarea value={lessonFormData.description} onChange={e => setLessonFormData({ ...lessonFormData, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"/>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Watch Time Multiplier</label>
                    <input type="number" min="1" max="10" step="0.5" value={lessonFormData.maxWatchTimeMultiplier} onChange={e => setLessonFormData({ ...lessonFormData, maxWatchTimeMultiplier: parseFloat(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"/>
                    <p className="text-xs text-gray-500 mt-1">Students watch for this × video duration</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Watermark Interval (min)</label>
                    <input type="number" min="1" max="60" value={lessonFormData.watermarkIntervalMins} onChange={e => setLessonFormData({ ...lessonFormData, watermarkIntervalMins: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"/>
                    <p className="text-xs text-gray-500 mt-1">How often watermark appears</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Videos</label>
                  <input type="file" accept="video/mp4" multiple onChange={e => { if (e.target.files) Array.from(e.target.files).forEach(addVideoToForm); e.target.value = ''; }} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"/>
                  {lessonFormData.videos.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {lessonFormData.videos.map((v, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                          <input type="text" value={v.title} onChange={e => { const nv = [...lessonFormData.videos]; nv[i].title = e.target.value; setLessonFormData({ ...lessonFormData, videos: nv }); }} className="flex-1 px-2 py-1 border border-blue-200 rounded text-sm"/>
                          <span className="text-xs text-gray-500">{formatDuration(v.duration)}</span>
                          <button type="button" onClick={() => setLessonFormData({ ...lessonFormData, videos: lessonFormData.videos.filter((_, j) => j !== i) })} className="text-red-500 hover:text-red-700">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Documents (PDF)</label>
                  <input type="file" accept=".pdf" multiple onChange={e => { if (e.target.files) Array.from(e.target.files).forEach(addDocumentToForm); e.target.value = ''; }} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"/>
                  {lessonFormData.documents.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {lessonFormData.documents.map((d, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                          <input type="text" value={d.title} onChange={e => { const nd = [...lessonFormData.documents]; nd[i].title = e.target.value; setLessonFormData({ ...lessonFormData, documents: nd }); }} className="flex-1 px-2 py-1 border border-red-200 rounded text-sm"/>
                          <button type="button" onClick={() => setLessonFormData({ ...lessonFormData, documents: lessonFormData.documents.filter((_, j) => j !== i) })} className="text-red-500 hover:text-red-700">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={uploading} className="px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm disabled:opacity-50">
                    {uploading ? 'Creating...' : 'Create Lesson'}
                  </button>
                  <button type="button" onClick={() => setShowLessonForm(false)} className="px-4 py-2.5 text-gray-600 hover:text-gray-900 font-medium text-sm">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Analytics */}
            {showAnalytics && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">📊 Class Analytics</h3>
                {analyticsData ? (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-900">{analyticsData.videos?.length || 0}</div>
                      <div className="text-sm text-blue-600">Videos</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-900">{analyticsData.studentEngagement?.length || 0}</div>
                      <div className="text-sm text-green-600">Active Students</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatDuration(analyticsData.studentEngagement?.reduce((s: number, x: any) => s + (x.totalWatchTime || 0), 0) || 0)}
                      </div>
                      <div className="text-sm text-gray-600">Total Watch Time</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">Loading analytics...</div>
                )}
              </div>
            )}

            {/* Lessons Grid */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Lessons</h2>
              {lessons.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">No lessons yet</h3>
                  <p className="text-gray-500 text-sm">Create your first lesson to get started</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="bg-white rounded-xl border border-gray-200 p-5 transition-all hover:border-blue-300 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer"
                          onClick={() => selectLesson(lesson)}
                        >
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                          </svg>
                        </div>
                        <div className="flex items-center gap-2">
                          {!isReleased(lesson.releaseDate) && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">Scheduled</span>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteLesson(lesson.id); }}
                            className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div onClick={() => selectLesson(lesson)} className="cursor-pointer">
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{lesson.title}</h3>
                        {lesson.description && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{lesson.description}</p>}

                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                          {lesson.videoCount > 0 && (
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                              </svg>
                              {lesson.videoCount} video{lesson.videoCount !== 1 ? 's' : ''}
                            </span>
                          )}
                          {lesson.documentCount > 0 && (
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                              </svg>
                              {lesson.documentCount} doc{lesson.documentCount !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-gray-400">
                          {isReleased(lesson.releaseDate) ? 'Released' : 'Scheduled'}: {formatDate(lesson.releaseDate)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Students */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Students ({classData.enrollments.length})</h2>
              {classData.enrollments.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                  <p className="text-gray-500 text-sm">No students enrolled yet</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {classData.enrollments.map(e => (
                    <div key={e.id} className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                          {e.student.firstName[0]}{e.student.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{e.student.firstName} {e.student.lastName}</p>
                          <p className="text-sm text-gray-500">{e.student.email}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
