'use client';

import { useEffect, useState, useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import { StudentsProgressTable, type StudentProgress } from '@/components/shared';

interface Class {
  id: string;
  name: string;
}

export default function AcademyStudentsPage() {
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
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
      const res = await apiClient('/academies');
      const result = await res.json();
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        setAcademyName(result.data[0].name || '');
      }
    } catch (error) {
      console.error('Failed to load academy name:', error);
    }
  };

  const loadProgress = async () => {
    try {
      // Load classes
      const classesRes = await apiClient('/academies/classes');
      const classesData = await classesRes.json();
      if (classesData.success && Array.isArray(classesData.data)) {
        setClasses(classesData.data);
      }

      // Load student progress
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

  // Get unique class names from classes array (not from students)
  const uniqueClasses = useMemo(() => {
    return classes.map(c => c.name);
  }, [classes]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Progreso de Estudiantes</h1>
        {academyName && <p className="text-sm text-gray-500 mt-1">{academyName}</p>}
      </div>

      <StudentsProgressTable
        students={students}
        loading={loading}
        searchQuery={searchQuery}
        selectedClass={selectedClass}
        onSearchChange={setSearchQuery}
        onClassFilterChange={setSelectedClass}
        uniqueClasses={uniqueClasses}
        showClassFilter={true}
      />
    </div>
  );
}
