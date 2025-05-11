// src/components/PatientInfoForm.tsx
import React from 'react';
import { Patient } from '@/types';
import Input from './ui/Input'; // Use the styled Input

interface Props {
  patient: Patient;
  onChange: (field: keyof Patient, value: string) => void;
}

const PatientInfoForm: React.FC<Props> = ({ patient, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onChange(name as keyof Patient, value);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6 border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Patient Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Patient Name"
          id="name"
          name="name"
          value={patient.name}
          onChange={handleChange}
          required
        />
        <Input
          label="Contact No."
          id="contact"
          name="contact"
          type="tel" // Use tel type for better mobile UX
          value={patient.contact}
          onChange={handleChange}
          required
        />
        <Input
          label="Address"
          id="address"
          name="address"
          value={patient.address}
          onChange={handleChange}
          className="md:col-span-2" // Span across 2 columns on medium screens
          required
        />
         <div> {/* Wrapper for select */}
           <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
           <select
             id="gender"
             name="gender"
             value={patient.gender}
             onChange={handleChange}
             required
             className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 bg-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
           >
             <option value="">Select Gender</option>
             <option value="Male">Male</option>
             <option value="Female">Female</option>
             <option value="Other">Other</option>
           </select>
        </div>
        <Input
          label="Age"
          id="age"
          name="age"
          type="number" // Use number type if age is always numeric
          min="0"
          value={patient.age}
          onChange={handleChange}
          required
        />
        <Input
          label="Serial No."
          id="serialNo"
          name="serialNo"
          value={patient.serialNo}
          onChange={handleChange}
          required
        />
      </div>
    </div>
  );
};

export default PatientInfoForm;