// src/app/page.tsx
'use client'; // Required for hooks and event handlers

import { useState, useMemo} from 'react';
import { Patient, Product, BillItem } from '@/types';
import PatientInfoForm from '@/components/ui/PatientInfoForm';
import ProductInputForm from '@/components/ui/ProductInputForm';
import BillTable from '@/components/ui/BillTable';
import BillSummary from '@/components/ui/BillSummary';
import Button from '@/components/ui/ui/Button';
import { generateBillPdf } from '@/lib/pdfGenerator';
import { useAuth } from '@/hooks/useAuth'; // Import the auth hook
import Input from '@/components/ui/ui/Input';
import Select from '@/components/ui/ui/Select';

const initialPatientState: Patient = { name: '', address: '', contact: '', gender: '', age: '' };
const CGST_RATE = parseFloat(process.env.NEXT_PUBLIC_CGST_RATE || '0.025'); // 2.5%
const SGST_RATE = parseFloat(process.env.NEXT_PUBLIC_SGST_RATE || '0.025'); // 2.5%

export default function BillingPage() {
  const { isAuthenticated, logout } = useAuth(); // Use the auth hook

  const [patient, setPatient] = useState<Patient>(initialPatientState);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [nextSrNo, setNextSrNo] = useState<number>(1);
  const [formError, setFormError] = useState<string>('');
  const [modeOfPayment, setModeOfPayment] = useState<string>('Cash');
  const [discount, setDiscount] = useState<number>(0);

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
      const currentDate = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY format
      const newItem: BillItem = {
        ...product,
        srNo: nextSrNo,
        type: product.type,
        amount: product.quantity * product.price,
        date: currentDate,
      };
      setBillItems(prevItems => [...prevItems, newItem]);
      setNextSrNo(prevSrNo => prevSrNo + 1); // Increment SR# only for new items
    }
  };

  // Calculate totals using useMemo for optimization
  const { itemsTotal, cgstAmount, sgstAmount, totalAmount } = useMemo(() => {
    const items = billItems.reduce((sum, item) => sum + item.amount, 0);
    const afterDiscount = items - discount;
    const cgst = afterDiscount * CGST_RATE;
    const sgst = afterDiscount * SGST_RATE;
    const total = afterDiscount + cgst + sgst;
    return { 
      itemsTotal: items,
      cgstAmount: cgst,
      sgstAmount: sgst,
      totalAmount: total 
    };
  }, [billItems, discount]); // Recalculate only when billItems or discount change

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
    generateBillPdf(
      patient,
      billItems,
      itemsTotal,
      cgstAmount,
      sgstAmount,
      discount,
      modeOfPayment,
      totalAmount
    );
  };

  const handleRemoveItem = (srNo: number) => {
    setBillItems(prevItems => {
      // First filter out the removed item
      const filteredItems = prevItems.filter(item => item.srNo !== srNo);
      // Then reorder the serial numbers
      return filteredItems.map((item, index) => ({
        ...item,
        srNo: index + 1
      }));
    });
    // Update nextSrNo to be the next number after the last item
    setNextSrNo(billItems.length);
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
         
         {/* Add Mode of Payment and Discount inputs */}
         <div className="bg-white p-6 rounded-lg shadow mb-6 border border-gray-200">
           <h2 className="text-xl font-semibold mb-4 text-gray-800">Payment Details</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Select
               label="Mode of Payment"
               id="modeOfPayment"
               name="modeOfPayment"
               value={modeOfPayment}
               onChange={(e) => setModeOfPayment(e.target.value)}
               options={[
                 { value: 'Cash', label: 'Cash' },
                 { value: 'Card', label: 'Card' },
                 { value: 'UPI', label: 'UPI' },
                 { value: 'Net Banking', label: 'Net Banking' }
               ]}
             />
             <Input
               label="Discount Amount"
               id="discount"
               name="discount"
               type="number"
               value={discount.toString()}
               onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
               min="0"
               step="0.01"
             />
           </div>
         </div>

         <ProductInputForm onAddProduct={handleAddProduct} />
         <BillTable items={billItems} onRemoveItem={handleRemoveItem} />
         <BillSummary
            itemsTotal={itemsTotal}
            cgstAmount={cgstAmount}
            sgstAmount={sgstAmount}
            totalAmount={totalAmount}
            cgstRate={CGST_RATE}
            sgstRate={SGST_RATE}
            discount={discount}
         />

         <div className="mt-8 flex justify-end">
             <Button onClick={handleGenerateBill} disabled={billItems.length === 0}>
                Generate & Download Bill (PDF)
             </Button>
        </div>
    </div>
  ) : null; // Render nothing if not authenticated (redirect handled by hook)
}