import { z } from "zod";

/**
 * Schema validasi login.
 */
export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

/**
 * Schema validasi anggota.
 */
export const memberSchema = z.object({
  noAnggota: z.string().min(1, "Nomor anggota wajib diisi"),
  nama: z.string().min(1, "Nama wajib diisi"),
  jabatan: z.string().optional(),
  tempatLahir: z.string().optional(),
  tanggalLahir: z.string().optional(),
  provinsi: z.string().optional(),
  kabupaten: z.string().optional(),
  kecamatan: z.string().optional(),
  desa: z.string().optional(),
  rt: z.string().optional(),
  rw: z.string().optional(),
  tanggalBergabung: z.string().min(1, "Tanggal bergabung wajib diisi"),
  masaBerlaku: z.string().min(1, "Masa berlaku wajib diisi"),
  status: z.enum(["DRAFT", "DISETUJUI"]),
  consent: z.boolean().refine((val) => val === true, {
    message: "Persetujuan (consent) wajib dicentang",
  }),
});

/**
 * Schema validasi cabut anggota.
 */
export const revokeSchema = z.object({
  memberId: z.string().min(1),
  reason: z.string().min(1, "Alasan pencabutan wajib diisi"),
});

/**
 * Schema validasi perpanjang masa berlaku.
 */
export const extendSchema = z.object({
  memberId: z.string().min(1),
  masaBerlaku: z.string().min(1, "Tanggal masa berlaku baru wajib diisi"),
});

/**
 * Schema validasi periode kepengurusan.
 */
export const leadershipPeriodSchema = z.object({
  namaKetua: z.string().min(1, "Nama ketua wajib diisi"),
  jabatan: z.string().min(1, "Jabatan wajib diisi"),
  periodeMulai: z.string().min(1, "Tanggal mulai wajib diisi"),
  periodeSelesai: z.string().optional(),
  isActive: z.boolean(),
});

/**
 * Schema validasi user (akun).
 */
export const userSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter").optional(),
  role: z.enum(["SEKRETARIS", "KETUA", "SUPERADMIN"]),
  isActive: z.boolean().default(true),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type MemberInput = z.infer<typeof memberSchema>;
export type RevokeInput = z.infer<typeof revokeSchema>;
export type ExtendInput = z.infer<typeof extendSchema>;
export type LeadershipPeriodInput = z.infer<typeof leadershipPeriodSchema>;
export type UserInput = z.infer<typeof userSchema>;
