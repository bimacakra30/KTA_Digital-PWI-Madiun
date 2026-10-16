import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/verifikasi/[token]/ttd — Proxy tanda tangan ketua via token.
 * Redirect ke URL publik R2.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const member = await prisma.member.findUnique({
    where: { verifyToken: token },
    select: {
      status: true,
      leadershipPeriod: {
        select: { tandaTanganUrl: true },
      },
    },
  });

  if (!member || member.status === "DRAFT") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ttdUrl = member.leadershipPeriod?.tandaTanganUrl;
  if (!ttdUrl) {
    return NextResponse.json({ error: "No signature" }, { status: 404 });
  }

  // tandaTanganUrl sekarang full URL R2
  return NextResponse.redirect(ttdUrl, {
    headers: {
      "Cache-Control": "public, max-age=86400",
    },
  });
}
