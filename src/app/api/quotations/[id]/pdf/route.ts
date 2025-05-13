import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Quotation from '@/model/Quotation';
import { generateQuotationPdfBuffer } from '@/lib/pdfGeneratorServer';

export const dynamic = 'force-dynamic';

// Define the Quotation interface based on the schema
interface QuotationDocument {
  _id: string;
  serialNo: string;
  date: Date;
  patientName: string;
  patientAddress: string;
  patientContact: string;
  patientAge: string;
  patientGender: string;
  items: Array<{
    description: string;
    quantity: number;
    price: number;
    isPriceInclGst: boolean;
    date: Date;
    srNo: number;
  }>;
  totalAmount: number;
  discount: number;
  cgstAmount: number;
  sgstAmount: number;
  createdAt: Date;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const quotation = await Quotation.findById(params.id).lean() as QuotationDocument | null;
    if (!quotation) {
      return new Response('Quotation not found', { status: 404 });
    }

    // Generate PDF buffer
    const pdfBuffer = await generateQuotationPdfBuffer(quotation);

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="quotation-${quotation.serialNo}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating quotation PDF:', error);
    return new Response('Failed to generate PDF', { status: 500 });
  }
} 