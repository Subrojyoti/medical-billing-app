import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Quotation from '@/model/Quotation';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const { id } = params;
    const deleted = await Quotation.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete quotation' }, { status: 500 });
  }
} 