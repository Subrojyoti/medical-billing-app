// src/components/ProductInputForm.tsx
import React, { useState } from 'react';
import { Product } from '@/types';
import Input from './ui/Input';
import Button from './ui/Button';

interface Props {
  onAddProduct: (product: Product) => void;
}

const initialProductState: Product = { description: '', quantity: 1, price: 0 };

const ProductInputForm: React.FC<Props> = ({ onAddProduct }) => {
  const [product, setProduct] = useState<Product>(initialProductState);
  const [error, setError] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setError(''); // Clear error on change
    setProduct(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value, // Handle number conversion
    }));
  };

  const handleAddClick = () => {
    // Basic Validation
    if (!product.description.trim()) {
      setError('Product description is required.');
      return;
    }
    if (product.quantity <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }
     if (product.price <= 0) {
      setError('Price must be greater than zero.');
      return;
    }

    onAddProduct(product);
    setProduct(initialProductState); // Reset form after adding
    setError(''); // Clear error on success
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6 border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Add Product</h2>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end"> {/* Use items-end to align button */}
        <div className="sm:col-span-2"> {/* Description takes more space */}
          <Input
            label="Product Description"
            id="description"
            name="description"
            value={product.description}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Input
            label="Quantity"
            id="quantity"
            name="quantity"
            type="number"
            min="1"
            value={product.quantity.toString()} // Input value must be string
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Input
            label="Price (per unit)"
            id="price"
            name="price"
            type="number"
            min="0.01"
            step="0.01" // Allow cents
            value={product.price.toString()} // Input value must be string
            onChange={handleChange}
            required
          />
        </div>
      </div>
       <div className="mt-4 flex justify-end"> {/* Add button below inputs */}
          <Button onClick={handleAddClick} variant="secondary">
            Add Product to Bill
          </Button>
        </div>
    </div>
  );
};

export default ProductInputForm;