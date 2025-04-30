// src/components/ProductInputForm.tsx
import React, { useState } from 'react';
import { Product } from '@/types';
import Input from './ui/Input';
import Button from './ui/Button';

interface Props {
  onAddProduct: (product: Product) => void;
}

const initialProductState: Product = { 
  type: '', 
  description: '', 
  quantity: 1, 
  price: 0 
};

const GST_RATE = 0.18;
const CGST_RATE = 0.025;
const SGST_RATE = 0.025;

const ProductInputForm: React.FC<Props> = ({ onAddProduct }) => {
  const [product, setProduct] = useState<Product>(initialProductState);
  const [priceExclGst, setPriceExclGst] = useState<string>('');
  const [priceInclGst, setPriceInclGst] = useState<string>('');
  const [editingField, setEditingField] = useState<'incl' | 'excl' | null>(null);
  const [isPriceInclGst, setIsPriceInclGst] = useState<boolean | null>(null);
  const [error, setError] = useState<string>('');

  // Update both price fields when product changes (for reset)
  React.useEffect(() => {
    if (product.price === 0) {
      setPriceExclGst('');
      setPriceInclGst('');
      setEditingField(null);
    }
  }, [product.price]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setError(''); // Clear error on change
    
    if (name === 'description') {
      // Handle multi-line description with bullet points
      const lines = value.split('\n');
      const formattedLines = lines.map((line, index) => {
        if (index === 0) return line;
        return line.startsWith('-') ? line : `- ${line}`;
      });
      setProduct(prev => ({
        ...prev,
        [name]: formattedLines.join('\n')
      }));
    } else {
      setProduct(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) || 0 : value,
      }));
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    setError(''); // Clear error on change
    
    // Add bullet point to first line if it doesn't have one
    let formattedValue = value;
    if (value.trim() && !value.startsWith('-')) {
      formattedValue = `- ${value}`;
    }
    
    setProduct(prev => ({
      ...prev,
      description: formattedValue
    }));
  };

  const handleDescriptionKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const cursorPosition = textarea.selectionStart;
      const textBeforeCursor = textarea.value.substring(0, cursorPosition);
      const textAfterCursor = textarea.value.substring(cursorPosition);
      
      // Only add bullet point if there's text after the cursor
      if (textAfterCursor.trim()) {
        setProduct(prev => ({
          ...prev,
          description: `${textBeforeCursor}\n- ${textAfterCursor}`
        }));
        
        // Set cursor position after the new bullet point
        setTimeout(() => {
          textarea.selectionStart = cursorPosition + 3;
          textarea.selectionEnd = cursorPosition + 3;
        }, 0);
      } else {
        // If no text after cursor, just add a new line with bullet point
        setProduct(prev => ({
          ...prev,
          description: `${textBeforeCursor}\n- `
        }));
        
        // Set cursor position after the new bullet point
        setTimeout(() => {
          textarea.selectionStart = cursorPosition + 3;
          textarea.selectionEnd = cursorPosition + 3;
        }, 0);
      }
    }
  };

  // Handle Excluding GST input
  const handlePriceExclChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPriceExclGst(value);
    if (value) {
      setPriceInclGst('');
      setIsPriceInclGst(false);
    }
  };

  // Handle Including GST input
  const handlePriceInclChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPriceInclGst(value);
    if (value) {
      setPriceExclGst('');
      setIsPriceInclGst(true);
    }
  };

  const handleAddClick = () => {
    if (!product.type.trim()) {
      setError('Product type is required.');
      return;
    }
    if (!product.description.trim()) {
      setError('Product description is required.');
      return;
    }
    if (product.quantity <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }
    
    let price = 0;
    if (isPriceInclGst && priceInclGst) {
      // When price includes GST, use the price directly
      price = parseFloat(priceInclGst);
    } else if (isPriceInclGst === false && priceExclGst) {
      // When price excludes GST, use the price directly
      price = parseFloat(priceExclGst);
    }
    
    if (!price || price <= 0) {
      setError('Price must be greater than zero.');
      return;
    }
    
    const formattedDescription = `${product.type}\n${formatDescriptionWithBullets(product.description)}`;
    onAddProduct({
      ...product,
      price: price,
      isPriceInclGst: isPriceInclGst ?? false,
      description: formattedDescription
    });
    setProduct(initialProductState);
    setPriceExclGst('');
    setPriceInclGst('');
    setIsPriceInclGst(null);
    setError('');
  };

  // Helper function to ensure all lines have bullet points
  const formatDescriptionWithBullets = (description: string): string => {
    const lines = description.split('\n');
    return lines.map(line => {
      // If line is empty, return it as is
      if (!line.trim()) return line;
      // If line already starts with a bullet point, return it as is
      if (line.startsWith('-')) return line;
      // Otherwise, add a bullet point
      return `- ${line}`;
    }).join('\n');
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-4">Add Product</h2>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          <p className="text-sm">{error}</p>
        </div>
      )}
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <div className="sm:col-span-2">
            <Input
              label="Type of Product"
              id="type"
              name="type"
              value={product.type}
              onChange={handleChange}
              required
              className="w-full"
            />
          </div>
          <div>
            <Input
              label="Quantity"
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              value={product.quantity.toString()}
              onChange={handleChange}
              required
              className="w-full"
            />
          </div>
          <div>
            <Input
              label="Price (per unit) (Excluding GST)"
              id="priceExclGst"
              name="priceExclGst"
              type="number"
              min="0.01"
              step="0.01"
              value={priceExclGst}
              onChange={handlePriceExclChange}
              required
              className="w-full"
              disabled={!!priceInclGst}
            />
          </div>
          <div>
            <Input
              label="Price (per unit) (Including GST)"
              id="priceInclGst"
              name="priceInclGst"
              type="number"
              min="0.01"
              step="0.01"
              value={priceInclGst}
              onChange={handlePriceInclChange}
              required
              className="w-full"
              disabled={!!priceExclGst}
            />
          </div>
        </div>
        
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Description
          </label>
          <textarea
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white min-h-[120px] text-base"
            id="description"
            name="description"
            value={product.description}
            onChange={handleDescriptionChange}
            onKeyDown={handleDescriptionKeyDown}
            rows={4}
            required
            placeholder="Enter product details. Press Enter to add bullet points."
            style={{ resize: 'vertical' }}
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button 
            onClick={handleAddClick} 
            variant="primary"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md"
          >
            Add Product to Bill
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductInputForm;