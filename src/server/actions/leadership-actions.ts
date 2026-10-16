"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth";
import { leadershipPeriodSchema } from "@/lib/validations";
import { saveSignature, deleteFile } from "@/lib/storage";
import { revalidatePath } from "next/cache";


export async function getLeadershipPeriods() {
  await requireRole("SEKRETARIS");

  const periods = await prisma.leadershipPeriod.findMany({
    orderBy: { periodeMulai: "desc" },
    include: { _count: { select: { members: true } } },
  });

  return periods.map((p) => ({
    id: p.id,
    namaKetua: p.namaKetua,
    jabatan: p.jabatan,
    tandaTanganUrl: p.tandaTanganUrl,
    periodeMulai: p.periodeMulai.toISOString(),
    periodeSelesai: p.periodeSelesai?.toISOString() ?? null,
    isActive: p.isActive,
    memberCount: p._count.members,
  }));
}


export async function createLeadershipPeriod(formData: FormData) {
  await requireRole("SEKRETARIS");

  const raw = {
    namaKetua: formData.get("namaKetua") as string,
    jabatan: formData.get("jabatan") as string,
    periodeMulai: formData.get("periodeMulai") as string,
    periodeSelesai: (formData.get("periodeSelesai") as string) || undefined,
    isActive: formData.get("isActive") === "true",
  };

  const validated = leadershipPeriodSchema.parse(raw);


  if (validated.isActive) {
    await prisma.leadershipPeriod.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });
  }


  const ttdFile = formData.get("tandaTangan") as File | null;
  let tandaTanganUrl: string | null = null;
  if (ttdFile && ttdFile.size > 0) {
    const filename = `ttd-${Date.now()}`;
    tandaTanganUrl = await saveSignature(ttdFile, filename);
  }

  await prisma.leadershipPeriod.create({
    data: {
      namaKetua: validated.namaKetua,
      jabatan: validated.jabatan,
      periodeMulai: new Date(validated.periodeMulai),
      periodeSelesai: validated.periodeSelesai ? new Date(validated.periodeSelesai) : null,
      isActive: validated.isActive,
      tandaTanganUrl,
    },
  });

  revalidatePath("/pengaturan/periode");
  return { success: true };
}


export async function updateLeadershipPeriod(periodId: string, formData: FormData) {
  await requireRole("SEKRETARIS");

  const raw = {
    namaKetua: formData.get("namaKetua") as string,
    jabatan: formData.get("jabatan") as string,
    periodeMulai: formData.get("periodeMulai") as string,
    periodeSelesai: (formData.get("periodeSelesai") as string) || undefined,
    isActive: formData.get("isActive") === "true",
  };

  const validated = leadershipPeriodSchema.parse(raw);

  if (validated.isActive) {
    await prisma.leadershipPeriod.updateMany({
      where: { isActive: true, id: { not: periodId } },
      data: { isActive: false },
    });
  }

  const ttdFile = formData.get("tandaTangan") as File | null;
  let tandaTanganUrl: string | undefined;
  if (ttdFile && ttdFile.size > 0) {

    const existing = await prisma.leadershipPeriod.findUnique({
      where: { id: periodId },
      select: { tandaTanganUrl: true },
    });
    if (existing?.tandaTanganUrl) {
      await deleteFile(existing.tandaTanganUrl);
    }
    const filename = `ttd-${Date.now()}`;
    tandaTanganUrl = await saveSignature(ttdFile, filename);
  }

  const updateData: Record<string, unknown> = {
    namaKetua: validated.namaKetua,
    jabatan: validated.jabatan,
    periodeMulai: new Date(validated.periodeMulai),
    periodeSelesai: validated.periodeSelesai ? new Date(validated.periodeSelesai) : null,
    isActive: validated.isActive,
  };

  if (tandaTanganUrl) {
    updateData.tandaTanganUrl = tandaTanganUrl;
  }

  await prisma.leadershipPeriod.update({
    where: { id: periodId },
    data: updateData,
  });

  revalidatePath("/pengaturan/periode");
  return { success: true };
}


export async function deleteLeadershipPeriod(periodId: string) {
  await requireRole("SEKRETARIS");

  const count = await prisma.member.count({ where: { leadershipPeriodId: periodId } });
  if (count > 0) {
    throw new Error(`Tidak bisa menghapus periode yang masih memiliki ${count} anggota.`);
  }

  await prisma.leadershipPeriod.delete({ where: { id: periodId } });

  revalidatePath("/pengaturan/periode");
  return { success: true };
}
