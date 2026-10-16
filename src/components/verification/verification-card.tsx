"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

/* ── Types ──────────────────────────────── */

type KtaStatus = "verified" | "expired" | "revoked";

interface VerificationCardProps {
  token: string;
  member: {
    noAnggota: string;
    nama: string;
    jabatan: string | null;
    alamat: string;
    masaBerlaku: string;
    approvedAt: string | null;
    hasFoto: boolean;
    effectiveStatus: string;
    revokeReason: string | null;
  };
  pengesah: {
    namaKetua: string;
    jabatan: string;
    hasTtd: boolean;
  } | null;
}

/* ── Palette ────────────────────────────── */

const TONES: Record<
  KtaStatus,
  { header: string; soft: string; text: string; dot: string; title: string; subtitle: string; badge: string }
> = {
  verified: {
    header: "#0B5D43",
    soft: "#E3F4EC",
    text: "#0B5D43",
    dot: "#12A373",
    title: "Keanggotaan Terverifikasi",
    subtitle: "Data sesuai database resmi organisasi",
    badge: "Terverifikasi",
  },
  expired: {
    header: "#8A4B08",
    soft: "#FDF0DC",
    text: "#8A4B08",
    dot: "#D98A1F",
    title: "Masa Berlaku Habis",
    subtitle: "KTA sudah kedaluwarsa",
    badge: "Kedaluwarsa",
  },
  revoked: {
    header: "#9B1C1C",
    soft: "#FBE6E6",
    text: "#9B1C1C",
    dot: "#D93A3A",
    title: "KTA Dicabut",
    subtitle: "Keanggotaan telah dicabut",
    badge: "Dicabut",
  },
};

const C = {
  bg: "#F3F6F4",
  ink: "#10231B",
  muted: "#4A5F56",
  label: "#5B7067",
  line: "#E4ECE8",
  onHeaderMuted: "#BFE3D3",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: C.label,
  marginBottom: 3,
};

/* ── Helpers ────────────────────────────── */

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function mapStatus(s: string): KtaStatus {
  if (s === "DICABUT") return "revoked";
  if (s === "KEDALUWARSA") return "expired";
  return "verified";
}

/* ── Component ──────────────────────────── */

export function VerificationCard({ token, member, pengesah }: VerificationCardProps) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const status = mapStatus(member.effectiveStatus);
  const tone = TONES[status];

  const verifiedAt = now
    ? `${now.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}, ${now.toLocaleTimeString("id-ID")}`
    : "—";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: C.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
        color: C.ink,
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Single card */}
        <div
          style={{
            background: "#fff",
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(16,35,27,0.10)",
          }}
        >
          {/* ── Header (compact) ── */}
          <div style={{ background: tone.header, color: "#fff", padding: "20px 22px 16px" }}>
            {/* Org row */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Image
                src="/logo-pwi.png"
                alt="Logo"
                width={96}
                height={96}
                style={{ objectFit: "contain", flexShrink: 0 }}
                priority
              />
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>
                  Perjuangan Walisongo Indonesia
                </div>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: C.onHeaderMuted, marginTop: 6 }}>
                  Sistem KTA Digital
                </div>
              </div>
            </div>
          </div>

          {/* ── Body ── */}
          <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Photo + Name */}
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              {member.hasFoto ? (
                <img
                  src={`/api/verifikasi/${token}/foto`}
                  alt={member.nama}
                  style={{ width: 108, height: 135, borderRadius: 12, objectFit: "cover", flexShrink: 0 }}
                />
              ) : (
                <div
                  style={{
                    width: 108, height: 135, borderRadius: 12,
                    background: "#DCE9E3", color: "#0B5D43",
                    fontSize: 26, fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}
                >
                  {initials(member.nama)}
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.15 }}>{member.nama}</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: C.muted, marginTop: 2 }}>{member.jabatan || "Anggota"}</div>
                <div
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    background: tone.soft, color: tone.text,
                    fontSize: 11, fontWeight: 700,
                    padding: "4px 10px", borderRadius: 999, marginTop: 6,
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: 4, background: tone.dot }} />
                  {tone.badge}
                </div>
              </div>
            </div>

            <hr style={{ border: 0, height: 1, background: C.line, margin: 0 }} />

            {/* No Anggota */}
            <div>
              <div style={labelStyle}>No. Anggota</div>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.02em" }}>{member.noAnggota}</div>
            </div>

            {/* Berlaku sampai */}
            <div>
              <div style={labelStyle}>Berlaku sampai</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{formatDate(member.masaBerlaku)}</div>
            </div>

            {/* Alamat */}
            {member.alamat && (
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0B5D43" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 2, flexShrink: 0 }}>
                  <path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
                <div>
                  <div style={labelStyle}>Alamat</div>
                  <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.45 }}>{member.alamat}</div>
                </div>
              </div>
            )}

            {/* Revoke reason */}
            {status === "revoked" && member.revokeReason && (
              <div style={{ background: "#FBE6E6", borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ ...labelStyle, color: "#9B1C1C" }}>Alasan Pencabutan</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#7F1D1D", lineHeight: 1.45 }}>{member.revokeReason}</div>
              </div>
            )}

            <hr style={{ border: 0, height: 1, background: C.line, margin: 0 }} />

            {/* Disahkan oleh */}
            {pengesah && (
              <div>
                <div style={labelStyle}>Disahkan oleh</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{pengesah.namaKetua}</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: C.muted }}>{pengesah.jabatan}</div>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div
            style={{
              padding: "12px 22px",
              borderTop: `1px solid ${C.line}`,
              textAlign: "center",
              fontSize: 11,
              color: C.muted,
              lineHeight: 1.5,
            }}
            suppressHydrationWarning
          >
            Diverifikasi pada {verifiedAt}
          </div>
        </div>
      </div>
    </main>
  );
}
