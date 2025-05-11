import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Bill from '@/model/Bill';
import { generateBillPdfBuffer } from '@/lib/pdfGeneratorServer';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const bill = await Bill.findById(params.id).lean();
    if (!bill) {
      return new Response('Bill not found', { status: 404 });
    }

    // Generate PDF buffer
    const pdfBuffer = await generateBillPdfBuffer(bill);

    // Safely get serialNo for filename
    let serialNo = 'unknown';
    if (bill && typeof bill === 'object' && !Array.isArray(bill) && 'serialNo' in bill) {
      serialNo = bill.serialNo;
    }

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="bill-${serialNo}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating bill PDF:', error);
    return new Response('Failed to generate PDF', { status: 500 });
  }
} 