"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth";
import { generateVerifyToken } from "@/lib/crypto";
import { savePhoto, deleteFile } from "@/lib/storage";
import { memberSchema, revokeSchema, extendSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { MemberStatus } from "@prisma/client";


export async function createMember(formData: FormData) {
  const user = await requireRole("SEKRETARIS");

  const raw = {
    noAnggota: formData.get("noAnggota") as string,
    nama: formData.get("nama") as string,
    jabatan: (formData.get("jabatan") as string) || undefined,
    tempatLahir: (formData.get("tempatLahir") as string) || undefined,
    tanggalLahir: (formData.get("tanggalLahir") as string) || undefined,
    provinsi: (formData.get("provinsi") as string) || undefined,
    kabupaten: (formData.get("kabupaten") as string) || undefined,
    kecamatan: (formData.get("kecamatan") as string) || undefined,
    desa: (formData.get("desa") as string) || undefined,
    rt: (formData.get("rt") as string) || undefined,
    rw: (formData.get("rw") as string) || undefined,
    tanggalBergabung: formData.get("tanggalBergabung") as string,
    masaBerlaku: formData.get("masaBerlaku") as string,
    status: (formData.get("status") as string) || "DISETUJUI",
    consent: formData.get("consent") === "true",
  };

  const validated = memberSchema.parse(raw);


  const fotoFile = formData.get("foto") as File | null;
  let fotoUrl: string | null = null;
  if (fotoFile && fotoFile.size > 0) {
    const filename = `member-${Date.now()}`;
    fotoUrl = await savePhoto(fotoFile, filename);
  }

  const isApproved = validated.status === "DISETUJUI";


  let leadershipPeriodId: string | null = null;
  if (isApproved) {
    const activePeriod = await prisma.leadershipPeriod.findFirst({
      where: { isActive: true },
    });
    if (!activePeriod) {
      throw new Error("Tidak ada periode kepengurusan aktif. Hubungi Super Admin.");
    }
    leadershipPeriodId = activePeriod.id;
  }

  const verifyToken = isApproved ? generateVerifyToken() : null;

  const member = await prisma.member.create({
    data: {
      noAnggota: validated.noAnggota,
      nama: validated.nama,
      fotoUrl,
      jabatan: validated.jabatan || null,
      tempatLahir: validated.tempatLahir || null,
      tanggalLahir: validated.tanggalLahir ? new Date(validated.tanggalLahir) : null,
      provinsi: validated.provinsi || null,
      kabupaten: validated.kabupaten || null,
      kecamatan: validated.kecamatan || null,
      desa: validated.desa || null,
      rt: validated.rt || null,
      rw: validated.rw || null,
      tanggalBergabung: new Date(validated.tanggalBergabung),
      masaBerlaku: new Date(validated.masaBerlaku),
      consentAt: new Date(),
      verifyToken,
      status: validated.status as MemberStatus,
      approvedById: isApproved ? user.id : null,
      approvedAt: isApproved ? new Date() : null,
      leadershipPeriodId,
      createdById: user.id,
    },
  });


  await prisma.approvalLog.create({
    data: {
      memberId: member.id,
      action: "CREATE",
      actorId: user.id,
      note: `Anggota ditambahkan dengan status ${validated.status}`,
    },
  });

  if (isApproved) {
    await prisma.approvalLog.create({
      data: {
        memberId: member.id,
        action: "APPROVE",
        actorId: user.id,
        note: "Disetujui langsung saat input",
      },
    });
  }

  revalidatePath("/anggota");
  revalidatePath("/dashboard");

  return { success: true, memberId: member.id };
}


export async function updateMember(memberId: string, formData: FormData) {
  const user = await requireRole("SEKRETARIS");

  const raw = {
    noAnggota: formData.get("noAnggota") as string,
    nama: formData.get("nama") as string,
    jabatan: (formData.get("jabatan") as string) || undefined,
    tempatLahir: (formData.get("tempatLahir") as string) || undefined,
    tanggalLahir: (formData.get("tanggalLahir") as string) || undefined,
    provinsi: (formData.get("provinsi") as string) || undefined,
    kabupaten: (formData.get("kabupaten") as string) || undefined,
    kecamatan: (formData.get("kecamatan") as string) || undefined,
    desa: (formData.get("desa") as string) || undefined,
    rt: (formData.get("rt") as string) || undefined,
    rw: (formData.get("rw") as string) || undefined,
    tanggalBergabung: formData.get("tanggalBergabung") as string,
    masaBerlaku: formData.get("masaBerlaku") as string,
    status: (formData.get("status") as string) || "DISETUJUI",
    consent: formData.get("consent") === "true",
  };

  const validated = memberSchema.parse(raw);


  const existingMember = await prisma.member.findUnique({
    where: { id: memberId },
  });

  if (!existingMember) {
    throw new Error("Anggota tidak ditemukan.");
  }


  const fotoFile = formData.get("foto") as File | null;
  let fotoUrl: string | undefined;
  if (fotoFile && fotoFile.size > 0) {

    if (existingMember.fotoUrl) {
      await deleteFile(existingMember.fotoUrl);
    }
    const filename = `member-${Date.now()}`;
    fotoUrl = await savePhoto(fotoFile, filename);
  }

  const updateData: Record<string, unknown> = {
    noAnggota: validated.noAnggota,
    nama: validated.nama,
    jabatan: validated.jabatan || null,
    tempatLahir: validated.tempatLahir || null,
    tanggalLahir: validated.tanggalLahir ? new Date(validated.tanggalLahir) : null,
    provinsi: validated.provinsi || null,
    kabupaten: validated.kabupaten || null,
    kecamatan: validated.kecamatan || null,
    desa: validated.desa || null,
    rt: validated.rt || null,
    rw: validated.rw || null,
    tanggalBergabung: new Date(validated.tanggalBergabung),
    masaBerlaku: new Date(validated.masaBerlaku),
  };

  if (fotoUrl) {
    updateData.fotoUrl = fotoUrl;
  }


  const isNewlyApproved =
    existingMember.status === "DRAFT" && validated.status === "DISETUJUI";

  if (isNewlyApproved) {
    const activePeriod = await prisma.leadershipPeriod.findFirst({
      where: { isActive: true },
    });

    if (!activePeriod) {
      throw new Error("Tidak ada periode kepengurusan aktif. Hubungi Super Admin.");
    }

    updateData.status = "DISETUJUI";
    updateData.verifyToken = generateVerifyToken();
    updateData.approvedById = user.id;
    updateData.approvedAt = new Date();
    updateData.leadershipPeriodId = activePeriod.id;
  } else {
    updateData.status = validated.status;
  }

  await prisma.member.update({
    where: { id: memberId },
    data: updateData,
  });


  if (isNewlyApproved) {
    await prisma.approvalLog.create({
      data: {
        memberId,
        action: "APPROVE",
        actorId: user.id,
        note: "Data dilengkapi dan disetujui",
      },
    });
  } else {
    await prisma.approvalLog.create({
      data: {
        memberId,
        action: "UPDATE",
        actorId: user.id,
        note: "Data anggota diperbarui",
      },
    });
  }

  revalidatePath("/anggota");
  revalidatePath("/persetujuan");
  revalidatePath("/dashboard");

  return { success: true };
}


export async function approveMember(memberId: string) {
  const user = await requireRole("SEKRETARIS");

  const member = await prisma.member.findUnique({
    where: { id: memberId },
  });

  if (!member) {
    throw new Error("Anggota tidak ditemukan.");
  }

  if (member.status !== "DRAFT") {
    throw new Error("Hanya anggota berstatus Draft yang bisa disetujui.");
  }

  const activePeriod = await prisma.leadershipPeriod.findFirst({
    where: { isActive: true },
  });

  if (!activePeriod) {
    throw new Error("Tidak ada periode kepengurusan aktif. Hubungi Super Admin.");
  }

  const verifyToken = generateVerifyToken();

  await prisma.member.update({
    where: { id: memberId },
    data: {
      status: "DISETUJUI",
      verifyToken,
      approvedById: user.id,
      approvedAt: new Date(),
      leadershipPeriodId: activePeriod.id,
    },
  });

  await prisma.approvalLog.create({
    data: {
      memberId,
      action: "APPROVE",
      actorId: user.id,
      note: "Anggota disetujui",
    },
  });

  revalidatePath("/anggota");
  revalidatePath("/persetujuan");
  revalidatePath("/dashboard");

  return { success: true };
}


export async function bulkApproveMember(memberIds: string[]) {
  const user = await requireRole("SEKRETARIS");

  const activePeriod = await prisma.leadershipPeriod.findFirst({
    where: { isActive: true },
  });

  if (!activePeriod) {
    throw new Error("Tidak ada periode kepengurusan aktif.");
  }

  let approved = 0;

  for (const memberId of memberIds) {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member || member.status !== "DRAFT") continue;

    const verifyToken = generateVerifyToken();

    await prisma.member.update({
      where: { id: memberId },
      data: {
        status: "DISETUJUI",
        verifyToken,
        approvedById: user.id,
        approvedAt: new Date(),
        leadershipPeriodId: activePeriod.id,
      },
    });

    await prisma.approvalLog.create({
      data: {
        memberId,
        action: "APPROVE",
        actorId: user.id,
        note: "Disetujui massal",
      },
    });

    approved++;
  }

  revalidatePath("/anggota");
  revalidatePath("/persetujuan");
  revalidatePath("/dashboard");

  return { success: true, approved };
}


export async function revokeMember(data: { memberId: string; reason: string }) {
  const user = await requireRole("SEKRETARIS");
  const validated = revokeSchema.parse(data);

  const member = await prisma.member.findUnique({
    where: { id: validated.memberId },
  });

  if (!member) {
    throw new Error("Anggota tidak ditemukan.");
  }

  await prisma.member.update({
    where: { id: validated.memberId },
    data: {
      status: "DICABUT",
      revokedById: user.id,
      revokedAt: new Date(),
      revokeReason: validated.reason,
    },
  });

  await prisma.approvalLog.create({
    data: {
      memberId: validated.memberId,
      action: "REVOKE",
      actorId: user.id,
      note: `Dicabut: ${validated.reason}`,
    },
  });

  revalidatePath("/anggota");
  revalidatePath("/dashboard");

  return { success: true };
}


export async function extendMember(data: { memberId: string; masaBerlaku: string }) {
  const user = await requireRole("SEKRETARIS");
  const validated = extendSchema.parse(data);

  await prisma.member.update({
    where: { id: validated.memberId },
    data: {
      masaBerlaku: new Date(validated.masaBerlaku),

      status: "DISETUJUI",

      revokeReason: null,
      revokedAt: null,
      revokedById: null,
    },
  });

  await prisma.approvalLog.create({
    data: {
      memberId: validated.memberId,
      action: "EXTEND",
      actorId: user.id,
      note: `Masa berlaku diperpanjang hingga ${validated.masaBerlaku}`,
    },
  });

  revalidatePath("/anggota");
  revalidatePath("/dashboard");

  return { success: true };
}


export async function deleteMember(memberId: string) {
  await requireRole("SEKRETARIS");


  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: { fotoUrl: true },
  });


  if (member?.fotoUrl) {
    await deleteFile(member.fotoUrl);
  }


  await prisma.approvalLog.deleteMany({
    where: { memberId },
  });

  await prisma.member.delete({
    where: { id: memberId },
  });

  revalidatePath("/anggota");
  revalidatePath("/persetujuan");
  revalidatePath("/dashboard");

  return { success: true };
}


export async function bulkDeleteMembers(memberIds: string[]) {
  await requireRole("SEKRETARIS");

  let deleted = 0;

  for (const memberId of memberIds) {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member) continue;


    if (member.fotoUrl) {
      await deleteFile(member.fotoUrl);
    }

    await prisma.approvalLog.deleteMany({
      where: { memberId },
    });

    await prisma.member.delete({
      where: { id: memberId },
    });

    deleted++;
  }

  revalidatePath("/anggota");
  revalidatePath("/persetujuan");
  revalidatePath("/dashboard");

  return { success: true, deleted };
}
