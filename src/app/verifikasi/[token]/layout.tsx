import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verifikasi KTA — Sistem KTA Digital",
  description: "Halaman verifikasi Kartu Tanda Anggota digital. Pindai QR code pada KTA untuk memverifikasi keaslian dan status keanggotaan secara real-time.",
};

export default function VerifikasiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
