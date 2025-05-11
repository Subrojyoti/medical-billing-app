'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/ui/Button';
import Input from '@/components/ui/ui/Input';
import { format } from 'date-fns';

interface Bill {
  _id: string;
  serialNo: string;
  date: string;
  patientName: string;
  patientAddress: string;
  patientContact: string;
  patientAge: string;
  patientGender: string;
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  totalAmount: number;
  amountInWords: string;
  createdAt: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const response = await fetch('/api/bills');
      if (!response.ok) {
        throw new Error('Failed to fetch bills');
      }
      const data = await response.json();
      setBills(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const filteredBills = bills.filter(bill => {
    const matchesSearch = 
      bill.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.serialNo.includes(searchTerm);
    
    const billDate = new Date(bill.date);
    const matchesDateRange = 
      (!startDate || billDate >= new Date(startDate)) &&
      (!endDate || billDate <= new Date(endDate));

    return matchesSearch && matchesDateRange;
  });

  const handleViewBill = (billId: string) => {
    router.push(`/dashboard/history/${billId}`);
  };

  const handleDeleteBill = async (billId: string) => {
    if (!confirm('Are you sure you want to delete this bill?')) return;
    const res = await fetch(`/api/bills/${billId}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchBills();
    } else {
      alert('Failed to delete bill.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-6 pb-4 border-b border-gray-300">
        <h1 className="text-3xl font-bold text-gray-800">Billing History</h1>
        <Button onClick={logout} variant="secondary">Logout</Button>
      </header>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Input
            id="search"
            label="Search"
            placeholder="Search by name or serial number"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Input
            id="startDate"
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            id="endDate"
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBills.map((bill) => (
                <tr key={bill._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(bill.date), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {bill.serialNo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {bill.patientName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{bill.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <a
                      href={`/api/bills/${bill._id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition text-sm"
                      onClick={(e) => {
                        e.preventDefault();
                        window.open(`/api/bills/${bill._id}/pdf`, '_blank');
                      }}
                    >
                      View Details
                    </a>
                    <button
                      onClick={() => handleDeleteBill(bill._id)}
                      className="ml-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBills.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No bills found matching your search criteria
          </div>
        )}
      </div>
    </div>
  );
} 