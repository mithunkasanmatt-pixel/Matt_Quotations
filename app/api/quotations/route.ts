import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { generateQuotationNumber } from '@/lib/quotation-number';

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized session.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const whereClause: any = {};

    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { clientName: { contains: search, mode: 'insensitive' } },
        { quotationTitle: { contains: search, mode: 'insensitive' } },
        { quotationNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const quotations = await prisma.quotation.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
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

    // Format output to match frontend structure
    const formatted = quotations.map((q) => {
      const flatItems: any[] = [];
      q.titles.forEach((t) => {
        t.points.forEach((p) => {
          flatItems.push({
            id: p.id,
            section: t.title,
            title: p.content,
            hours: 0,
            rate: 0,
            amount: 0,
          });
        });
      });

      return {
        id: q.id,
        client_name: q.clientName,
        place: q.place,
        sir_madam: q.sirMadam,
        project_name: q.quotationTitle,
        technology: q.technology,
        duration: q.duration,
        grand_total: Number(q.amount),
        subtotal: Number(q.amount),
        discount_type: 'fixed' as const,
        discount_value: 0,
        discount_amount: 0,
        tax_percentage: 0,
        tax_amount: 0,
        additional_charges: 0,
        quotation_number: q.quotationNumber,
        quotation_date: q.quotationDate.toISOString().split('T')[0],
        valid_until: q.validUntil.toISOString().split('T')[0],
        status: q.status,
        notes: q.notes,
        currency: 'INR',
        created_at: q.createdAt.toISOString(),
        items: flatItems,
      };
    });

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error('Quotations GET API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized session.' },
        { status: 401 }
      );
    }

    const {
      client_name,
      place,
      sir_madam,
      quotation_title,
      technology,
      duration,
      amount,
      titles,
      notes,
    } = await req.json();

    if (!client_name || !place || !sir_madam || !quotation_title || !technology || !duration || amount === undefined) {
      return NextResponse.json(
        { success: false, message: 'Please fill in all required fields.' },
        { status: 400 }
      );
    }

    // 1. Generate Quotation Number (e.g. MATT-QTN-2026-0112)
    const quotationNumber = await generateQuotationNumber(prisma);

    // 2. Set valid until to 30 days out
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    // 3. Create Quotation and nested Titles + Points
    const quotation = await prisma.quotation.create({
      data: {
        clientName: client_name,
        place,
        sirMadam: sir_madam,
        quotationTitle: quotation_title,
        technology,
        duration,
        amount: Number(amount),
        quotationNumber,
        validUntil,
        status: 'Generated',
        notes: notes || '',
        titles: {
          create: (titles || []).map((t: any, tIdx: number) => ({
            title: t.title,
            sortOrder: tIdx,
            points: {
              create: (t.points || []).map((p: string, pIdx: number) => ({
                content: p,
                sortOrder: pIdx,
              })),
            },
          })),
        },
      },
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

    // 4. Log action
    await prisma.activityLog.create({
      data: {
        action: 'Quotation Created',
        description: `Quotation ${quotationNumber} for client ${client_name} was created.`,
        userId: authUser.userId,
        userName: authUser.name,
      },
    });

    // 5. Format response to match frontend
    const flatItems: any[] = [];
    quotation.titles.forEach((t) => {
      t.points.forEach((p) => {
        flatItems.push({
          id: p.id,
          section: t.title,
          title: p.content,
          hours: 0,
          rate: 0,
          amount: 0,
        });
      });
    });

    const formatted = {
      id: quotation.id,
      client_name: quotation.clientName,
      place: quotation.place,
      sir_madam: quotation.sirMadam,
      project_name: quotation.quotationTitle,
      technology: quotation.technology,
      duration: quotation.duration,
      grand_total: Number(quotation.amount),
      subtotal: Number(quotation.amount),
      discount_type: 'fixed' as const,
      discount_value: 0,
      discount_amount: 0,
      tax_percentage: 0,
      tax_amount: 0,
      additional_charges: 0,
      quotation_number: quotation.quotationNumber,
      quotation_date: quotation.quotationDate.toISOString().split('T')[0],
      valid_until: quotation.validUntil.toISOString().split('T')[0],
      status: quotation.status,
      notes: quotation.notes,
      currency: 'INR',
      created_at: quotation.createdAt.toISOString(),
      items: flatItems,
    };

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error('Quotations POST API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
