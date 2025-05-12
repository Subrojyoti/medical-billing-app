import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Quotation from '@/model/Quotation';
import { generateQuotationPdfBuffer } from '@/lib/pdfGeneratorServer';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const quotation = await Quotation.findById(params.id).lean();
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