'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/ui/Button';

export default function Dashboard() {
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-6 pb-4 border-b border-gray-300">
        <h1 className="text-3xl font-bold text-gray-800">Medical Billing Dashboard</h1>
        <Button onClick={logout} variant="secondary">Logout</Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Button
          onClick={() => router.push('/dashboard/history')}
          className="p-8 text-xl"
        >
          View History
        </Button>
        <Button
          onClick={() => router.push('/dashboard/new-bill')}
          className="p-8 text-xl"
        >
          New Bill
        </Button>
      </div>
    </div>
  );
} 