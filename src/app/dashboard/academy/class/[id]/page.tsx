'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useParams, useRouter } from 'next/navigation';
import { PageLoader } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';

interface ClassData {
  id: string;
  name: string;
  description: string | null;
  academyId: string;
  academy: { id: string; name: string };
  teacherId: string;
  teacherName?: string;
  enrollments: Array<{
    id: string;
    student: { id: string; firstName: string; lastName: string; email: string };
    enrolledAt: string;
    status: string;
  }>;
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  releaseDate: string;
  videoCount: number;
  documentCount: number;
  studentsWatching?: number;
  avgProgress?: number;
}

/**
 * Academy Class Page
 * Shows class details with lessons and students for academy owners.
 * Academy owners can view and manage all classes in their academy.
 */
export default function AcademyClassPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params?.id as string;
  
  const { user: currentUser } = useAuth();
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'lessons' | 'students'>('lessons');

  useEffect(() => {
    if (!classId) return;
    loadData();
  }, [classId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load class data
      const classResponse = await apiClient(`/classes/${classId}`);
      const classResult = await classResponse.json();
      
      if (!classResult.success) {
        router.push('/dashboard/academy/classes');
        return;
      }

      // Verify academy ownership
      const academyResponse = await apiClient('/academies');
      const academyResult = await academyResponse.json();
      
      if (academyResult.success && academyResult.data?.[0]) {
        const userAcademy = academyResult.data[0];
        if (userAcademy.id !== classResult.data.academyId) {
          router.push('/dashboard/academy/classes');
          return;
        }
      }

      setClassData(classResult.data);

      // Load lessons
      const lessonsResponse = await apiClient(`/lessons?classId=${classId}`);
      const lessonsResult = await lessonsResponse.json();
      
      if (lessonsResult.success) {
        setLessons(lessonsResult.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      router.push('/dashboard/academy/classes');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !classData) {
    return <PageLoader />;
  }

  const approvedStudents = classData.enrollments.filter(e => e.status === 'APPROVED');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.push('/dashboard/academy/classes')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver a clases
          </button>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{classData.name}</h1>
          {classData.description && (
            <p className="text-gray-600 mt-2">{classData.description}</p>
          )}
          <div className="flex items-center gap-4 mt-4 text-sm">
            <span className="text-gray-500">{classData.academy?.name || 'Academia'}</span>
            {classData.teacherName && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-gray-500">Profesor: {classData.teacherName}</span>
              </>
            )}
            <span className="text-gray-300">•</span>
            <span className="text-gray-500">{approvedStudents.length} estudiantes</span>
            <span className="text-gray-300">•</span>
            <span className="text-gray-500">{lessons.length} lecciones</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('lessons')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'lessons'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Lecciones ({lessons.length})
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'students'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Estudiantes ({approvedStudents.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'lessons' ? (
        lessons.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No hay lecciones</h3>
            <p className="text-gray-500">El profesor aún no ha creado lecciones para esta clase</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
              {lessons.map((lesson) => (
                <div key={lesson.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{lesson.title}</h3>
                      {lesson.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{lesson.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          {lesson.videoCount} video{lesson.videoCount !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {lesson.documentCount} documento{lesson.documentCount !== 1 ? 's' : ''}
                        </span>
                        {lesson.studentsWatching != null && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            {lesson.studentsWatching} viendo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        approvedStudents.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No hay estudiantes</h3>
            <p className="text-gray-500">Aún no hay estudiantes inscritos en esta clase</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Estudiante
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Fecha de Inscripción
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {approvedStudents.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <span className="font-medium text-gray-900">
                        {enrollment.student.firstName} {enrollment.student.lastName}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-600">{enrollment.student.email}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-600">
                        {new Date(enrollment.enrolledAt).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
