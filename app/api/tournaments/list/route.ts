import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const tournaments = await prisma.tournament.findMany({ orderBy: { startDate: 'desc' } });
  return NextResponse.json(tournaments);
}
