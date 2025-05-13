import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Bill from '@/model/Bill';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

interface BillDocument {
  _id: string;
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
  date: Date;
  serialNo: string;
  createdAt: Date;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const { id } = params;
    const deleted = await Bill.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete bill' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const { id } = params;
    const bill = await Bill.findById(id).lean() as BillDocument | null;
    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }
    return NextResponse.json({
      _id: bill._id,
      patientName: bill.patientName,
      patientAddress: bill.patientAddress,
      patientContact: bill.patientContact,
      patientAge: bill.patientAge,
      patientGender: bill.patientGender,
      items: bill.items,
      totalAmount: bill.totalAmount,
      date: bill.date,
      serialNo: bill.serialNo,
      createdAt: bill.createdAt,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch bill' }, { status: 500 });
  }
} 