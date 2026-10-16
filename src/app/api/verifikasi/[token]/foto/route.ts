import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const member = await prisma.member.findUnique({
    where: { verifyToken: token },
    select: { id: true, fotoUrl: true, status: true },
  });

  if (!member || member.status === "DRAFT" || !member.fotoUrl) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.redirect(member.fotoUrl, {
    headers: {
      "Cache-Control": "public, max-age=86400",
    },
  });
}
