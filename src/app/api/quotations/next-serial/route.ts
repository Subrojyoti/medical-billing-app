import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Quotation from '@/model/Quotation';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // First ensure database connection is established
    const connection = await connectToDatabase();
    if (!connection) {
      throw new Error('Failed to connect to database');
    }

    // Now start the session
    const session = await connection.startSession();
    session.startTransaction();
    
    try {
      // Get current month and year
      const now = new Date();
      const currentMonth = String(now.getMonth() + 1).padStart(2, '0'); // 01-12
      const currentYear = String(now.getFullYear()).slice(-2); // Last 2 digits of year
      const prefix = `QT-${currentMonth}/${currentYear}-`;

      // Find the latest quotation with the current month/year prefix
      const latestQuotation = await Quotation.findOne({
        serialNo: { $regex: `^${prefix}` }
      })
      .sort({ serialNo: -1 })
      .session(session);

      let nextNumber = 1;
      if (latestQuotation) {
        // Extract the number part from the latest serial number
        const lastNumber = parseInt(latestQuotation.serialNo.split('-')[2]);
        nextNumber = lastNumber + 1;
      }

      const nextSerialNo = `${prefix}${String(nextNumber).padStart(5, '0')}`;

      // Verify this serial number doesn't exist (double-check)
      const existingQuotation = await Quotation.findOne({ serialNo: nextSerialNo }).session(session);
      if (existingQuotation) {
        // If it exists, increment and try again
        nextNumber++;
        const retrySerialNo = `${prefix}${String(nextNumber).padStart(5, '0')}`;
        await session.commitTransaction();
        return NextResponse.json({ serialNo: retrySerialNo });
      }

      await session.commitTransaction();
      return NextResponse.json({ serialNo: nextSerialNo });
    } catch (error) {
      await session.abortTransaction();
      throw error; // Re-throw to be caught by outer try-catch
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Error generating next quotation serial number:', error);
    return NextResponse.json(
      { error: 'Failed to generate next quotation serial number' },
      { status: 500 }
    );
  }
} 