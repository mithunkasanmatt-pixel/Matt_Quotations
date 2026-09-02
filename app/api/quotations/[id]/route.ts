import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(
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
      return NextResponse.json({ success: false, message: 'Invalid ID.' }, { status: 400 });
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
      return NextResponse.json({ success: false, message: 'Quotation not found.' }, { status: 404 });
    }

    // Format output
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
    console.error('Quotation GET error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
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
      return NextResponse.json({ success: false, message: 'Invalid ID.' }, { status: 400 });
    }

    const body = await req.json();
    const { status, valid_until, notes } = body;

    const dataToUpdate: any = {};
    if (status) dataToUpdate.status = status;
    if (valid_until) dataToUpdate.validUntil = new Date(valid_until);
    if (notes !== undefined) dataToUpdate.notes = notes;

    const updated = await prisma.quotation.update({
      where: { id: qId },
      data: dataToUpdate,
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

    // Log action
    await prisma.activityLog.create({
      data: {
        action: 'Quotation Updated',
        description: `Quotation ${updated.quotationNumber} was updated to status: ${updated.status}.`,
        userId: authUser.userId,
        userName: authUser.name,
      },
    });

    // Format output
    const flatItems: any[] = [];
    updated.titles.forEach((t) => {
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
      id: updated.id,
      client_name: updated.clientName,
      place: updated.place,
      sir_madam: updated.sirMadam,
      project_name: updated.quotationTitle,
      technology: updated.technology,
      duration: updated.duration,
      grand_total: Number(updated.amount),
      subtotal: Number(updated.amount),
      discount_type: 'fixed' as const,
      discount_value: 0,
      discount_amount: 0,
      tax_percentage: 0,
      tax_amount: 0,
      additional_charges: 0,
      quotation_number: updated.quotationNumber,
      quotation_date: updated.quotationDate.toISOString().split('T')[0],
      valid_until: updated.validUntil.toISOString().split('T')[0],
      status: updated.status,
      notes: updated.notes,
      currency: 'INR',
      created_at: updated.createdAt.toISOString(),
      items: flatItems,
    };

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error('Quotation PUT error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
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
      return NextResponse.json({ success: false, message: 'Invalid ID.' }, { status: 400 });
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id: qId },
    });

    if (!quotation) {
      return NextResponse.json({ success: false, message: 'Quotation not found.' }, { status: 404 });
    }

    await prisma.quotation.delete({
      where: { id: qId },
    });

    // Log action
    await prisma.activityLog.create({
      data: {
        action: 'Quotation Deleted',
        description: `Quotation ${quotation.quotationNumber} for client ${quotation.clientName} was deleted.`,
        userId: authUser.userId,
        userName: authUser.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Quotation deleted successfully.',
    });
  } catch (error: any) {
    console.error('Quotation DELETE error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
