import { NextRequest, NextResponse } from 'next/server';
import { generateInvoiceHtml, InvoiceTemplateData } from '@/lib/templates/invoice-template';
import { generatePdfFromHtml } from '@/lib/pdf-generator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clientName = 'Client Name',
      place = 'City',
      invoiceDate = '',
      dueDate = '',
      referenceQuotationDate = '',
      phase1Scope = 'Original Quotation Scope',
      phase1Amount = 0,
      phase2Scope = 'Additional Work Features',
      phase2Amount = 0,
      currency = 'INR',
    } = body;

    const invoiceData: InvoiceTemplateData = {
      clientName,
      place,
      invoiceDate,
      dueDate,
      referenceQuotationDate,
      phase1Scope,
      phase1Amount: Number(phase1Amount) || 0,
      phase2Scope,
      phase2Amount: Number(phase2Amount) || 0,
      currency,
    };

    const html = generateInvoiceHtml(invoiceData);
    const pdfBuffer = await generatePdfFromHtml(html);

    const cleanName = clientName.replace(/[^a-zA-Z0-9]/g, '_');

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Invoice_${cleanName}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('Invoice PDF API error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
