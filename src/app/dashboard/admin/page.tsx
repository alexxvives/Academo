'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

interface Academy {
  id: string;
  name: string;
  owner: {
    email: string;
    firstName: string;
    lastName: string;
  };
  _count: {
    memberships: number;
    classes: number;
  };
  createdAt: string;
}

interface PlatformSettings {
  defaultMaxWatchTimeMultiplier: number;
}

export default function AdminDashboard() {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch('/api/academies');
      const result = await response.json();

      if (result.success) {
        setAcademies(result.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="ADMIN">
        <div className="text-center py-12">
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  const totalStudents = academies.reduce((sum, a) => sum + a._count.memberships, 0);
  const totalClasses = academies.reduce((sum, a) => sum + a._count.classes, 0);

  return (
    <DashboardLayout role="ADMIN">
      <div className="space-y-8">
        {/* Welcome Message */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Platform Administration
          </h2>
          <p className="text-gray-600">
            Monitor and manage all academies, teachers, and students
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Total Academies
            </h3>
            <p className="text-3xl font-bold text-gray-900">
              {academies.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Total Students
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              {totalStudents}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Total Classes
            </h3>
            <p className="text-3xl font-bold text-green-600">
              {totalClasses}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Active Teachers
            </h3>
            <p className="text-3xl font-bold text-purple-600">
              {academies.length}
            </p>
          </div>
        </div>

        {/* All Academies */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            All Academies
          </h3>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Academy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Members
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Classes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {academies.map((academy) => (
                  <tr key={academy.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {academy.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {academy.owner.firstName} {academy.owner.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {academy.owner.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {academy._count.memberships}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {academy._count.classes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
