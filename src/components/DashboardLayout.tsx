'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export default function DashboardLayout({
  children,
  role,
}: {
  children: React.ReactNode;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    
    // Check session every 30 seconds for students
    if (role === 'STUDENT') {
      const interval = setInterval(checkSession, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const result = await response.json();

      if (result.success && result.data.role === role) {
        setUser(result.data);
      } else {
        router.push('/login');
      }
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const checkSession = async () => {
    try {
      const response = await fetch('/api/session/check');
      const result = await response.json();

      if (!result.success || !result.data.valid) {
        alert(result.data.message || 'Your session has expired.');
        handleLogout();
      }
    } catch {
      // Ignore errors
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="text-xl text-primary-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50">
      {/* Header */}
      <header className="bg-white border-b border-primary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/${role.toLowerCase()}`}>
              <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center text-white font-bold cursor-pointer hover:bg-primary-600 transition-colors">
                AH
              </div>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-primary-900">
                {role === 'ADMIN'
                  ? 'Admin Dashboard'
                  : role === 'TEACHER'
                  ? 'Teacher Dashboard'
                  : 'My Classes'}
              </h1>
              {user && (
                <p className="text-sm text-primary-600">
                  {user.firstName} {user.lastName}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm text-primary-700">{user.email}</span>
            )}
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-white text-primary-700 border border-primary-300 rounded-lg hover:bg-primary-50 font-medium transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
