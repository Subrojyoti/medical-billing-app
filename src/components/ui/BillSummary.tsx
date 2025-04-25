// src/components/BillSummary.tsx
import React from 'react';

interface Props {
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
  gstRate: number;
}

const BillSummary: React.FC<Props> = ({ subtotal, gstAmount, totalAmount, gstRate }) => {

  const formatCurrency = (value: number) => value.toFixed(2);
  const gstRatePercent = (gstRate * 100).toFixed(1); // Show GST rate used

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow mt-6 border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Summary</h2>
      <div className="space-y-2">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal:</span>
          <span>₹{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>GST ({gstRatePercent}%):</span>
          <span>₹{formatCurrency(gstAmount)}</span>
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