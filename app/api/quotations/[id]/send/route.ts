import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

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

    const body = await req.json();
    const { email, subject } = body;

    const quotation = await prisma.quotation.findUnique({
      where: { id: qId },
    });

    if (!quotation) {
      return NextResponse.json({ success: false, message: 'Quotation not found.' }, { status: 404 });
    }

    // Update quotation status to Sent
    await prisma.quotation.update({
      where: { id: qId },
      data: { status: 'Sent' },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'Quotation Sent',
        description: `Quotation ${quotation.quotationNumber} emailed to ${email || quotation.clientName}.`,
        userId: authUser.userId,
        userName: authUser.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Email sent and status updated to Sent.',
    });
  } catch (error: any) {
    console.error('Quotation send error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}