'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { BarChart } from '@/components/Charts';

interface StudentProgress {
  id: string;
  name: string;
  email: string;
  className: string;
  totalWatchTime: number;
  videosWatched: number;
  totalVideos: number;
  lastActive: string | null;
}

export default function TeacherProgress() {
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      // This would need an API endpoint for student progress
      // For now, we'll show mock data structure
      const classesRes = await fetch('/api/classes');
      const classesResult = await classesRes.json();
      
      if (classesResult.success && classesResult.data) {
        const progressData: StudentProgress[] = [];
        
        for (const cls of classesResult.data) {
          const classRes = await fetch(`/api/classes/${cls.id}`);
          const classData = await classRes.json();
          
          if (classData.success && classData.data.students) {
            classData.data.students.forEach((student: any) => {
              progressData.push({
                id: student.id,
                name: student.name,
                email: student.email,
                className: cls.name,
                totalWatchTime: Math.floor(Math.random() * 600), // Mock data
                videosWatched: Math.floor(Math.random() * 10),
                totalVideos: classData.data.lessonCount || 5,
                lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
              });
            });
          }
        }
        
        setStudents(progressData);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getProgressColor = (watched: number, total: number) => {
    const pct = total > 0 ? (watched / total) * 100 : 0;
    if (pct >= 80) return 'bg-green-500';
    if (pct >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <DashboardLayout role="TEACHER">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  // Prepare chart data
  const chartData = students.slice(0, 10).map(s => ({
    label: s.name.split(' ')[0],
    value: s.totalWatchTime,
  }));

  return (
    <DashboardLayout role="TEACHER">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Progreso de Estudiantes</h1>
          <p className="text-gray-500 mt-1">Tiempo de visualización y actividad por estudiante</p>
        </div>

        {students.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tiempo de Visualización (minutos)</h2>
            <div className="h-64">
              <BarChart 
                data={chartData}
                showValues={true}
              />
            </div>
          </div>
        )}

        {students.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin datos de progreso</h3>
            <p className="text-gray-500">Añade estudiantes a tus clases para ver su progreso</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estudiante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clase
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tiempo Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Videos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Última Actividad
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                          <span className="text-brand-600 font-medium">
                            {student.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{student.className}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {formatTime(student.totalWatchTime)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full max-w-[100px]">
                          <div
                            className={`h-2 rounded-full ${getProgressColor(student.videosWatched, student.totalVideos)}`}
                            style={{ width: `${(student.videosWatched / student.totalVideos) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">
                          {student.videosWatched}/{student.totalVideos}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {student.lastActive 
                          ? new Date(student.lastActive).toLocaleDateString('es')
                          : 'Nunca'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
