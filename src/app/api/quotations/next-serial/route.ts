import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Quotation from '@/model/Quotation';

export async function GET() {
  try {
    await connectToDatabase();

    // Get current month and year
    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0'); // 01-12
    const currentYear = String(now.getFullYear()).slice(-2); // Last 2 digits of year
    const prefix = `QT-${currentMonth}/${currentYear}-`;

    // Find the latest quotation with the current month/year prefix
    const latestQuotation = await Quotation.findOne({
      serialNo: { $regex: `^${prefix}` }
    }).sort({ serialNo: -1 });

    let nextNumber = 1;
    if (latestQuotation) {
      // Extract the number part from the latest serial number
      const lastNumber = parseInt(latestQuotation.serialNo.split('-')[2]);
      nextNumber = lastNumber + 1;
    }

    const nextSerialNo = `${prefix}${String(nextNumber).padStart(5, '0')}`;

    return NextResponse.json({ serialNo: nextSerialNo });
  } catch (error) {
    console.error('Error generating next quotation serial number:', error);
    return NextResponse.json(
      { error: 'Failed to generate next quotation serial number' },
      { status: 500 }
    );
  }
} 