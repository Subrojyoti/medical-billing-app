'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/ui/Button';
import Header from '@/components/ui/Header';
import { PlusIcon, ClipboardIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import Footer from '@/components/ui/Footer';

export default function Dashboard() {
  const router = useRouter();
  const { logout } = useAuth();
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <>
      <div className="container mx-auto p-4 md:p-8 max-w-6xl bg-gray-50 min-h-screen pb-20">
        <Header title="Absolute Prosthetics & Orthotics Dashboard" onLogout={logout} />
        <div className="flex justify-center mt-12">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Button
                onClick={() => router.push('/dashboard/history')}
                className="flex flex-col items-center justify-center gap-2 p-6 text-lg font-semibold rounded-lg shadow-sm bg-white border border-indigo-200 hover:bg-indigo-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition"
              >
                <span className="text-indigo-700"><ClipboardIcon className="w-7 h-7 mb-1" /></span>
                <span className="text-indigo-700">View History</span>
              </Button>
              <Button
                onClick={() => router.push('/dashboard/new-bill')}
                className="flex flex-col items-center justify-center gap-2 p-6 text-lg font-semibold rounded-lg shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-2 focus:ring-indigo-400 focus:outline-none transition"
              >
                <PlusIcon className="w-7 h-7 mb-1" />
                New Bill
              </Button>
              <div className="relative">
                <Button
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  onFocus={() => setShowTooltip(true)}
                  onBlur={() => setShowTooltip(false)}
                  className="flex flex-col items-center justify-center gap-2 p-6 text-lg font-semibold rounded-lg shadow-sm bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                  disabled
                >
                  <ArchiveBoxIcon className="w-7 h-7 mb-1" />
                  Manage Inventory
                </Button>
                {showTooltip && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10 whitespace-nowrap">
                    Coming soon!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
} 