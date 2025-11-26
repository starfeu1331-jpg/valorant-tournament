import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { isActive } = await req.json();
  const overlay = await prisma.overlay.update({
    where: { id: params.id },
    data: { isActive },
  });
  return NextResponse.json(overlay);
}
