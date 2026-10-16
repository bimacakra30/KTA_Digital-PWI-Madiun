import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SEKRETARIS") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token } = await params;

  const member = await prisma.member.findUnique({
    where: { verifyToken: token },
    select: { id: true, status: true },
  });

  if (!member || member.status !== "DISETUJUI") {
    return NextResponse.json({ error: "Token tidak valid" }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyUrl = `${appUrl}/verifikasi/${token}`;

  const qrBuffer = await QRCode.toBuffer(verifyUrl, {
    type: "png",
    width: 400,
    margin: 2,
    errorCorrectionLevel: "M",
    color: {
      dark: "#065f46",
      light: "#ffffff",
    },
  });

  return new NextResponse(new Uint8Array(qrBuffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
