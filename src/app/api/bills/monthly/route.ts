import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Bill from '@/model/Bill';
import { startOfMonth, endOfMonth } from 'date-fns';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    if (!month) {
      return NextResponse.json({ error: 'Month is required' }, { 
        status: 400,
        headers: {
          'Cache-Control': 'no-store'
        }
      });
    }

    const [year, monthNum] = month.split('-').map(Number);
    const startDate = startOfMonth(new Date(year, monthNum - 1));
    const endDate = endOfMonth(new Date(year, monthNum - 1));

    await connectToDatabase();
    const bills = await Bill.find({
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    }).sort({ date: -1 });

    return NextResponse.json(bills, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error searching monthly bills:', error);
    return NextResponse.json({ error: 'Internal server error' }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  }
} 