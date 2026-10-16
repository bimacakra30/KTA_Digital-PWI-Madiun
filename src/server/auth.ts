import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

/**
 * Helper untuk memeriksa role pengguna di Server Action / Route Handler.
 * Melempar error jika tidak terautentikasi atau tidak memiliki role yang dibutuhkan.
 */
export async function requireRole(...roles: Role[]) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!roles.includes(session.user.role)) {
    throw new Error("Akses ditolak: Anda tidak memiliki izin untuk melakukan aksi ini.");
  }

  return session.user;
}

/**
 * Helper untuk mendapatkan sesi saat ini tanpa redirect.
 * Mengembalikan null jika tidak ada sesi.
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Helper untuk memastikan user terautentikasi, tanpa cek role.
 */
export async function requireAuth() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  return session.user;
}
