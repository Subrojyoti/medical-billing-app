import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Bill from '@/model/Bill';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const serialNo = searchParams.get('serialNo');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!serialNo) {
      return NextResponse.json({ error: 'Serial number is required' }, { status: 400 });
    }

    await connectToDatabase();
    
    // Build the query object
    const query: any = { serialNo };
    
    // Add date range if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        // Set start date to beginning of day
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        // Set end date to beginning of next day to include entire end date
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1); // Move to next day
        end.setHours(0, 0, 0, 0);
        query.date.$lt = end; // Use $lt instead of $lte to exclude the next day
      }
    }

    const bills = await Bill.find(query).sort({ date: -1 });

    return NextResponse.json(bills);
  } catch (error) {
    console.error('Error searching bills:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 