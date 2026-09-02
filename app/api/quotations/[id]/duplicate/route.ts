import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { generateQuotationNumber } from '@/lib/quotation-number';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized session.' }, { status: 401 });
    }

    const { id } = await params;
    const qId = parseInt(id);
    if (isNaN(qId)) {
      return NextResponse.json({ success: false, message: 'Invalid quotation ID.' }, { status: 400 });
    }

    const original = await prisma.quotation.findUnique({
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

    if (!original) {
      return NextResponse.json({ success: false, message: 'Quotation not found.' }, { status: 404 });
    }

    // Generate new sequential quotation number (e.g. MATT-QTN-2026-0112)
    const quotationNumber = await generateQuotationNumber(prisma);

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    const duplicate = await prisma.quotation.create({
      data: {
        clientName: original.clientName,
        place: original.place,
        sirMadam: original.sirMadam,
        quotationTitle: `${original.quotationTitle} (Copy)`,
        technology: original.technology,
        duration: original.duration,
        amount: original.amount,
        quotationNumber,
        validUntil,
        status: 'Draft',
        notes: original.notes,
        titles: {
          create: original.titles.map((t, tIdx) => ({
            title: t.title,
            sortOrder: tIdx,
            points: {
              create: t.points.map((p, pIdx) => ({
                content: p.content,
                sortOrder: pIdx,
              })),
            },
          })),
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'Quotation Duplicated',
        description: `Quotation ${original.quotationNumber} duplicated as ${quotationNumber}.`,
        userId: authUser.userId,
        userName: authUser.name,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: duplicate.id,
        quotation_number: duplicate.quotationNumber,
      },
    });
  } catch (error: any) {
    console.error('Quotation duplicate error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}