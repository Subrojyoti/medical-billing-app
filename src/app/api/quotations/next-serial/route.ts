import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Quotation from '@/model/Quotation';
import Counter from '@/model/Counter';

export async function GET() {
  try {
    await connectToDatabase();

    // Get current month and year
    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0'); // 01-12
    const currentYear = String(now.getFullYear()).slice(-2); // Last 2 digits of year
    const prefix = `QT-${currentMonth}/${currentYear}-`;

    // Atomically increment the counter for this month/year
    const counterDoc = await Counter.findOneAndUpdate(
      { key: prefix },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const nextSerialNo = `${prefix}${String(counterDoc.seq).padStart(5, '0')}`;

    return NextResponse.json({ serialNo: nextSerialNo });
  } catch (error) {
    console.error('Error generating next quotation serial number:', error);
    return NextResponse.json(
      { error: 'Failed to generate next quotation serial number' },
      { status: 500 }
    );
  }
} 