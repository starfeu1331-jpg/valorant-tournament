import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "REGIE" && session.user.role !== "ADMIN")) {
    return NextResponse.json([], { status: 401 });
  }
  const overlays = await prisma.overlay.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(overlays);
}
