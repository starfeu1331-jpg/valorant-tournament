import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all overlays
export async function GET() {
  const overlays = await prisma.overlay.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(overlays)
}

// POST create overlay
export async function POST(req: Request) {
  const data = await req.json()
  const overlay = await prisma.overlay.create({ data })
  return NextResponse.json(overlay)
}
