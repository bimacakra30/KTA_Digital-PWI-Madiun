"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth";

export async function getAuditLogs(page = 1, perPage = 25) {
  const user = await requireRole("SEKRETARIS", "KETUA", "SUPERADMIN");

  const total = await prisma.approvalLog.count();

  const logs = await prisma.approvalLog.findMany({
    skip: (page - 1) * perPage,
    take: perPage,
    orderBy: { createdAt: "desc" },
    include: {
      member: { select: { nama: true, noAnggota: true } },
    },
  });

  const actorIds = [...new Set(logs.map((l) => l.actorId))];
  const actors = await prisma.user.findMany({
    where: { id: { in: actorIds } },
    select: { id: true, nama: true },
  });
  const actorMap = Object.fromEntries(actors.map((a) => [a.id, a.nama]));

  return {
    logs: logs.map((l) => ({
      id: l.id,
      action: l.action,
      memberNama: l.member.nama,
      memberNoAnggota: l.member.noAnggota,
      actorNama: actorMap[l.actorId] ?? "System",
      note: l.note,
      createdAt: l.createdAt.toISOString(),
    })),
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}
