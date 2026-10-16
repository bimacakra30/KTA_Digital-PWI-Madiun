import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/cron/expire
 * Crontab: 0 0 * * * curl -s -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/expire
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const expiredMembers = await prisma.member.findMany({
      where: {
        status: "DISETUJUI",
        deletedAt: null,
        masaBerlaku: { lt: new Date() },
      },
      select: { id: true, noAnggota: true },
    });

    if (expiredMembers.length === 0) {
      return NextResponse.json({
        success: true,
        expired: 0,
        message: "Tidak ada anggota yang perlu diupdate.",
        timestamp: new Date().toISOString(),
      });
    }

    const memberIds = expiredMembers.map((m) => m.id);

    await prisma.member.updateMany({
      where: { id: { in: memberIds } },
      data: { status: "KEDALUWARSA" },
    });

    await prisma.approvalLog.createMany({
      data: memberIds.map((id) => ({
        memberId: id,
        action: "EXPIRE" as const,
        actorId: "SYSTEM",
        note: "Status diubah otomatis karena masa berlaku habis",
      })),
    });

    return NextResponse.json({
      success: true,
      expired: expiredMembers.length,
      members: expiredMembers.map((m) => m.noAnggota),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron expire error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
