// src/app/page.tsx
'use client'; // Required for hooks and event handlers

import { useState, useMemo, useEffect } from 'react';
import { Patient, Product, BillItem } from '@/types';
import PatientInfoForm from '@/components/ui/PatientInfoForm';
import ProductInputForm from '@/components/ui/ProductInputForm';
import BillTable from '@/components/ui/BillTable';
import BillSummary from '@/components/ui/BillSummary';
import Button from '@/components/ui/ui/Button';
import { generateBillPdf } from '@/lib/pdfGenerator';
import { useAuth } from '@/hooks/useAuth'; // Import the auth hook

const initialPatientState: Patient = { name: '', address: '', contact: '', gender: '', age: '' };
const GST_RATE = parseFloat(process.env.NEXT_PUBLIC_GST_RATE || '0.18'); // Get GST rate from env

export default function BillingPage() {
  const { isAuthenticated, logout } = useAuth(); // Use the auth hook

  const [patient, setPatient] = useState<Patient>(initialPatientState);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [nextSrNo, setNextSrNo] = useState<number>(1);
  const [formError, setFormError] = useState<string>('');

  const handlePatientChange = (field: keyof Patient, value: string) => {
    setPatient(prev => ({ ...prev, [field]: value }));
     setFormError(''); // Clear global error on change
  };

  const handleAddProduct = (product: Product) => {
     setFormError(''); // Clear global error on add attempt
    // Find if product already exists (case-insensitive description match)
    const existingItemIndex = billItems.findIndex(
      item => item.description.toLowerCase() === product.description.toLowerCase()
    );

    if (existingItemIndex !== -1) {
      // Consolidate: Update quantity and amount of the existing item
      setBillItems(prevItems =>
        prevItems.map((item, index) =>
          index === existingItemIndex
            ? {
                ...item,
                quantity: item.quantity + product.quantity,
                amount: (item.quantity + product.quantity) * item.price, // Recalculate amount
              }
            : item
        )
      );
    } else {
      // Add as a new item
      const newItem: BillItem = {
        ...product,
        srNo: nextSrNo,
        amount: product.quantity * product.price,
      };
      setBillItems(prevItems => [...prevItems, newItem]);
      setNextSrNo(prevSrNo => prevSrNo + 1); // Increment SR# only for new items
    }
  };

  // Calculate totals using useMemo for optimization
  const { subtotal, gstAmount, totalAmount } = useMemo(() => {
    const sub = billItems.reduce((sum, item) => sum + item.amount, 0);
    const gst = sub * GST_RATE;
    const total = sub + gst;
    return { subtotal: sub, gstAmount: gst, totalAmount: total };
  }, [billItems]); // Recalculate only when billItems change

  const handleGenerateBill = () => {
    // Validation before generating PDF
    if (!patient.name || !patient.contact || !patient.address || !patient.gender || !patient.age) {
      setFormError('Please fill in all patient details.');
      window.scrollTo(0, 0); // Scroll to top to show error
      return;
    }
     if (billItems.length === 0) {
       setFormError('Please add at least one product to the bill.');
        return;
    }

    setFormError(''); // Clear error if validation passes
    generateBillPdf(patient, billItems, subtotal, gstAmount, totalAmount);
  };

  // Effect to handle rendering based on auth state
  // Render null or loading indicator while checking auth to prevent flicker
  if (isAuthenticated === null) {
       return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // If not authenticated (checked by useAuth), the hook will redirect.
  // We only render the main content if isAuthenticated is true.
  return isAuthenticated ? (
     <div className="container mx-auto p-4 md:p-8 max-w-6xl bg-gray-50 min-h-screen">
          <header className="flex justify-between items-center mb-6 pb-4 border-b border-gray-300">
            <h1 className="text-3xl font-bold text-gray-800">Medical Shop Billing</h1>
             <Button onClick={logout} variant="secondary">Logout</Button>
          </header>

         {formError && (
             <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <strong className="font-bold">Error!</strong>
                <span className="block sm:inline"> {formError}</span>
             </div>
         )}

         <PatientInfoForm patient={patient} onChange={handlePatientChange} />
         <ProductInputForm onAddProduct={handleAddProduct} />
         <BillTable items={billItems} />
         <BillSummary
            subtotal={subtotal}
            gstAmount={gstAmount}
            totalAmount={totalAmount}
            gstRate={GST_RATE}
         />

         <div className="mt-8 flex justify-end">
             <Button onClick={handleGenerateBill} disabled={billItems.length === 0}>
                Generate & Download Bill (PDF)
             </Button>
        </div>
    </div>
  ) : null; // Render nothing if not authenticated (redirect handled by hook)
}