// src/components/ui/Button.tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}

const Button: React.FC<ButtonProps> = ({ children, className, variant = 'primary', ...props }) => {
  const baseStyle = "inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2";
  let variantStyle = "";

  switch (variant) {
    case 'primary':
      variantStyle = "text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500";
      break;
    case 'secondary':
       variantStyle = "text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:ring-indigo-500";
       break;
    case 'danger':
       variantStyle = "text-white bg-red-600 hover:bg-red-700 focus:ring-red-500";
       break;
  }

  return (
    <button
      type="button" // Default type
      {...props}
      className={`${baseStyle} ${variantStyle} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;