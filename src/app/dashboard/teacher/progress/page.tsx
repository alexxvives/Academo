'use client';

import { useEffect, useState, useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import { StudentsProgressTable, type StudentProgress } from '@/components/shared';

export default function TeacherProgress() {
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [academyName, setAcademyName] = useState<string>('');
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');

  useEffect(() => {
    loadProgress();
    loadAcademyName();
  }, []);

  const loadAcademyName = async () => {
    try {
      const res = await apiClient('/requests/teacher');
      const result = await res.json();
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        setAcademyName(result.data[0].academyName || '');
      }
    } catch (error) {
      console.error('Failed to load academy name:', error);
    }
  };

  const loadProgress = async () => {
    try {
      const response = await apiClient('/students/progress');
      const data = await response.json();
      
      if (data.success && data.data) {
        const progressData: StudentProgress[] = data.data.map((student: any) => ({
          id: student.id,
          name: `${student.firstName} ${student.lastName}`,
          email: student.email,
          className: student.className || `${student.classCount} ${student.classCount === 1 ? 'clase' : 'clases'}`,
          totalWatchTime: Math.floor((student.totalWatchTime || 0) / 60), // Convert seconds to minutes
          videosWatched: student.lessonsCompleted || 0,
          totalVideos: student.totalLessons || 0,
          lastActive: student.lastActivity,
        }));
        
        setStudents(progressData);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  const uniqueClasses = useMemo(() => {
    const classes = new Set(students.map(s => s.className).filter(Boolean));
    return Array.from(classes);
  }, [students]);

  return (
    <div className="space-y-6">
      {/* Header with inline filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Progreso de Estudiantes</h1>
          {academyName && <p className="text-sm text-gray-500 mt-1">{academyName}</p>}
        </div>
        <div className="flex flex-col md:flex-row gap-4 pb-6">
          <div className="flex-1 md:w-64">
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          {uniqueClasses.length > 0 && (
            <div className="relative w-full md:w-64">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none bg-white"
              >
                <option value="all">Todas las clases</option>
                {uniqueClasses.map((className) => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>

      <StudentsProgressTable
        students={students}
        loading={loading}
        searchQuery={searchQuery}
        selectedClass={selectedClass}
        onSearchChange={setSearchQuery}
        onClassFilterChange={setSelectedClass}
        uniqueClasses={uniqueClasses}
        showClassFilter={false}
      />
    </div>
  );
}
