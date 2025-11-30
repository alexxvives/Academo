'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

interface Academy {
  id: string;
  name: string;
  description: string | null;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  _count: {
    classes: number;
  };
}

interface Class {
  id: string;
  name: string;
  description: string | null;
  academy: {
    name: string;
  };
  _count: {
    videos: number;
    documents: number;
  };
}

interface Membership {
  id: string;
  status: string;
  academyId: string;
  requestedAt: string;
}

export default function StudentDashboard() {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [academiesRes, classesRes, membershipsRes] = await Promise.all([
        fetch('/api/academies'),
        fetch('/api/classes'),
        fetch('/api/memberships'),
      ]);

      const [academiesResult, classesResult, membershipsResult] = await Promise.all([
        academiesRes.json(),
        classesRes.json(),
        membershipsRes.json(),
      ]);

      if (academiesResult.success) {
        setAcademies(academiesResult.data);
      }

      if (classesResult.success) {
        setClasses(classesResult.data);
      }

      if (membershipsResult.success) {
        setMemberships(membershipsResult.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestMembership = async (academyId: string) => {
    try {
      const response = await fetch('/api/memberships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ academyId }),
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Membership request sent! Wait for teacher approval.');
        loadData();
      } else {
        alert(result.error || 'Failed to send request');
      }
    } catch (error) {
      alert('An error occurred');
    }
  };

  const getMembershipStatus = (academyId: string) => {
    return memberships.find((m) => m.academyId === academyId);
  };

  if (loading) {
    return (
      <DashboardLayout role="STUDENT">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
            <p className="text-primary-600">Loading your dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const pendingMemberships = memberships.filter((m) => m.status === 'PENDING');
  const approvedMemberships = memberships.filter((m) => m.status === 'APPROVED');

  return (
    <DashboardLayout role="STUDENT">
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="bg-white rounded-lg border border-primary-100 shadow-sm p-8">
          <h1 className="text-3xl font-bold text-primary-900 mb-2">Welcome Back, Student! 🎓</h1>
          <p className="text-primary-700 text-lg mb-6">
            Continue your learning journey and explore new courses
          </p>
          <div className="flex gap-6 text-primary-700">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
              </svg>
              <span className="font-medium">{classes.length} Active {classes.length === 1 ? 'Class' : 'Classes'}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
              </svg>
              <span className="font-medium">{approvedMemberships.length} {approvedMemberships.length === 1 ? 'Academy' : 'Academies'}</span>
            </div>
            {pendingMemberships.length > 0 && (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                </svg>
                <span className="font-medium">{pendingMemberships.length} Pending {pendingMemberships.length === 1 ? 'Request' : 'Requests'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Pending Requests Alert */}
        {pendingMemberships.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  {pendingMemberships.length} membership {pendingMemberships.length === 1 ? 'request' : 'requests'} pending approval
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  Teachers will review your requests soon. You'll get access once approved.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* My Classes */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-primary-900">My Classes</h2>
              <p className="text-primary-700 mt-1">Continue where you left off</p>
            </div>
          </div>
          
          {classes.length === 0 ? (
            <div className="bg-white rounded-lg border border-primary-100 shadow-sm p-12 text-center">
              <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-primary-900 mb-2">
                No classes enrolled yet
              </h3>
              <p className="text-primary-700 mb-6 max-w-md mx-auto">
                Browse available teachers below and request to join their academies to access amazing courses!
              </p>
              <a href="#academies" className="inline-block px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium transition-all shadow-sm">
                Explore Academies
              </a>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((classItem) => (
                <Link
                  key={classItem.id}
                  href={`/dashboard/student/class/${classItem.id}`}
                  className="group bg-white rounded-lg border border-primary-100 hover:border-primary-300 hover:shadow-sm transition-all overflow-hidden"
                >
                  <div className="bg-primary-50 p-6 border-b border-primary-100">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                        {classItem.name.charAt(0)}
                      </div>
                      <span className="px-3 py-1 bg-white text-primary-700 text-xs font-medium rounded-full border border-primary-200">
                        Active
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-primary-900 mb-1 group-hover:text-primary-600 transition-colors">
                      {classItem.name}
                    </h3>
                    <p className="text-sm text-primary-600 mb-3">
                      {classItem.academy.name}
                    </p>
                    {classItem.description && (
                      <p className="text-sm text-primary-700 mb-4 line-clamp-2">
                        {classItem.description}
                      </p>
                    )}
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-1 text-primary-700">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
                        </svg>
                        <span className="font-medium">{classItem._count.videos}</span>
                      </div>
                      <div className="flex items-center gap-1 text-primary-700">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
                        </svg>
                        <span className="font-medium">{classItem._count.documents}</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 pb-6">
                    <div className="flex items-center text-primary-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
                      Continue Learning
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Available Academies */}
        <div id="academies">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-primary-900">Discover Teachers & Academies</h2>
              <p className="text-primary-700 mt-1">Request to join academies and unlock their courses</p>
            </div>
          </div>

          {academies.length === 0 ? (
            <div className="bg-white rounded-lg border border-primary-100 shadow-sm p-12 text-center">
              <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-primary-900 mb-2">
                No academies available
              </h3>
              <p className="text-primary-700">
                Check back soon for new teachers and academies.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {academies.map((academy) => {
                const membership = getMembershipStatus(academy.id);
                const isPending = membership?.status === 'PENDING';
                const isApproved = membership?.status === 'APPROVED';
                const isRejected = membership?.status === 'REJECTED';

                return (
                  <div
                    key={academy.id}
                    className="bg-white rounded-lg border border-primary-100 hover:shadow-sm transition-all overflow-hidden"
                  >
                    <div className="bg-primary-50 p-6 border-b border-primary-100">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-primary-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                          {academy.owner.firstName[0]}{academy.owner.lastName[0]}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-primary-900 mb-1">
                            {academy.name}
                          </h3>
                          <p className="text-sm text-primary-600">
                            by {academy.owner.firstName} {academy.owner.lastName}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      {academy.description && (
                        <p className="text-sm text-primary-700 mb-4 line-clamp-3">
                          {academy.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-primary-600 mb-5">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z"/>
                        </svg>
                        <span className="font-medium">
                          {academy._count.classes} {academy._count.classes === 1 ? 'class' : 'classes'} available
                        </span>
                      </div>

                      {isApproved && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-semibold">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                          </svg>
                          Member
                        </div>
                      )}

                      {isPending && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg text-sm font-semibold">
                          <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                          </svg>
                          Pending Approval
                        </div>
                      )}

                      {isRejected && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-semibold">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                          </svg>
                          Request Declined
                        </div>
                      )}

                      {!membership && (
                        <button
                          onClick={() => handleRequestMembership(academy.id)}
                          className="w-full px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium transition-all shadow-sm"
                        >
                          Request to Join
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
