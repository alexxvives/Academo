'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { FeedbackView, type ClassFeedback } from '@/components/shared';

export default function TeacherFeedbackPage() {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassFeedback[]>([]);

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    try {
      const response = await apiClient('/ratings/teacher');
      const result = await response.json();
      if (result.success) {
        setClasses(result.data);
      }
    } catch (error) {
      console.error('Failed to load feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Feedback de Estudiantes</h1>
        <p className="text-sm text-gray-500 mt-1">
          {classes.length > 0 && classes[0].academyName ? classes[0].academyName : 'Akademo'}
        </p>
      </div>

      <FeedbackView
        classes={classes}
        loading={loading}
        showClassFilter={false}
      />
    </div>
  );
}
