import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET one overlay
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const overlay = await prisma.overlay.findUnique({ where: { id: params.id } });
  if (!overlay) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(overlay);
}

// PATCH update overlay
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const data = await req.json();
  const overlay = await prisma.overlay.update({ where: { id: params.id }, data });
  return NextResponse.json(overlay);
}

// PUT update overlay (edit)
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const data = await req.json();
  const overlay = await prisma.overlay.update({ where: { id: params.id }, data });
  return NextResponse.json(overlay);
}

// DELETE overlay
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.overlay.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
