// src/types/index.ts
export interface Patient {
    name: string;
    address: string;
    contact: string;
    gender: string;
    age: string; // Using string for flexibility, could be number if strict validation is added
  }
  
  export interface Product {
    description: string;
    quantity: number;
    price: number;
  }
  
  export interface BillItem extends Product {
    srNo: number;
    amount: number;
  }