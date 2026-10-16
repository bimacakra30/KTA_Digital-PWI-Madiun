"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreditCard, Download, Search, Eye, Filter, Loader2 } from "lucide-react";
import { getMembers } from "@/server/actions/member-queries";
import { getMemberDetail } from "@/server/actions/member-queries";
import { toJpeg } from "html-to-image";
import "../kta/[id]/kta-card.css";

interface MemberRow {
  id: string;
  noAnggota: string;
  nama: string;
  jabatan: string | null;
  fotoUrl: string | null;
  status: string;
  masaBerlaku: string;
}

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
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function getStatusBadge(status: string, masaBerlaku: string) {
  const isExpired = status === "DISETUJUI" && new Date(masaBerlaku) < new Date();
  if (isExpired) return { label: "Kedaluwarsa", cls: "text-orange-600 bg-orange-50" };
  return {
    DISETUJUI: { label: "Aktif", cls: "text-emerald-700 bg-emerald-50" },
    DRAFT: { label: "Draft", cls: "text-amber-600 bg-amber-50" },
    DICABUT: { label: "Dicabut", cls: "text-red-600 bg-red-50" },
    KEDALUWARSA: { label: "Kedaluwarsa", cls: "text-orange-600 bg-orange-50" },
  }[status] ?? { label: status, cls: "text-gray-600 bg-gray-50" };
}

function buildAlamat(m: MemberKta) {
  const desaRtRw = m.desa
    ? m.desa + (m.rt && m.rw ? ` RT ${m.rt}/RW ${m.rw}` : "")
    : "";
  return [desaRtRw, m.kecamatan, m.kabupaten, m.provinsi].filter(Boolean).join(", ");
}

export default function KtaPage() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [search, setSearch] = useState("");
  const [kecamatan, setKecamatan] = useState("");
  const [desa, setDesa] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadMember, setDownloadMember] = useState<MemberKta | null>(null);

  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const hiddenCardRef = useRef<HTMLElement>(null);

  const loadData = (params?: { search?: string; kecamatan?: string; desa?: string }) => {
    const q = params?.search ?? search;
    const kec = params?.kecamatan ?? kecamatan;
    const ds = params?.desa ?? desa;

    startTransition(async () => {
      try {
        const result = await getMembers({
          search: q || undefined,
          status: "DISETUJUI",
          kecamatan: kec || undefined,
          desa: ds || undefined,
          perPage: 100,
        });
        setMembers(result.members.map((m) => ({
          id: m.id,
          noAnggota: m.noAnggota,
          nama: m.nama,
          jabatan: m.jabatan,
          fotoUrl: m.fotoUrl,
          status: m.status,
          masaBerlaku: m.masaBerlaku,
        })));
      } catch {
        toast.error("Gagal memuat data");
      } finally {
        setLoading(false);
      }
    });
  };

  useEffect(() => { loadData(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData({ search });
  };

  function handleKecamatanChange(value: string) {
    setKecamatan(value);
    setDesa("");
    loadData({ kecamatan: value, desa: "" });
  }

  function handleDesaChange(value: string) {
    setDesa(value);
    loadData({ desa: value });
  }

  function clearFilters() {
    setKecamatan("");
    setDesa("");
    loadData({ kecamatan: "", desa: "" });
  }

  const hasActiveFilters = kecamatan || desa;

  const handlePreview = (memberId: string) => {
    router.push(`/kta/${memberId}`);
  };


  function proxyUrl(url: string | null) {
    if (!url) return null;
    if (url.startsWith("/")) return url;
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  }


  const handleDirectDownload = async (memberId: string) => {
    setDownloadingId(memberId);
    try {
      const data = await getMemberDetail(memberId);
      if (!data) throw new Error("not found");

      // 2. Set member data dengan URL yang di-proxy untuk capture
      setDownloadMember({
        ...data,
        fotoUrl: proxyUrl(data.fotoUrl),
        leadershipPeriod: data.leadershipPeriod ? {
          ...data.leadershipPeriod,
          tandaTanganUrl: proxyUrl(data.leadershipPeriod.tandaTanganUrl),
        } : null,
      });

      // 3. Wait for render + images to load
      await new Promise((r) => setTimeout(r, 800));

      // 4. Capture to JPG — e-KTP standar: 85.6mm × 53.98mm @ 300 DPI = 1012 × 638 px
      if (!hiddenCardRef.current) throw new Error("Card not rendered");
      const KTP_WIDTH = 1012;
      const KTP_HEIGHT = 638;
      const cardWidth = hiddenCardRef.current.offsetWidth;
      const scale = KTP_WIDTH / cardWidth;

      const dataUrl = await toJpeg(hiddenCardRef.current, {
        quality: 0.95,
        pixelRatio: scale,
        canvasWidth: KTP_WIDTH,
        canvasHeight: KTP_HEIGHT,
        backgroundColor: "#f7f8f5",
      });

      // 5. Trigger download
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `KTA-${data.noAnggota}.jpg`;
      a.click();
      toast.success("JPG berhasil diunduh");
    } catch {
      toast.error("Gagal mengunduh JPG");
    } finally {
      setDownloadingId(null);
      setDownloadMember(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded-lg w-48" />
        <div className="h-64 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-emerald-600" />
            </div>
            Kartu Anggota
          </h1>
          <p className="text-gray-500 text-[14px] mt-1">Cetak dan unduh KTA anggota aktif</p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama/no anggota..."
              className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-[13px] w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-emerald-600 text-white text-[13px] font-semibold rounded-xl hover:bg-emerald-700 transition-colors cursor-pointer">
            Cari
          </button>
        </form>
      </div>

      {/* Filter Wilayah */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
              hasActiveFilters
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "text-gray-500 bg-gray-50 hover:bg-gray-100"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filter Wilayah
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </button>
          <span className="text-[13px] text-gray-400">{members.length} anggota</span>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Kecamatan</label>
                <input
                  type="text"
                  value={kecamatan}
                  onChange={(e) => handleKecamatanChange(e.target.value.toUpperCase())}
                  placeholder="Ketik nama kecamatan..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Desa / Kelurahan</label>
                <input
                  type="text"
                  value={desa}
                  onChange={(e) => handleDesaChange(e.target.value)}
                  placeholder="Ketik nama desa/kelurahan..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                />
              </div>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-3 text-[12px] text-red-500 hover:text-red-600 font-medium cursor-pointer transition-colors"
              >
                ✕ Hapus filter wilayah
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grid */}
      {members.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <CreditCard className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-[15px]">Tidak ada anggota aktif ditemukan.</p>
        </div>
      ) : (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${isPending ? "opacity-50" : ""} transition-opacity`}>
          {members.map((m) => {
            const badge = getStatusBadge(m.status, m.masaBerlaku);
            const isActive = m.status === "DISETUJUI" && new Date(m.masaBerlaku) >= new Date();
            const isDownloading = downloadingId === m.id;
            return (
              <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Card Header */}
                <div className="bg-emerald-800 px-4 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                    {m.fotoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.fotoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/50 text-sm font-bold">
                        {m.nama.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-white truncate">{m.nama}</p>
                    <p className="text-[11px] text-emerald-200">{m.noAnggota}</p>
                  </div>
                </div>

                {/* Card Body */}
                <div className="px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                    <span className="text-[11px] text-gray-400">s.d. {formatDate(m.masaBerlaku)}</span>
                  </div>
                  {m.jabatan && <p className="text-[12px] text-gray-500">{m.jabatan}</p>}
                </div>

                {/* Actions */}
                <div className="px-4 py-3 border-t border-gray-50 flex gap-2">
                  <button
                    onClick={() => handlePreview(m.id)}
                    disabled={!isActive}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[12px] font-semibold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Pratinjau
                  </button>
                  <button
                    onClick={() => handleDirectDownload(m.id)}
                    disabled={!isActive || isDownloading}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[12px] font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isDownloading ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Proses...</>
                    ) : (
                      <><Download className="w-3.5 h-3.5" /> Unduh JPG</>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Hidden KTA Card for direct download capture */}
      {downloadMember && (
        <div
          style={{
            position: "fixed",
            left: "-9999px",
            top: 0,
            opacity: 0,
            pointerEvents: "none",
          }}
        >
          <article ref={hiddenCardRef} className="kta-card" aria-label="Kartu Tanda Anggota">
            <div className="p head" />
            <div className="p sw" />
            <div className="p sw2" />

            <div
              className="p logo"
              role="img"
              aria-label="Logo PWI"
              style={{ backgroundImage: "url(/logo-pwi.png)" }}
            />

            <div className="p ttl-wrap">
              <svg viewBox="0 0 770 232" role="img" aria-label="DPD PWI-LS Kabupaten Madiun">
                <defs>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#fff6bd"/>
                    <stop offset=".45" stopColor="#f0c230"/>
                    <stop offset="1" stopColor="#a8740a"/>
                  </linearGradient>
                  <linearGradient id="s2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#fff"/>
                    <stop offset=".5" stopColor="#e6e9e7"/>
                    <stop offset="1" stopColor="#97a09b"/>
                  </linearGradient>
                  <filter id="sh2" x="-5%" y="-10%" width="110%" height="130%">
                    <feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#000" floodOpacity=".6"/>
                  </filter>
                </defs>
                <g filter="url(#sh2)">
                  <text x="0" y="60" fontSize="62" fill="url(#g2)" textLength="770" lengthAdjust="spacingAndGlyphs" style={{ fontFamily: "Cinzel,Georgia,serif", fontWeight: 900 }}>DEWAN PIMPINAN DAERAH</text>
                  <text x="125" y="152" fontSize="112" fill="url(#g2)" textLength="520" lengthAdjust="spacingAndGlyphs" style={{ fontFamily: "Cinzel,Georgia,serif", fontWeight: 900 }}>PWI - LS</text>
                  <text x="50" y="228" fontSize="64" fill="url(#s2)" textLength="670" lengthAdjust="spacingAndGlyphs" style={{ fontFamily: "Cinzel,Georgia,serif", fontWeight: 900 }}>KABUPATEN MADIUN</text>
                </g>
              </svg>
            </div>

            <div className="p rule" />

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-laskar.png" alt="Logo Laskar" className="p emblem-img" />

            <div className="p wm" style={{ backgroundImage: "url(/logo-pwi.png)" }} />

            <div className="p band">KARTU TANDA ANGGOTA</div>
            <div className="p kta-tag">KTA</div>

            <div className="p frame" />
            <div
              className="p photo"
              role="img"
              aria-label="Foto anggota"
              style={{ backgroundImage: downloadMember.fotoUrl ? `url(${downloadMember.fotoUrl})` : "none", backgroundColor: downloadMember.fotoUrl ? undefined : "#d1d5db" }}
            />
            <div className="p pname">{downloadMember.nama.toUpperCase()}</div>
            <div className="p pline" />

            <div className="p rows-container">
              <div className="data-row">
                <b>NO. ANGGOTA</b><s>:</s><span>{downloadMember.noAnggota}</span>
              </div>
              <div className="data-row">
                <b>NAMA</b><s>:</s><span>{downloadMember.nama}</span>
              </div>
              <div className="data-row">
                <b>ALAMAT</b><s>:</s><span>{buildAlamat(downloadMember) || "—"}</span>
              </div>
              <div className="data-row">
                <b>JABATAN</b><s>:</s><span>{downloadMember.jabatan || "—"}</span>
              </div>
            </div>

            <div
              className="p qr"
              role="img"
              aria-label="QR verifikasi"
              style={{ backgroundImage: downloadMember.verifyToken ? `url(/api/qr/${downloadMember.verifyToken})` : "none" }}
            />
            <div className="p motto">
              SATU KOMANDO<br/>SATU TUJUAN<br/>UNTUK UMAT<br/>DAN BANGSA
            </div>

            <div className="p ttd">
              Madiun, {downloadMember.approvedAt ? formatDateLong(downloadMember.approvedAt) : "—"}<br/>Ketua,
            </div>
            {downloadMember.leadershipPeriod?.tandaTanganUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={downloadMember.leadershipPeriod.tandaTanganUrl} alt="Tanda tangan" className="p sig" />
            )}
            <div className="p sname">{downloadMember.leadershipPeriod?.namaKetua?.toUpperCase() || "—"}</div>

            <div className="p foot">
              <span>LOYALITAS</span>-<span>SOLIDARITAS</span>-<span>DAKWAH</span>-<span>PENGABDIAN</span>
            </div>
          </article>
        </div>
      )}
    </div>
  );
}
