import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized session.' },
        { status: 401 }
      );
    }

    const activities = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return NextResponse.json({
      success: true,
      data: activities
    });
  } catch (error: any) {
    console.error('Activities GET error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
