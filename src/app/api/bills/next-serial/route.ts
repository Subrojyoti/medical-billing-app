import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Bill from '@/model/Bill';

export async function GET() {
  try {
    await connectToDatabase();

    // Get current month and year
    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0'); // 01-12
    const currentYear = String(now.getFullYear()).slice(-2); // Last 2 digits of year
    const prefix = `${currentMonth}/${currentYear}-`;

    // Find the latest bill with the current month/year prefix
    const latestBill = await Bill.findOne({
      serialNo: { $regex: `^${prefix}` }
    }).sort({ serialNo: -1 });

    let nextNumber = 1; // Default to 1 if no bills exist

    if (latestBill) {
      // Extract the number part from the latest serial number
      const lastNumber = parseInt(latestBill.serialNo.split('-')[1]);
      nextNumber = lastNumber + 1;
    }

    // Format the next serial number with leading zeros
    const nextSerialNo = `${prefix}${String(nextNumber).padStart(5, '0')}`;

    return NextResponse.json({ serialNo: nextSerialNo });
  } catch (error) {
    console.error('Error generating next serial number:', error);
    return NextResponse.json(
      { error: 'Failed to generate next serial number' },
      { status: 500 }
    );
  }
} 