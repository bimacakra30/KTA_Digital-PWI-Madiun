"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/server/auth";
import { userSchema } from "@/lib/validations";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";


export async function getUsers() {
  await requireRole("SUPERADMIN");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      nama: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));
}


export async function createUser(formData: FormData) {
  await requireRole("SUPERADMIN");

  const raw = {
    nama: formData.get("nama") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    role: formData.get("role") as string,
    isActive: formData.get("isActive") !== "false",
  };

  const validated = userSchema.parse(raw);


  if (validated.role === "SUPERADMIN") {
    throw new Error("Tidak bisa membuat user Super Admin baru.");
  }

  if (!validated.password) {
    throw new Error("Password wajib diisi untuk user baru.");
  }

  const existing = await prisma.user.findUnique({ where: { email: validated.email } });
  if (existing) {
    throw new Error("Email sudah digunakan.");
  }

  const passwordHash = await hash(validated.password, 12);

  await prisma.user.create({
    data: {
      nama: validated.nama,
      email: validated.email,
      passwordHash,
      role: validated.role,
      isActive: validated.isActive,
    },
  });

  revalidatePath("/pengaturan/pengguna");
  return { success: true };
}


export async function updateUser(userId: string, formData: FormData) {
  await requireRole("SUPERADMIN");


  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) throw new Error("User tidak ditemukan.");

  const raw = {
    nama: formData.get("nama") as string,
    email: formData.get("email") as string,
    password: (formData.get("password") as string) || undefined,
    role: formData.get("role") as string,
    isActive: formData.get("isActive") !== "false",
  };

  const validated = userSchema.parse(raw);


  if (targetUser.role === "SUPERADMIN" && validated.role !== "SUPERADMIN") {
    throw new Error("Role Super Admin tidak bisa diubah.");
  }


  const existing = await prisma.user.findUnique({ where: { email: validated.email } });
  if (existing && existing.id !== userId) {
    throw new Error("Email sudah digunakan user lain.");
  }

  const updateData: Record<string, unknown> = {
    nama: validated.nama,
    email: validated.email,
    role: targetUser.role === "SUPERADMIN" ? "SUPERADMIN" : validated.role,
    isActive: validated.isActive,
  };

  if (validated.password) {
    updateData.passwordHash = await hash(validated.password, 12);
  }

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  revalidatePath("/pengaturan/pengguna");
  return { success: true };
}


export async function toggleUserActive(userId: string) {
  await requireRole("SUPERADMIN");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User tidak ditemukan.");


  if (user.role === "SUPERADMIN") {
    throw new Error("Super Admin tidak bisa dinonaktifkan.");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
  });

  revalidatePath("/pengaturan/pengguna");
  return { success: true, isActive: !user.isActive };
}
