'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/ui/Button';
import Input from '@/components/ui/ui/Input';
import { format } from 'date-fns';
import Image from 'next/image';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

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

interface Quotation {
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
    price: number;
    amount: number;
    type: string;
    isPriceInclGst: boolean;
  }>;
  totalAmount: number;
  discount: number;
  cgstAmount: number;
  sgstAmount: number;
  createdAt: string;
}

type HistoryType = 'bill' | 'quotation';

export default function HistoryPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [historyType, setHistoryType] = useState<HistoryType>('bill');
  const [bills, setBills] = useState<Bill[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchData();
  }, [historyType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = historyType === 'bill' ? '/api/bills' : '/api/quotations';
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${historyType}s`);
      }
      const data = await response.json();
      if (historyType === 'bill') {
        setBills(data);
      } else {
        setQuotations(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const filteredData = (historyType === 'bill' ? bills : quotations).filter(item => {
    const matchesSearch = 
      item.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serialNo.includes(searchTerm);
    
    const itemDate = new Date(item.date);
    const matchesDateRange = 
      (!startDate || itemDate >= new Date(startDate)) &&
      (!endDate || itemDate <= new Date(endDate));

    return matchesSearch && matchesDateRange;
  });

  const handleViewDetails = (itemId: string) => {
    const endpoint = historyType === 'bill' ? 'bills' : 'quotations';
    router.push(`/dashboard/history/${endpoint}/${itemId}`);
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm(`Are you sure you want to delete this ${historyType}?`)) return;
    const endpoint = historyType === 'bill' ? 'bills' : 'quotations';
    const res = await fetch(`/api/${endpoint}/${itemId}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchData();
    } else {
      alert(`Failed to delete ${historyType}.`);
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
    <>
      <div className="container mx-auto p-4 md:p-8 max-w-6xl bg-gray-50 min-h-screen pb-20">
        <Header title="Absolute Prosthetics & Orthotics History" onLogout={logout} />
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex justify-center mb-6">
            <div className="inline-flex bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setHistoryType('bill')}
                className={`px-6 py-2 rounded-full transition font-semibold ${
                  historyType === 'bill'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                Bills
              </button>
              <button
                onClick={() => setHistoryType('quotation')}
                className={`px-6 py-2 rounded-full transition font-semibold ${
                  historyType === 'quotation'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                Quotations
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Input
              id="search"
              label="Search"
              placeholder={`Search by name or ${historyType === 'bill' ? 'bill' : 'quotation'} number`}
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
          
          {filteredData.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {historyType === 'bill' ? 'Bill No.' : 'Quotation No.'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(item.date), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.serialNo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.patientName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{item.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <a
                        href={`/api/${historyType}s/${item._id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-4 py-2 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition text-sm"
                        onClick={(e) => {
                          e.preventDefault();
                          window.open(`/api/${historyType}s/${item._id}/pdf`, '_blank');
                        }}
                      >
                        View Details
                      </a>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="ml-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No {historyType}s found matching your search criteria
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
} 