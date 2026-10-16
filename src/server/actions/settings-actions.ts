"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth";
import { compare, hash } from "bcryptjs";

export async function getUserSettings() {
  const sessionUser = await requireRole("SEKRETARIS", "KETUA", "SUPERADMIN");

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      nama: true,
      email: true,
      role: true,
      batchDeleteEnabled: true,
    },
  });

  if (!user) throw new Error("User tidak ditemukan.");
  return user;
}

export async function updateProfile(data: { nama: string; email: string }) {
  const sessionUser = await requireRole("SEKRETARIS", "KETUA", "SUPERADMIN");

  if (!data.nama.trim()) throw new Error("Nama tidak boleh kosong.");
  if (!data.email.trim()) throw new Error("Email tidak boleh kosong.");

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing && existing.id !== sessionUser.id) {
    throw new Error("Email sudah digunakan oleh akun lain.");
  }

  await prisma.user.update({
    where: { id: sessionUser.id },
    data: {
      nama: data.nama.trim(),
      email: data.email.trim().toLowerCase(),
    },
  });

  return { success: true };
}

export async function changePassword(data: { currentPassword: string; newPassword: string }) {
  const sessionUser = await requireRole("SEKRETARIS", "KETUA", "SUPERADMIN");

  if (!data.currentPassword) throw new Error("Password lama wajib diisi.");
  if (!data.newPassword || data.newPassword.length < 6) {
    throw new Error("Password baru minimal 6 karakter.");
  }

  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user) throw new Error("User tidak ditemukan.");

  const valid = await compare(data.currentPassword, user.passwordHash);
  if (!valid) throw new Error("Password lama salah.");

  const newHash = await hash(data.newPassword, 12);

  await prisma.user.update({
    where: { id: sessionUser.id },
    data: { passwordHash: newHash },
  });

  return { success: true };
}

export async function toggleBatchDelete(enabled: boolean) {
  const sessionUser = await requireRole("SEKRETARIS");

  await prisma.user.update({
    where: { id: sessionUser.id },
    data: { batchDeleteEnabled: enabled },
  });

  return { success: true, enabled };
}
