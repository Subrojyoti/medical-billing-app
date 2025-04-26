// src/types/index.ts
export interface Patient {
    name: string;
    address: string;
    contact: string;
    gender: string;
    age: string; // Using string for flexibility, could be number if strict validation is added
    serialNo: string;
  }
  
  export interface Product {
    type: string;
    description: string;
    quantity: number;
    price: number;
  }
  
  export interface BillItem {
    srNo: number;
    type: string;
    description: string;
    quantity: number;
    price: number;
    amount: number;
    date: string;
  }