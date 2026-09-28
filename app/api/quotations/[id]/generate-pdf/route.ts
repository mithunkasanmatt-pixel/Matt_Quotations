import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateQuotationHtml, QuotationTemplateData, QuotationTemplateItem } from '@/lib/templates/quotation-template';
import { generatePdfFromHtml } from '@/lib/pdf-generator';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const qId = parseInt(id);
    if (isNaN(qId)) {
      return new NextResponse('Invalid ID', { status: 400 });
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id: qId },
      include: {
        titles: {
          orderBy: { sortOrder: 'asc' },
          include: {
            points: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!quotation) {
      return new NextResponse('Quotation not found', { status: 404 });
    }

    const items: QuotationTemplateItem[] = [];
    if (quotation.titles) {
      quotation.titles.forEach((t) => {
        if (t.points && t.points.length > 0) {
          t.points.forEach((p) => {
            items.push({
              section: t.title,
              title: p.content,
            });
          });
        } else {
          items.push({
            section: t.title,
            title: t.title,
          });
        }
      });
    }

    const quoteData: QuotationTemplateData = {
      quotation_number: quotation.quotationNumber,
      quotation_date: quotation.quotationDate,
      valid_until: quotation.validUntil,
      client_name: quotation.clientName,
      place: quotation.place,
      sir_madam: quotation.sirMadam,
      project_name: quotation.quotationTitle,
      technology: quotation.technology,
      duration: quotation.duration,
      grand_total: Number(quotation.amount),
      currency: 'INR',
      notes: quotation.notes || undefined,
      items,
    };

    const html = generateQuotationHtml(quoteData);
    const pdfBuffer = await generatePdfFromHtml(html);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Quotation_${quotation.quotationNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('PDF API route error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}