import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Quotation from '@/model/Quotation';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { serialNo: string } }
) {
  try {
    await connectToDatabase();
    const { serialNo } = params;

    const quotation = await Quotation.findOne({ serialNo }).lean();
    
    if (!quotation || typeof quotation !== 'object' || Array.isArray(quotation)) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    // Return the quotation data in a format suitable for form auto-fill
    return NextResponse.json({
      patient: {
        name: quotation.patientName,
        address: quotation.patientAddress,
        contact: quotation.patientContact,
        gender: quotation.patientGender,
        age: quotation.patientAge,
        serialNo: quotation.serialNo
      },
      items: (quotation.items || []).map((item: any) => ({
        type: item.type,
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        isPriceInclGst: item.isPriceInclGst,
        date: item.date,
        srNo: item.srNo
      })),
      totalAmount: quotation.totalAmount,
      discount: quotation.discount || 0,
      cgstAmount: quotation.cgstAmount || 0,
      sgstAmount: quotation.sgstAmount || 0
    });
  } catch (error) {
    console.error('Error fetching quotation by serial number:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotation details' },
      { status: 500 }
    );
  }
} 