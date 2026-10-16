"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth";
import { MemberStatus } from "@prisma/client";

export interface MemberListParams {
  search?: string;
  status?: string;
  kecamatan?: string;
  desa?: string;
  page?: number;
  perPage?: number;
}

export interface MemberListResult {
  members: {
    id: string;
    noAnggota: string;
    nama: string;
    fotoUrl: string | null;
    jabatan: string | null;
    tempatLahir: string | null;
    kecamatan: string | null;
    desa: string | null;
    status: MemberStatus;
    tanggalBergabung: string;
    masaBerlaku: string;
    createdAt: string;
  }[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export async function getMembers(params: MemberListParams): Promise<MemberListResult> {
  await requireRole("SEKRETARIS", "KETUA");

  const page = params.page ?? 1;
  const perPage = params.perPage ?? 15;
  const skip = (page - 1) * perPage;


  const where: Record<string, unknown> = {};
  const andConditions: Record<string, unknown>[] = [];

  if (params.search) {
    andConditions.push({
      OR: [
        { nama: { contains: params.search } },
        { noAnggota: { contains: params.search } },
        { tempatLahir: { contains: params.search } },
        { jabatan: { contains: params.search } },
        { desa: { contains: params.search } },
        { kecamatan: { contains: params.search } },
      ],
    });
  }

  if (params.status && params.status !== "SEMUA") {
    const now = new Date();
    if (params.status === "DISETUJUI") {

      where.status = "DISETUJUI";
      where.masaBerlaku = { gte: now };
    } else if (params.status === "KEDALUWARSA") {

      andConditions.push({
        OR: [
          { status: "KEDALUWARSA" as MemberStatus },
          { status: "DISETUJUI" as MemberStatus, masaBerlaku: { lt: now } },
        ],
      });
    } else {
      where.status = params.status as MemberStatus;
    }
  }

  if (params.kecamatan) {
    where.kecamatan = { contains: params.kecamatan };
  }

  if (params.desa) {
    where.desa = { contains: params.desa };
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  const [members, total] = await Promise.all([
    prisma.member.findMany({
      where,
      skip,
      take: perPage,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        noAnggota: true,
        nama: true,
        fotoUrl: true,
        jabatan: true,
        tempatLahir: true,
        kecamatan: true,
        desa: true,
        status: true,
        tanggalBergabung: true,
        masaBerlaku: true,
        createdAt: true,
      },
    }),
    prisma.member.count({ where }),
  ]);

  return {
    members: members.map((m) => ({
      ...m,
      tanggalBergabung: m.tanggalBergabung.toISOString(),
      masaBerlaku: m.masaBerlaku.toISOString(),
      createdAt: m.createdAt.toISOString(),
    })),
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

export async function getMemberDetail(id: string) {
  await requireRole("SEKRETARIS", "KETUA");

  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      leadershipPeriod: {
        select: { namaKetua: true, periodeMulai: true, periodeSelesai: true, tandaTanganUrl: true },
      },
      logs: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!member) return null;

  return {
    ...member,
    tanggalBergabung: member.tanggalBergabung.toISOString(),
    masaBerlaku: member.masaBerlaku.toISOString(),
    tanggalLahir: member.tanggalLahir?.toISOString() ?? null,
    consentAt: member.consentAt?.toISOString() ?? null,
    approvedAt: member.approvedAt?.toISOString() ?? null,
    revokedAt: member.revokedAt?.toISOString() ?? null,
    createdAt: member.createdAt.toISOString(),
    updatedAt: member.updatedAt.toISOString(),

    leadershipPeriod: member.leadershipPeriod
      ? {
          namaKetua: member.leadershipPeriod.namaKetua,
          periodeMulai: member.leadershipPeriod.periodeMulai.toISOString(),
          periodeSelesai: member.leadershipPeriod.periodeSelesai?.toISOString() ?? null,
          tandaTanganUrl: member.leadershipPeriod.tandaTanganUrl,
        }
      : null,
    logs: member.logs.map((log) => ({
      ...log,
      createdAt: log.createdAt.toISOString(),
    })),
  };
}


export interface DraftMemberListParams {
  search?: string;
  page?: number;
  perPage?: number;
}

export interface DraftMemberItem {
  id: string;
  noAnggota: string;
  nama: string;
  fotoUrl: string | null;
  jabatan: string | null;
  kecamatan: string | null;
  desa: string | null;
  tanggalBergabung: string;
  masaBerlaku: string;
  createdAt: string;
}

export interface DraftMemberListResult {
  members: DraftMemberItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export async function getDraftMembers(
  params: DraftMemberListParams
): Promise<DraftMemberListResult> {
  await requireRole("SEKRETARIS");

  const page = params.page ?? 1;
  const perPage = params.perPage ?? 15;
  const skip = (page - 1) * perPage;

  const where: Record<string, unknown> = {

    status: "DRAFT" as MemberStatus,
  };

  if (params.search) {
    where.AND = [
      {
        OR: [
          { nama: { contains: params.search } },
          { noAnggota: { contains: params.search } },
          { jabatan: { contains: params.search } },
        ],
      },
    ];
  }

  const [members, total] = await Promise.all([
    prisma.member.findMany({
      where,
      skip,
      take: perPage,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        noAnggota: true,
        nama: true,
        fotoUrl: true,
        jabatan: true,
        kecamatan: true,
        desa: true,
        tanggalBergabung: true,
        masaBerlaku: true,
        createdAt: true,
      },
    }),
    prisma.member.count({ where }),
  ]);

  return {
    members: members.map((m) => ({
      ...m,
      tanggalBergabung: m.tanggalBergabung.toISOString(),
      masaBerlaku: m.masaBerlaku.toISOString(),
      createdAt: m.createdAt.toISOString(),
    })),
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}
