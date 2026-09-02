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

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
    });

    if (!user || user.status !== 'active') {
      return NextResponse.json(
        { success: false, message: 'User not found or inactive.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error: any) {
    console.error('Auth check API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
