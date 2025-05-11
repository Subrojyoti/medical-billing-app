import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Bill from '@/model/Bill';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const serialNo = searchParams.get('serialNo');

    if (!serialNo) {
      return NextResponse.json({ error: 'Serial number is required' }, { status: 400 });
    }

    await connectToDatabase();
    const bills = await Bill.find({ serialNo }).sort({ date: -1 });

    return NextResponse.json(bills);
  } catch (error) {
    console.error('Error searching bills:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 