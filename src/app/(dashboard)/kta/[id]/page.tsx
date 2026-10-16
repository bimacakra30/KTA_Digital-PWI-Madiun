"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getMemberDetail } from "@/server/actions/member-queries";
import { toJpeg } from "html-to-image";
import "./kta-card.css";

interface MemberKta {
  noAnggota: string;
  nama: string;
  jabatan: string | null;
  tempatLahir: string | null;
  tanggalLahir: string | null;
  provinsi: string | null;
  kabupaten: string | null;
  kecamatan: string | null;
  desa: string | null;
  rt: string | null;
  rw: string | null;
  fotoUrl: string | null;
  masaBerlaku: string;
  approvedAt: string | null;
  verifyToken: string | null;
  leadershipPeriod: {
    namaKetua: string;
    periodeMulai: string;
    periodeSelesai: string | null;
    tandaTanganUrl: string | null;
  } | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export default function KtaPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [member, setMember] = useState<MemberKta | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLElement>(null);

  function proxyUrl(url: string | null) {
    if (!url) return null;
    if (url.startsWith("/")) return url;
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  }

  useEffect(() => {
    getMemberDetail(id)
      .then((data) => {
        if (!data) throw new Error("not found");
        setMember({
          ...data,
          fotoUrl: proxyUrl(data.fotoUrl),
          leadershipPeriod: data.leadershipPeriod ? {
            ...data.leadershipPeriod,
            tandaTanganUrl: proxyUrl(data.leadershipPeriod.tandaTanganUrl),
          } : null,
        });
      })
      .catch(() => toast.error("Gagal memuat data anggota"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      // e-KTP standar: 85.6mm × 53.98mm @ 300 DPI = 1012 × 638 px
      const KTP_WIDTH = 1012;
      const KTP_HEIGHT = 638;
      const cardWidth = cardRef.current.offsetWidth;
      const scale = KTP_WIDTH / cardWidth;

      const dataUrl = await toJpeg(cardRef.current, {
        quality: 0.95,
        pixelRatio: scale,
        canvasWidth: KTP_WIDTH,
        canvasHeight: KTP_HEIGHT,
        backgroundColor: "#f7f8f5",
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `KTA-${member?.noAnggota ?? id}.jpg`;
      a.click();
      toast.success("JPG berhasil diunduh");
    } catch {
      toast.error("Gagal mengunduh JPG");
    } finally {
      setDownloading(false);
    }
  };

  const alamat = member
    ? (() => {
        const desaRtRw = member.desa
          ? member.desa + (member.rt && member.rw ? ` RT ${member.rt}/RW ${member.rw}` : "")
          : "";
        const parts = [desaRtRw, member.kecamatan, member.kabupaten, member.provinsi].filter(Boolean);
        return parts.join(", ");
      })()
    : "";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-[14px] text-gray-400">Memuat data KTA...</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center py-32">
        <p className="text-gray-400">Anggota tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[14px] text-gray-500 hover:text-gray-700 transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-[13px] font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {downloading ? "Generating..." : "Unduh JPG"}
        </button>
      </div>

      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-center">Pratinjau Kartu Tanda Anggota</p>

      {/* KTA Card — exact replica of contoh-kta.html */}
      <div className="flex justify-center">

        <article ref={cardRef} className="kta-card" aria-label="Kartu Tanda Anggota">
          <div className="p head" />
          <div className="p sw" />
          <div className="p sw2" />

          {/* Logo PWI kiri */}
          <div
            className="p logo"
            role="img"
            aria-label="Logo PWI"
            style={{ backgroundImage: "url(/logo-pwi.png)" }}
          />

          {/* Title SVG */}
          <div className="p ttl-wrap">
            <svg viewBox="0 0 770 232" role="img" aria-label="DPD PWI-LS Kabupaten Madiun">
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#fff6bd"/>
                  <stop offset=".45" stopColor="#f0c230"/>
                  <stop offset="1" stopColor="#a8740a"/>
                </linearGradient>
                <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#fff"/>
                  <stop offset=".5" stopColor="#e6e9e7"/>
                  <stop offset="1" stopColor="#97a09b"/>
                </linearGradient>
                <filter id="sh" x="-5%" y="-10%" width="110%" height="130%">
                  <feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#000" floodOpacity=".6"/>
                </filter>
              </defs>
              <g filter="url(#sh)">
                <text x="0" y="60" fontSize="62" fill="url(#g)" textLength="770" lengthAdjust="spacingAndGlyphs" style={{ fontFamily: "Cinzel,Georgia,serif", fontWeight: 900 }}>DEWAN PIMPINAN DAERAH</text>
                <text x="125" y="152" fontSize="112" fill="url(#g)" textLength="520" lengthAdjust="spacingAndGlyphs" style={{ fontFamily: "Cinzel,Georgia,serif", fontWeight: 900 }}>PWI - LS</text>
                <text x="50" y="228" fontSize="64" fill="url(#s)" textLength="670" lengthAdjust="spacingAndGlyphs" style={{ fontFamily: "Cinzel,Georgia,serif", fontWeight: 900 }}>KABUPATEN MADIUN</text>
              </g>
            </svg>
          </div>

          <div className="p rule" />

          {/* Logo Laskar kanan */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-laskar.png" alt="Logo Laskar" className="p emblem-img" />

          {/* Watermark */}
          <div className="p wm" style={{ backgroundImage: "url(/logo-pwi.png)" }} />

          {/* Band "KARTU TANDA ANGGOTA" + KTA tag */}
          <div className="p band">KARTU TANDA ANGGOTA</div>
          <div className="p kta-tag">KTA</div>

          {/* Photo frame + photo */}
          <div className="p frame" />
          <div
            className="p photo"
            role="img"
            aria-label="Foto anggota"
            style={{ backgroundImage: member.fotoUrl ? `url(${member.fotoUrl})` : "none", backgroundColor: member.fotoUrl ? undefined : "#d1d5db" }}
          />
          <div className="p pname">{member.nama.toUpperCase()}</div>
          <div className="p pline" />

          {/* Data rows */}
          <div className="p rows-container">
            <div className="data-row">
              <b>NO. ANGGOTA</b><s>:</s><span>{member.noAnggota}</span>
            </div>
            <div className="data-row">
              <b>NAMA</b><s>:</s><span>{member.nama}</span>
            </div>
            <div className="data-row">
              <b>ALAMAT</b><s>:</s><span>{alamat || "—"}</span>
            </div>
            <div className="data-row">
              <b>JABATAN</b><s>:</s><span>{member.jabatan || "—"}</span>
            </div>
          </div>

          {/* QR */}
          <div
            className="p qr"
            role="img"
            aria-label="QR verifikasi"
            style={{ backgroundImage: member.verifyToken ? `url(/api/qr/${member.verifyToken})` : "none" }}
          />
          <div className="p motto">
            SATU KOMANDO<br/>SATU TUJUAN<br/>UNTUK UMAT<br/>DAN BANGSA
          </div>

          {/* Endorsement */}
          <div className="p ttd">
            Madiun, {member.approvedAt ? formatDate(member.approvedAt) : "—"}<br/>Ketua,
          </div>
          {member.leadershipPeriod?.tandaTanganUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={member.leadershipPeriod.tandaTanganUrl} alt="Tanda tangan" className="p sig" />
          )}
          <div className="p sname">{member.leadershipPeriod?.namaKetua?.toUpperCase() || "—"}</div>

          {/* Footer */}
          <div className="p foot">
            <span>LOYALITAS</span>-<span>SOLIDARITAS</span>-<span>DAKWAH</span>-<span>PENGABDIAN</span>
          </div>
        </article>
      </div>
    </div>
  );
}
