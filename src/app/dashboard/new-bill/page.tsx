/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/dashboard/new-bill/page.tsx
'use client'; // Required for hooks and event handlers

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Patient, Product, BillItem } from '@/types';
import PatientInfoForm from '@/components/ui/PatientInfoForm';
import ProductInputForm from '@/components/ui/ProductInputForm';
import BillTable from '@/components/ui/BillTable';
import BillSummary from '@/components/ui/BillSummary';
import Button from '@/components/ui/ui/Button';
import { generateBillPdf } from '@/lib/pdfGenerator';
import { generateQuotationPdf } from '@/lib/pdfQuotation';
import { useAuth } from '@/hooks/useAuth'; // Import the auth hook
import Input from '@/components/ui/ui/Input';
import Select from '@/components/ui/ui/Select';
import Image from 'next/image';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

const initialPatientState: Patient = { name: '', address: '', contact: '', gender: '', age: '', serialNo: '' };
const CGST_RATE = 0.025; // 2.5% fixed
const SGST_RATE = 0.025; // 2.5% fixed

export default function BillingPage() {
  const { isAuthenticated, logout } = useAuth(); // Use the auth hook

  const [patient, setPatient] = useState<Patient>(initialPatientState);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [nextSrNo, setNextSrNo] = useState<number>(1);
  const [formError, setFormError] = useState<string>('');
  const [modeOfPayment, setModeOfPayment] = useState<string>('Cash');
  const [discount, setDiscount] = useState<number>(0);

  // Add debounce function
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Add handler for serial number input
  const handleSerialNoChange = useCallback(
    debounce(async (value: string) => {
      if (!value) return;

      // Check if it's a quotation serial number (starts with QT-)
      if (value.startsWith('QT-')) {
        try {
          const response = await fetch(`/api/quotations/by-serial/${encodeURIComponent(value)}`);
          if (!response.ok) {
            if (response.status === 404) {
              // Quotation not found
              return;
            }
            throw new Error('Failed to fetch quotation details');
          }

          const data = await response.json();
          
          // Update patient details
          setPatient(data.patient);
          
          // Update bill items
          const formattedItems = data.items.map((item: any, index: number) => ({
            srNo: index + 1,
            type: item.type || 'Product',
            description: item.description,
            quantity: item.quantity,
            price: item.price,
            amount: item.price * item.quantity,
            date: item.date ? new Date(item.date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
            isPriceInclGst: item.isPriceInclGst || false
          }));
          
          setBillItems(formattedItems);
          setNextSrNo(formattedItems.length + 1);
          
          // Update discount
          setDiscount(data.discount || 0);

        } catch (error) {
          console.error('Error fetching quotation details:', error);
          setFormError('Failed to fetch quotation details. Please try again.');
        }
      } else {
        // Handle bill serial number (existing code)
        try {
          const response = await fetch(`/api/bills/by-serial/${encodeURIComponent(value)}`);
          if (!response.ok) {
            if (response.status === 404) {
              // Bill not found, this is a new serial number
              return;
            }
            throw new Error('Failed to fetch bill details');
          }

          const data = await response.json();
          
          // Update patient details
          setPatient(data.patient);
          
          // Update bill items
          const formattedItems = data.items.map((item: any, index: number) => ({
            srNo: index + 1,
            type: 'Product', // Default type
            description: item.description,
            quantity: item.quantity,
            price: item.rate,
            amount: item.amount,
            date: new Date().toLocaleDateString('en-GB'),
            isPriceInclGst: false // Default value
          }));
          
          setBillItems(formattedItems);
          setNextSrNo(formattedItems.length + 1);
          
          // Update discount
          setDiscount(data.discount || 0);

        } catch (error) {
          console.error('Error fetching bill details:', error);
          setFormError('Failed to fetch bill details. Please try again.');
        }
      }
    }, 500), // 500ms debounce delay
    []
  );

  // Modify handlePatientChange to include special handling for serial number
  const handlePatientChange = (field: keyof Patient, value: string) => {
    setPatient(prev => ({ ...prev, [field]: value }));
    setFormError(''); // Clear global error on change

    // If serial number is being changed, trigger the fetch
    if (field === 'serialNo') {
      handleSerialNoChange(value);
    }
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
        isPriceInclGst: product.isPriceInclGst,
      };
      setBillItems(prevItems => [...prevItems, newItem]);
      setNextSrNo(prevSrNo => prevSrNo + 1); // Increment SR# only for new items
    }
  };

  // Calculate totals using useMemo for optimization
  const { itemsTotal, cgstAmount, sgstAmount, totalAmount, effectiveDiscount } = useMemo(() => {
    let itemsTotal = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let allItemsInclGst = true;

    billItems.forEach(item => {
      if (item.isPriceInclGst) {
        const base = item.price / (1 + CGST_RATE + SGST_RATE);
        const cgst = base * CGST_RATE;
        const sgst = base * SGST_RATE;
        itemsTotal += item.price * item.quantity;
        cgstAmount += cgst * item.quantity;
        sgstAmount += sgst * item.quantity;
      } else {
        allItemsInclGst = false;
        const cgst = item.price * CGST_RATE;
        const sgst = item.price * SGST_RATE;
        itemsTotal += item.price * item.quantity;
        cgstAmount += cgst * item.quantity;
        sgstAmount += sgst * item.quantity;
      }
    });

    const effectiveDiscount = Math.min(discount, itemsTotal);
    let totalAmount;
    if (allItemsInclGst) {
      totalAmount = itemsTotal - effectiveDiscount;
    } else {
      totalAmount = itemsTotal + cgstAmount + sgstAmount - effectiveDiscount;
    }

    return { itemsTotal, cgstAmount, sgstAmount, totalAmount, effectiveDiscount };
  }, [billItems, discount]);

  const handleGenerateBill = async () => {
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

    try {
      // Fetch the next serial number
      const serialResponse = await fetch('/api/bills/next-serial');
      if (!serialResponse.ok) {
        throw new Error('Failed to fetch bill serial number');
      }
      const serialData = await serialResponse.json();
      const billSerialNo = serialData.serialNo;

      // Save bill to database
      const response = await fetch('/api/bills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient: {
            name: patient.name,
            address: patient.address,
            contact: patient.contact,
            gender: patient.gender,
            age: patient.age,
            serialNo: billSerialNo, // Use the fetched serial number
          },
          items: billItems,
          totalAmount,
          modeOfPayment,
          discount: effectiveDiscount,
          cgstAmount,
          sgstAmount,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save bill');
      }

      const savedBill = await response.json();

      // Generate PDF after successful save
      generateBillPdf(
        { ...patient, serialNo: billSerialNo },
        billItems,
        itemsTotal,
        cgstAmount,
        sgstAmount,
        discount,
        modeOfPayment,
        totalAmount
      );

      // Clear the form after successful save and PDF generation
      setPatient(initialPatientState);
      setBillItems([]);
      setNextSrNo(1);
      setDiscount(0);
      setModeOfPayment('Cash');

    } catch (error) {
      setFormError('Failed to save bill. Please try again.');
    }
  };

  const handleGenerateQuotation = async () => {
    // Validation before generating PDF
    if (!patient.name || !patient.contact || !patient.address || !patient.gender || !patient.age) {
      setFormError('Please fill in all patient details.');
      window.scrollTo(0, 0); // Scroll to top to show error
      return;
    }
    if (billItems.length === 0) {
      setFormError('Please add at least one product to the quotation.');
      return;
    }
    // New: Validate that every item has a type
    if (billItems.some(item => !item.type)) {
      setFormError('Every item must have a type. Please check your products.');
      window.scrollTo(0, 0);
      return;
    }

    setFormError(''); // Clear error if validation passes

    try {
      // Fetch quotation serial number
      const serialResponse = await fetch('/api/quotations/next-serial');
      if (!serialResponse.ok) {
        throw new Error('Failed to fetch quotation serial number');
      }
      const serialData = await serialResponse.json();
      const quotationSerialNo = serialData.serialNo;

      // Map billItems to ensure all required fields for quotation
      const quotationItems = billItems.map((item, idx) => ({
        type: item.type || 'Product',
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        isPriceInclGst: item.isPriceInclGst || false,
        date: item.date ? new Date(item.date) : new Date(),
        srNo: item.srNo || idx + 1
      }));

      // Log the payload for debugging
      const quotationPayload = {
        patient: {
          name: patient.name,
          address: patient.address,
          contact: patient.contact,
          gender: patient.gender,
          age: patient.age,
          serialNo: quotationSerialNo, // Use the quotation serial number
        },
        items: quotationItems,
        totalAmount,
        discount,
        cgstAmount,
        sgstAmount,
      };
      console.log('Quotation payload:', quotationPayload);

      // Save quotation to database
      const response = await fetch('/api/quotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quotationPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to save quotation:', errorText);
        throw new Error('Failed to save quotation');
      }

      // Generate PDF after successful save
      generateQuotationPdf(
        { ...patient, serialNo: quotationSerialNo }, // Use the quotation serial number
        billItems,
        itemsTotal,
        cgstAmount,
        sgstAmount,
        discount,
        totalAmount
      );

    } catch (error) {
      console.error('Error saving quotation:', error);
      setFormError('Failed to save quotation. Please try again.');
    }
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

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Convert to number, removing leading zeros
    const numericValue = value === '' ? 0 : parseInt(value.replace(/^0+/, ''), 10);
    setDiscount(Math.max(0, numericValue));
  };

  // If not authenticated (checked by useAuth), the hook will redirect.
  // We only render the main content if isAuthenticated is true.
  return isAuthenticated ? (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl bg-gray-50 min-h-screen">
      <Header title="Absolute Prosthetics & Orthotics Billing" onLogout={logout} />
      {formError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {formError}</span>
        </div>
      )}
      {discount > itemsTotal && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Warning!</strong>
          <span className="block sm:inline"> Discount cannot exceed the total bill amount. The maximum discount applied will be {itemsTotal}.</span>
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
            onChange={handleDiscountChange}
            min="0"
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
      <div className="mt-8 flex justify-end space-x-4">
        <Button onClick={handleGenerateQuotation} disabled={billItems.length === 0}>
          Generate Quotation
        </Button>
        <Button onClick={handleGenerateBill} disabled={billItems.length === 0}>
          Generate & Download Bill (PDF)
        </Button>
      </div>
      <Footer />
    </div>
  ) : null; // Render nothing if not authenticated (redirect handled by hook) 
} 