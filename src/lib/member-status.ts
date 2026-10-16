import { MemberStatus } from "@prisma/client";

/**
 * Menghitung status efektif anggota.
 * Jika masa berlaku sudah lewat dan status masih DISETUJUI, 
 * tampilkan sebagai KEDALUWARSA.
 */
export function getEffectiveStatus(
  status: MemberStatus,
  masaBerlaku: Date
): MemberStatus {
  if (status === "DISETUJUI" && new Date() > masaBerlaku) {
    return "KEDALUWARSA";
  }
  return status;
}

/**
 * Label status dalam Bahasa Indonesia.
 */
export function getStatusLabel(status: MemberStatus): string {
  const labels: Record<MemberStatus, string> = {
    DRAFT: "Draft",
    DISETUJUI: "Aktif",
    DICABUT: "Dicabut",
    KEDALUWARSA: "Kedaluwarsa",
  };
  return labels[status];
}

/**
 * Warna badge status untuk UI.
 */
export function getStatusVariant(
  status: MemberStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "DISETUJUI":
      return "default";
    case "DRAFT":
      return "secondary";
    case "DICABUT":
      return "destructive";
    case "KEDALUWARSA":
      return "outline";
    default:
      return "secondary";
  }
}

/**
 * Warna CSS untuk status di halaman verifikasi.
 */
export function getStatusColor(status: MemberStatus): string {
  switch (status) {
    case "DISETUJUI":
      return "#22c55e"; // hijau
    case "KEDALUWARSA":
      return "#eab308"; // kuning
    case "DICABUT":
      return "#ef4444"; // merah
    default:
      return "#6b7280"; // abu-abu
  }
}

/**
 * Config status untuk komponen badge.
 */
export function getStatusConfig(status: string) {
  const configs: Record<string, { label: string; color: string }> = {
    DISETUJUI: { label: "Aktif", color: "emerald" },
    DRAFT: { label: "Draft", color: "amber" },
    DICABUT: { label: "Dicabut", color: "red" },
    KEDALUWARSA: { label: "Kedaluwarsa", color: "orange" },
  };
  return configs[status] ?? { label: status, color: "gray" };
}
