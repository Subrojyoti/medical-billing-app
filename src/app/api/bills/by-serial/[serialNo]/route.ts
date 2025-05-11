import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Bill from '@/model/Bill';

// Define the Bill interface based on the schema
interface BillDocument {
  serialNo: string;
  patientName: string;
  patientAddress: string;
  patientContact: string;
  patientAge: string;
  patientGender: string;
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  totalAmount: number;
  discount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
}

export async function GET(
  request: Request,
  { params }: { params: { serialNo: string } }
) {
  try {
    await connectToDatabase();
    const { serialNo } = params;

    const bill = await Bill.findOne({ serialNo }).lean() as BillDocument | null;
    
    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    // Return the bill data in a format suitable for form auto-fill
    return NextResponse.json({
      patient: {
        name: bill.patientName,
        address: bill.patientAddress,
        contact: bill.patientContact,
        gender: bill.patientGender,
        age: bill.patientAge,
        serialNo: bill.serialNo
      },
      items: bill.items,
      totalAmount: bill.totalAmount,
      discount: bill.discount || 0,
      cgstAmount: bill.cgstAmount || 0,
      sgstAmount: bill.sgstAmount || 0
    });
  } catch (error) {
    console.error('Error fetching bill by serial number:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bill details' },
      { status: 500 }
    );
  }
} 