'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

interface Academy {
  id: string;
  name: string;
  description: string | null;
  owner: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  memberships: Array<{
    id: string;
    status: string;
    requestedAt: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
    };
  }>;
  classes: Array<{
    id: string;
    name: string;
    description: string | null;
    _count: {
      enrollments: number;
      videos: number;
      documents: number;
    };
  }>;
}

export default function AcademyManagePage() {
  const params = useParams();
  const academyId = params.id as string;
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [loading, setLoading] = useState(true);
  const [showClassForm, setShowClassForm] = useState(false);
  const [classFormData, setClassFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (academyId) {
      loadAcademy();
    }
  }, [academyId]);

  const loadAcademy = async () => {
    try {
      const response = await fetch(`/api/academies/${academyId}`);
      const result = await response.json();

      if (result.success) {
        setAcademy(result.data);
      }
    } catch (error) {
      console.error('Failed to load academy:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReject = async (membershipId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const response = await fetch(`/api/memberships/${membershipId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`Student ${status.toLowerCase()} successfully!`);
        loadAcademy();
      } else {
        alert(result.error || 'Failed to update membership');
      }
    } catch (error) {
      alert('An error occurred');
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...classFormData,
          academyId: academyId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Class created successfully!');
        setClassFormData({ name: '', description: '' });
        setShowClassForm(false);
        loadAcademy();
      } else {
        alert(result.error || 'Failed to create class');
      }
    } catch (error) {
      alert('An error occurred');
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="TEACHER">
        <div className="text-center py-12">
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!academy) {
    return (
      <DashboardLayout role="TEACHER">
        <div className="text-center py-12">
          <div className="text-xl text-gray-600">Academy not found</div>
        </div>
      </DashboardLayout>
    );
  }

  const pendingMemberships = academy.memberships.filter((m) => m.status === 'PENDING');
  const approvedMemberships = academy.memberships.filter((m) => m.status === 'APPROVED');

  return (
    <DashboardLayout role="TEACHER">
      <div className="space-y-8">
        {/* Academy Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {academy.name}
              </h2>
              {academy.description && (
                <p className="text-gray-600">{academy.description}</p>
              )}
              <div className="flex gap-6 mt-4 text-sm text-gray-500">
                <span>👥 {approvedMemberships.length} Members</span>
                <span>📚 {academy.classes.length} Classes</span>
                <span>
                  🎥{' '}
                  {academy.classes.reduce((sum, c) => sum + c._count.videos, 0)}{' '}
                  Videos
                </span>
              </div>
            </div>
            <Link
              href="/dashboard/teacher"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
            >
              ← Back
            </Link>
          </div>
        </div>

        {/* Pending Membership Requests */}
        {pendingMemberships.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Pending Membership Requests ({pendingMemberships.length})
            </h3>
            <div className="space-y-3">
              {pendingMemberships.map((membership) => (
                <div
                  key={membership.id}
                  className="flex justify-between items-center p-4 border border-gray-200 rounded-lg"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {membership.user.firstName} {membership.user.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{membership.user.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Requested: {new Date(membership.requestedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveReject(membership.id, 'APPROVED')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleApproveReject(membership.id, 'REJECTED')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Classes Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">
              Classes ({academy.classes.length})
            </h3>
            <button
              onClick={() => setShowClassForm(!showClassForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              + Create Class
            </button>
          </div>

          {/* Create Class Form */}
          {showClassForm && (
            <form onSubmit={handleCreateClass} className="mb-6 p-4 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">New Class</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class Name
                  </label>
                  <input
                    type="text"
                    required
                    value={classFormData.name}
                    onChange={(e) =>
                      setClassFormData({ ...classFormData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={classFormData.description}
                    onChange={(e) =>
                      setClassFormData({
                        ...classFormData,
                        description: e.target.value,
                      })
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClassForm(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Classes List */}
          {academy.classes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No classes yet. Create your first class to get started!
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {academy.classes.map((classItem) => (
                <Link
                  key={classItem.id}
                  href={`/dashboard/teacher/class/${classItem.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {classItem.name}
                  </h4>
                  {classItem.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {classItem.description}
                    </p>
                  )}
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>👥 {classItem._count.enrollments} Students</span>
                    <span>🎥 {classItem._count.videos} Videos</span>
                    <span>📄 {classItem._count.documents} Docs</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Members List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Approved Members ({approvedMemberships.length})
          </h3>
          {approvedMemberships.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No approved members yet.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {approvedMemberships.map((membership) => (
                <div
                  key={membership.id}
                  className="p-4 border border-gray-200 rounded-lg"
                >
                  <p className="font-semibold text-gray-900">
                    {membership.user.firstName} {membership.user.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{membership.user.email}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
