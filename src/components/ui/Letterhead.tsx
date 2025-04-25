import React from 'react';
import Image from 'next/image';

interface Props {
  shopName: string;
  shopAddress: string;
  shopContact: string;
  shopEmail: string;
  shopGst: string;
}

const Letterhead: React.FC<Props> = ({
  shopName,
  shopAddress,
  shopContact,
  shopEmail,
  shopGst,
}) => {
  return (
    <div className="relative flex justify-between items-start p-4 border-b border-gray-200">
      {/* Company Info */}
      <div className="flex-grow">
        <h1 className="text-2xl font-bold text-gray-900">{shopName}</h1>
        <p className="text-sm text-gray-600 mt-1">{shopAddress}</p>
        <p className="text-sm text-gray-600 mt-1">
          CELL: {shopContact} {shopEmail}
        </p>
        <p className="text-sm text-gray-600 mt-1">GST NO: {shopGst}</p>
      </div>
      
      {/* Logo */}
      <div className="flex-shrink-0 ml-4">
        <div className="relative w-[50px] h-[50px] overflow-hidden rounded-full">
          <Image
            src="/ABSOLUTE_PROSTHETICS_AND_ORTHOTICS_logo.png"
            alt="Company Logo"
            width={50}
            height={50}
            className="object-cover"
            style={{ aspectRatio: '1/1' }}
          />
        </div>
      </div>
    </div>
  );
};

export default Letterhead; 