// src/components/BillTable.tsx
import React from 'react';
import { BillItem } from '@/types';
import Button from './ui/Button'; // Import Button if you add remove functionality

interface Props {
  items: BillItem[];
  onRemoveItem?: (srNo: number) => void; // Optional: Add remove functionality
}

const BillTable: React.FC<Props> = ({ items, onRemoveItem}) => {

  // Helper to format currency
  const formatCurrency = (value: number) => value.toFixed(2);

  // Helper to calculate base price by subtracting GST
  const calculateBasePrice = (totalPrice: number) => {
    // Subtract 2.5% CGST and 2.5% SGST
    const cgst = totalPrice * 0.025;
    const sgst = totalPrice * 0.025;
    return totalPrice - cgst - sgst;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200 overflow-x-auto"> {/* Add overflow for small screens */}
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Bill Details</h2>
      {items.length === 0 ? (
        <p className="text-gray-500 italic">No products added yet.</p>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">SR#</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-5/12">Product Type</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Qty</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-2/12">Price</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-2/12">Amount</th>
              {/* Optional: Add column for remove button */}
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.srNo} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.srNo}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {item.description.split('-').map((detail, index) => (
                    detail.trim() && (
                      <div key={index} className={index === 0 ? "" : "ml-4"}>
                        {index === 0 ? detail.trim() : `• ${detail.trim()}`}
                      </div>
                    )
                  ))}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{item.quantity}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{formatCurrency(calculateBasePrice(item.price))}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-medium">{formatCurrency(calculateBasePrice(item.amount))}</td>
                {/* Optional: Remove button */}
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                  {onRemoveItem && (
                    <Button
                      variant="danger"
                      className="text-xs px-2 py-1" // Smaller button
                      onClick={() => onRemoveItem(item.srNo)}
                    >
                      Remove
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default BillTable;