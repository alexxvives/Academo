'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import AuthModal from '@/components/AuthModal';

export default function HomePage() {
  const searchParams = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    const modal = searchParams.get('modal');
    if (modal === 'login' || modal === 'register') {
      setModalMode(modal);
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [searchParams]);

  const openModal = (mode: 'login' | 'register') => {
    setModalMode(mode);
    window.history.pushState({}, '', `/?modal=${mode}`);
    setShowModal(true);
  };

  const closeModal = () => {
    window.history.pushState({}, '', '/');
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-primary-50">
      {/* Auth Modal */}
      {showModal && <AuthModal mode={modalMode} onClose={closeModal} />}

      {/* Header */}
      <header className="bg-white border-b border-primary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              AH
            </div>
            <h1 className="text-2xl font-bold text-primary-900">Academy Hive</h1>
          </div>
          <nav className="flex gap-4">
            <button
              onClick={() => openModal('login')}
              className="px-6 py-2 text-primary-700 hover:text-primary-900 font-medium transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => openModal('register')}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium shadow-sm transition-all"
            >
              Get Started
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h2 className="text-5xl font-bold text-primary-900 mb-6 leading-tight">
            Secure Learning Platform
            <br />
            <span className="text-primary-600">Built for Protection</span>
          </h2>
          <p className="text-xl text-primary-700 mb-10 max-w-3xl mx-auto leading-relaxed">
            Academy Hive is a modern learning management system where academies
            can manage classes, teachers, students, and deliver highly protected
            video lessons with advanced anti-piracy features.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => openModal('register')}
              className="px-8 py-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium text-lg shadow-sm transition-all"
            >
              Create Academy
            </button>
            <button
              onClick={() => openModal('register')}
              className="px-8 py-4 bg-white text-primary-700 border border-primary-300 rounded-lg hover:bg-primary-50 font-medium text-lg transition-all"
            >
              Join as Student
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h3 className="text-3xl font-bold text-primary-900 text-center mb-12">
          Platform Features
        </h3>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon="🔒"
            title="Strong Access Control"
            description="Role-based permissions ensure only authorized users can access content. Academies approve students, teachers manage classes."
          />
          <FeatureCard
            icon="🎥"
            title="Protected Video Lessons"
            description="Advanced video protection with play count limits, seek-back restrictions, and dynamic identity watermarking."
          />
          <FeatureCard
            icon="🚫"
            title="Anti-Sharing Technology"
            description="Single active session per student with device fingerprinting prevents account sharing and unauthorized access."
          />
          <FeatureCard
            icon="📊"
            title="Progress Tracking"
            description="Detailed analytics for teachers showing student progress, plays remaining, devices used, and watch history."
          />
          <FeatureCard
            icon="🎓"
            title="Multi-Academy Support"
            description="Platform supports multiple academies, each with their own classes, teachers, and content libraries."
          />
          <FeatureCard
            icon="⚡"
            title="High Performance"
            description="Built on Next.js and PostgreSQL for fast, reliable performance with Cloudflare deployment support."
          />
        </div>
      </section>

      {/* Security Features */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-primary-900 text-center mb-12">
            Video Protection Features
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <SecurityFeature
              title="Dynamic Watermarking"
              description="Student name and email appear as semi-transparent overlays at random positions and intervals, making screen recording traceable."
            />
            <SecurityFeature
              title="Play Count Limits"
              description="Configurable maximum plays per video (default: 2). Prevents unlimited viewing and encourages focused learning."
            />
            <SecurityFeature
              title="Seek-Back Restrictions"
              description="Students can only rewind up to X minutes (default: 10) from their furthest watched point."
            />
            <SecurityFeature
              title="No Direct Downloads"
              description="Videos are streamed securely without exposing direct URLs. Right-click and download buttons are disabled."
            />
            <SecurityFeature
              title="Session Enforcement"
              description="Only one active login per student. New logins automatically terminate previous sessions on other devices."
            />
            <SecurityFeature
              title="Progress Resumption"
              description="Students always resume from their last saved progress, with all restrictions enforced."
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h3 className="text-3xl font-bold text-primary-900 text-center mb-6">
          Simple, Transparent Pricing
        </h3>
        <p className="text-center text-primary-700 mb-12">
          Pay only for what you use. No hidden fees.
        </p>
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm p-8 border border-primary-200">
          <h4 className="text-2xl font-bold text-primary-900 mb-4">Per Student</h4>
          <div className="flex items-baseline mb-6">
            <span className="text-5xl font-bold text-primary-600">€1</span>
            <span className="text-primary-700 ml-2">/ student / class / month</span>
          </div>
          <ul className="space-y-3 mb-8">
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span className="text-gray-700">Unlimited video uploads</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span className="text-gray-700">Full video protection features</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span className="text-gray-700">Progress tracking & analytics</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span className="text-gray-700">Document sharing</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span className="text-gray-700">24/7 platform access</span>
            </li>
          </ul>
          <p className="text-sm text-gray-500 text-center">
            * Billing integration coming soon
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-100 py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h3 className="text-4xl font-bold text-primary-900 mb-6">
            Ready to Protect Your Content?
          </h3>
          <p className="text-xl text-primary-700 mb-8">
            Join Academy Hive today and start delivering secure, protected video
            lessons to your students.
          </p>
          <button
            onClick={() => openModal('register')}
            className="inline-block px-8 py-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium text-lg shadow-sm transition-all"
          >
            Create Your Academy Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary-900 text-primary-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2025 Academy Hive. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-primary-100 p-6 hover:shadow-sm transition-all">
      <div className="text-4xl mb-4">{icon}</div>
      <h4 className="text-xl font-semibold text-primary-900 mb-2">{title}</h4>
      <p className="text-primary-700">{description}</p>
    </div>
  );
}

function SecurityFeature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold">
          ✓
        </div>
      </div>
      <div>
        <h4 className="text-lg font-semibold text-primary-900 mb-1">{title}</h4>
        <p className="text-primary-700">{description}</p>
      </div>
    </div>
  );
}
