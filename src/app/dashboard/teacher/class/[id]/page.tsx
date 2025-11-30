'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

interface Class {
  id: string;
  name: string;
  description: string | null;
  academy: {
    id: string;
    name: string;
  };
  videos: Array<{
    id: string;
    title: string;
    description: string | null;
    durationSeconds: number | null;
    maxWatchTimeMultiplier: number;
    createdAt: string;
  }>;
  documents: Array<{
    id: string;
    title: string;
    description: string | null;
    createdAt: string;
  }>;
  enrollments: Array<{
    id: string;
    student: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    enrolledAt: string;
  }>;
}

export default function TeacherClassPage() {
  const params = useParams();
  const classId = params?.id as string;
  const [classData, setClassData] = useState<Class | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [videoFormData, setVideoFormData] = useState({
    title: '',
    description: '',
    maxWatchTimeMultiplier: 2.0,
    file: null as File | null,
  });

  const [documentFormData, setDocumentFormData] = useState({
    title: '',
    description: '',
    file: null as File | null,
  });

  useEffect(() => {
    if (classId) {
      loadClass();
    }
  }, [classId]);

  const loadClass = async () => {
    try {
      const response = await fetch(`/api/classes/${classId}`);
      const result = await response.json();

      if (result.success) {
        setClassData(result.data);
      }
    } catch (error) {
      console.error('Failed to load class:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!videoFormData.file) {
      alert('Please select a video file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', videoFormData.file);
      formData.append('title', videoFormData.title);
      formData.append('description', videoFormData.description);
      formData.append('classId', classId);
      formData.append('maxWatchTimeMultiplier', videoFormData.maxWatchTimeMultiplier.toString());

      const response = await fetch('/api/videos', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        alert('Video uploaded successfully!');
        setVideoFormData({
          title: '',
          description: '',
          maxWatchTimeMultiplier: 2.0,
          file: null,
        });
        setShowVideoForm(false);
        loadClass();
      } else {
        alert(result.error || 'Failed to upload video');
      }
    } catch (error) {
      alert('An error occurred during upload');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDocumentUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!documentFormData.file) {
      alert('Please select a document file');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', documentFormData.file);
      formData.append('title', documentFormData.title);
      formData.append('description', documentFormData.description);
      formData.append('classId', classId);

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        alert('Document uploaded successfully!');
        setDocumentFormData({
          title: '',
          description: '',
          file: null,
        });
        setShowDocumentForm(false);
        loadClass();
      } else {
        alert(result.error || 'Failed to upload document');
      }
    } catch (error) {
      alert('An error occurred during upload');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="TEACHER">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-xl font-semibold text-gray-700">Loading class details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!classData) {
    return (
      <DashboardLayout role="TEACHER">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center bg-white rounded-2xl shadow-xl p-12">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Class Not Found</h2>
            <p className="text-gray-600 mb-6">The class you're looking for doesn't exist.</p>
            <Link
              href="/dashboard/teacher"
              className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold shadow-lg transition-all"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="TEACHER">
      <div className="space-y-8">
        {/* Class Header with Gradient */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl shadow-2xl p-8 text-white">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="inline-block px-4 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold mb-3">
                {classData.academy.name}
              </div>
              <h1 className="text-4xl font-bold mb-3 drop-shadow-lg">
                {classData.name}
              </h1>
              {classData.description && (
                <p className="text-lg text-white/90 mb-4 max-w-3xl">
                  {classData.description}
                </p>
              )}
              <div className="flex gap-8 mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl">
                    👥
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{classData.enrollments.length}</p>
                    <p className="text-sm text-white/80">Students</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl">
                    🎥
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{classData.videos.length}</p>
                    <p className="text-sm text-white/80">Videos</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl">
                    📄
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{classData.documents.length}</p>
                    <p className="text-sm text-white/80">Documents</p>
                  </div>
                </div>
              </div>
            </div>
            <Link
              href={`/dashboard/teacher/academy/${classData.academy.id}`}
              className="px-6 py-3 bg-white text-indigo-600 rounded-xl hover:bg-gray-100 font-semibold shadow-lg transition-all hover:shadow-xl flex items-center gap-2"
            >
              <span>←</span>
              <span>Back to Academy</span>
            </Link>
          </div>
        </div>

        {/* Upload Section with Beautiful Cards */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
            📤 Upload Content
          </h2>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => {
                setShowVideoForm(!showVideoForm);
                setShowDocumentForm(false);
              }}
              className={`p-6 rounded-xl border-2 transition-all ${
                showVideoForm
                  ? 'border-indigo-600 bg-indigo-50 shadow-lg'
                  : 'border-gray-200 hover:border-indigo-400 hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                  🎥
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold text-gray-900">Upload Video</h3>
                  <p className="text-sm text-gray-600">Add MP4 video content</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => {
                setShowDocumentForm(!showDocumentForm);
                setShowVideoForm(false);
              }}
              className={`p-6 rounded-xl border-2 transition-all ${
                showDocumentForm
                  ? 'border-indigo-600 bg-indigo-50 shadow-lg'
                  : 'border-gray-200 hover:border-indigo-400 hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                  📄
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold text-gray-900">Upload Document</h3>
                  <p className="text-sm text-gray-600">Add PDF resources</p>
                </div>
              </div>
            </button>
          </div>

          {/* Video Upload Form */}
          {showVideoForm && (
            <form onSubmit={handleVideoUpload} className="mt-6 p-8 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl shadow-inner">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl">
                  🎥
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Upload Video</h3>
                  <p className="text-sm text-gray-600">MP4 format only</p>
                </div>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Video File <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept="video/mp4"
                    required
                    onChange={(e) =>
                      setVideoFormData({
                        ...videoFormData,
                        file: e.target.files?.[0] || null,
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={videoFormData.title}
                    onChange={(e) =>
                      setVideoFormData({ ...videoFormData, title: e.target.value })
                    }
                    placeholder="Enter video title"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={videoFormData.description}
                    onChange={(e) =>
                      setVideoFormData({
                        ...videoFormData,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    placeholder="Enter video description"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-primary-900 mb-2">
                    Watch Time Limit Multiplier
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.5"
                    value={videoFormData.maxWatchTimeMultiplier}
                    onChange={(e) =>
                      setVideoFormData({
                        ...videoFormData,
                        maxWatchTimeMultiplier: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-4 py-3 border border-primary-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all"
                  />
                  <p className="text-xs text-primary-600 mt-1">
                    Students can watch for this many times the video duration (e.g., 2.0× means a 30min video = 60min total watch time)
                  </p>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <span>✓</span>
                        <span>Upload Video</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowVideoForm(false)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Document Upload Form */}
          {showDocumentForm && (
            <form onSubmit={handleDocumentUpload} className="mt-6 p-8 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl shadow-inner">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-2xl">
                  📄
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Upload Document</h3>
                  <p className="text-sm text-gray-600">PDF format only</p>
                </div>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Document File <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    required
                    onChange={(e) =>
                      setDocumentFormData({
                        ...documentFormData,
                        file: e.target.files?.[0] || null,
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={documentFormData.title}
                    onChange={(e) =>
                      setDocumentFormData({
                        ...documentFormData,
                        title: e.target.value,
                      })
                    }
                    placeholder="Enter document title"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={documentFormData.description}
                    onChange={(e) =>
                      setDocumentFormData({
                        ...documentFormData,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    placeholder="Enter document description"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <span>✓</span>
                        <span>Upload Document</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDocumentForm(false)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Videos List */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl">
              🎥
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Videos</h2>
              <p className="text-sm text-gray-600">{classData.videos.length} videos uploaded</p>
            </div>
          </div>
          {classData.videos.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
              <div className="text-6xl mb-4">🎬</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Videos Yet</h3>
              <p className="text-gray-600 mb-4">Upload your first video to get started</p>
              <button
                onClick={() => setShowVideoForm(true)}
                className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold shadow-lg transition-all"
              >
                Upload Video
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {classData.videos.map((video) => (
                <div
                  key={video.id}
                  className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-100 rounded-xl hover:shadow-lg transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 shadow-lg">
                      🎥
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{video.title}</h3>
                      {video.description && (
                        <p className="text-gray-700 mb-3">{video.description}</p>
                      )}
                      <div className="flex flex-wrap gap-3">
                        <span className="px-3 py-1 bg-white rounded-lg text-sm font-semibold text-primary-600 shadow-sm">
                          ⏱️ Watch Time: {video.maxWatchTimeMultiplier}× video duration
                        </span>
                        <span className="px-3 py-1 bg-white rounded-lg text-sm font-semibold text-primary-600 shadow-sm">
                          📅 {new Date(video.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-2xl">
              📄
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
              <p className="text-sm text-gray-600">{classData.documents.length} documents uploaded</p>
            </div>
          </div>
          {classData.documents.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Documents Yet</h3>
              <p className="text-gray-600 mb-4">Upload your first document to get started</p>
              <button
                onClick={() => setShowDocumentForm(true)}
                className="inline-block px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-semibold shadow-lg transition-all"
              >
                Upload Document
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {classData.documents.map((document) => (
                <div
                  key={document.id}
                  className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-100 rounded-xl hover:shadow-lg transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 shadow-lg">
                      📄
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{document.title}</h3>
                      {document.description && (
                        <p className="text-sm text-gray-700 mb-2">{document.description}</p>
                      )}
                      <span className="inline-block px-3 py-1 bg-white rounded-lg text-xs font-semibold text-gray-600 shadow-sm">
                        📅 {new Date(document.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enrolled Students */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center text-2xl">
              👥
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Enrolled Students</h2>
              <p className="text-sm text-gray-600">{classData.enrollments.length} students enrolled</p>
            </div>
          </div>
          {classData.enrollments.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
              <div className="text-6xl mb-4">🎓</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Students Enrolled Yet</h3>
              <p className="text-gray-600">Students will appear here once they enroll in this class</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classData.enrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-100 rounded-xl hover:shadow-lg transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-lg">
                      {enrollment.student.firstName[0]}{enrollment.student.lastName[0]}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg">
                        {enrollment.student.firstName} {enrollment.student.lastName}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{enrollment.student.email}</p>
                      <span className="inline-block px-2 py-1 bg-white rounded-lg text-xs font-semibold text-gray-600 shadow-sm">
                        📅 {new Date(enrollment.enrolledAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
