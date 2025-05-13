import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Quotation from '@/model/Quotation';

// POST method to create a new quotation
export async function POST(request: Request) {
  let requestBody;
  try {
    await connectToDatabase();

    const body = await request.json();
    requestBody = body; // Store body for error logging
    
    const quotationPayload = {
      serialNo: body.patient.serialNo,
      date: new Date(),
      patientName: body.patient.name,
      patientAddress: body.patient.address,
      patientContact: body.patient.contact,
      patientAge: body.patient.age,
      patientGender: body.patient.gender,
      items: body.items.map((item: any) => ({
        type: item.type,
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        isPriceInclGst: item.isPriceInclGst,
        date: item.date ? new Date(item.date) : new Date(),
        srNo: item.srNo
      })),
      totalAmount: body.totalAmount,
      discount: body.discount,
      cgstAmount: body.cgstAmount,
      sgstAmount: body.sgstAmount,
      createdAt: new Date(),
    };

    const quotation = new Quotation(quotationPayload);
    const savedQuotation = await quotation.save();

    return NextResponse.json(savedQuotation, { status: 201 });
  } catch (error) {
    console.error('Error saving quotation:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      body: requestBody // Use the stored request body
    });
    return NextResponse.json(
      { 
        error: 'Failed to save quotation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET method to fetch quotations
export async function GET() {
  try {
    await connectToDatabase();

    const quotations = await Quotation.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()
      .exec();

    const transformedQuotations = quotations.map(quotation => ({
      _id: quotation._id,
      patientName: quotation.patientName,
      patientAddress: quotation.patientAddress,
      patientContact: quotation.patientContact,
      patientAge: quotation.patientAge,
      patientGender: quotation.patientGender,
      totalAmount: quotation.totalAmount,
      date: quotation.date,
      serialNo: quotation.serialNo,
      createdAt: quotation.createdAt,
    }));

    return NextResponse.json(transformedQuotations);
  } catch (error) {
    console.error('Error fetching quotations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotations' },
      { status: 500 }
    );
  }
} 