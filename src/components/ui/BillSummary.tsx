// src/components/BillSummary.tsx
import React from 'react';

interface Props {
  itemsTotal: number;
  cgstAmount: number;
  sgstAmount: number;
  totalAmount: number;
  cgstRate: number;
  sgstRate: number;
  discount: number;
}

const BillSummary: React.FC<Props> = ({ 
  itemsTotal, 
  cgstAmount, 
  sgstAmount, 
  totalAmount, 
  cgstRate, 
  sgstRate, 
  discount 
}) => {
  const formatCurrency = (value: number) => value.toFixed(2);
  const cgstRatePercent = (cgstRate * 100).toFixed(1);
  const sgstRatePercent = (sgstRate * 100).toFixed(1);

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow mt-6 border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Summary</h2>
      <div className="space-y-2">
        <div className="flex justify-between text-gray-600">
          <span>Items Total:</span>
          <span>₹{formatCurrency(itemsTotal)}</span>
        </div>
        <div className="flex justify-between text-red-600">
          <span>Discount:</span>
          <span>-₹{formatCurrency(discount)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>CGST ({cgstRatePercent}%):</span>
          <span>₹{formatCurrency(cgstAmount)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>SGST ({sgstRatePercent}%):</span>
          <span>₹{formatCurrency(sgstAmount)}</span>
        </div>
        <hr className="my-2 border-gray-300" />
        <div className="flex justify-between text-gray-900 font-bold text-lg">
          <span>Total Amount Due:</span>
          <span>₹{formatCurrency(totalAmount)}</span>
        </div>
      </div>
    </div>
  );
};

export default BillSummary;