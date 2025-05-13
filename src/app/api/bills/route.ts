import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Bill from '@/model/Bill';

export const dynamic = 'force-dynamic';

// GET method to fetch bills
export async function GET() {
  try {
    // Connect to database (will use cached connection if available)
    await connectToDatabase();

    // Fetch bills with pagination and sorting
    const bills = await Bill.find()
      .sort({ createdAt: -1 }) // Sort by date, newest first
      .limit(100) // Limit to last 100 bills for performance
      .lean() // Use lean() for better performance when we don't need Mongoose documents
      .exec();

    // Transform the data to remove unnecessary fields
    const transformedBills = bills.map(bill => ({
      _id: bill._id,
      patientName: bill.patientName,
      patientAddress: bill.patientAddress,
      patientContact: bill.patientContact,
      patientAge: bill.patientAge,
      patientGender: bill.patientGender,
      totalAmount: bill.totalAmount,
      date: bill.date,
      serialNo: bill.serialNo,
      createdAt: bill.createdAt,
    }));

    return NextResponse.json(transformedBills);
  } catch (error) {
    console.error('Error fetching bills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bills' },
      { status: 500 }
    );
  }
}

// POST method to create a new bill
export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const body = await request.json();
    // console.log('Received body:', body); // Intentionally keeping debug logs commented for now
    // console.log('Received body.patient:', body.patient); // Intentionally keeping debug logs commented
    
    const amountInWords = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(body.totalAmount).replace('INR', 'Rupees');

    const billPayload = {
      serialNo: body.patient.serialNo,
      date: new Date(),
      patientName: body.patient.name,
      patientAddress: body.patient.address,
      patientContact: body.patient.contact,
      patientAge: body.patient.age,
      patientGender: body.patient.gender,
      items: body.items.map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        rate: item.price,
        amount: item.amount,
      })),
      totalAmount: body.totalAmount,
      amountInWords: amountInWords,
      discount: body.discount,         // Added discount
      cgstAmount: body.cgstAmount,     // Added cgstAmount
      sgstAmount: body.sgstAmount,     // Added sgstAmount
      createdAt: new Date(),
    };

    // console.log('DEBUG: Object constructed for new Bill():', billPayload); // Intentionally keeping debug logs commented

    const bill = new Bill(billPayload);

    // console.log('Saving bill object (Mongoose doc as plain object):', bill.toObject ? bill.toObject() : JSON.parse(JSON.stringify(bill))); // Intentionally keeping debug logs commented

    const savedBill = await bill.save();

    return NextResponse.json(savedBill, { status: 201 });
  } catch (error) {
    console.error('Error saving bill:', error);
    return NextResponse.json(
      { error: 'Failed to save bill' },
      { status: 500 }
    );
  }
} 