import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const data = await req.json();
  const overlay = await prisma.overlay.create({ data });
  return NextResponse.json(overlay);
}
