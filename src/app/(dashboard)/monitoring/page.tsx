"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, Search, Filter, User, ChevronLeft, ChevronRight } from "lucide-react";
import { getMembers } from "@/server/actions/member-queries";

interface MemberRow {
  id: string;
  noAnggota: string;
  nama: string;
  jabatan: string | null;
  fotoUrl: string | null;
  status: string;
  masaBerlaku: string;
  kecamatan: string | null;
  desa: string | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
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

export default function MonitoringPage() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [kecamatan, setKecamatan] = useState("");
  const [desa, setDesa] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const perPage = 15;

  const loadData = (params?: { search?: string; status?: string; kecamatan?: string; desa?: string; page?: number }) => {
    const q = params?.search ?? search;
    const s = params?.status ?? status;
    const kec = params?.kecamatan ?? kecamatan;
    const ds = params?.desa ?? desa;
    const p = params?.page ?? page;

    startTransition(async () => {
      try {
        const result = await getMembers({
          search: q || undefined,
          status: s || undefined,
          kecamatan: kec || undefined,
          desa: ds || undefined,
          page: p,
          perPage,
        });
        setMembers(result.members.map((m) => ({
          id: m.id,
          noAnggota: m.noAnggota,
          nama: m.nama,
          jabatan: m.jabatan,
          fotoUrl: m.fotoUrl,
          status: m.status,
          masaBerlaku: m.masaBerlaku,
          kecamatan: m.kecamatan ?? null,
          desa: m.desa ?? null,
        })));
        setTotal(result.total);
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
    setPage(1);
    loadData({ search, page: 1 });
  };

  const totalPages = Math.ceil(total / perPage);
  const hasActiveFilters = status || kecamatan || desa;

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded-lg w-48" />
        <div className="h-96 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
              <Eye className="w-5 h-5 text-teal-600" />
            </div>
            Monitoring Anggota
          </h1>
          <p className="text-gray-500 text-[14px] mt-1">Daftar seluruh anggota (hanya lihat)</p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama/no anggota..."
              className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-[13px] w-64 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-teal-600 text-white text-[13px] font-semibold rounded-xl hover:bg-teal-700 transition-colors cursor-pointer">
            Cari
          </button>
        </form>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
              hasActiveFilters
                ? "bg-teal-50 text-teal-700 border border-teal-200"
                : "text-gray-500 bg-gray-50 hover:bg-gray-100"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filter
            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />}
          </button>
          <span className="text-[13px] text-gray-400">{total} anggota</span>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Status</label>
                <select
                  value={status}
                  onChange={(e) => { setStatus(e.target.value); setPage(1); loadData({ status: e.target.value, page: 1 }); }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                >
                  <option value="">Semua Status</option>
                  <option value="DISETUJUI">Aktif</option>
                  <option value="DRAFT">Draft</option>
                  <option value="DICABUT">Dicabut</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Kecamatan</label>
                <input
                  type="text"
                  value={kecamatan}
                  onChange={(e) => { setKecamatan(e.target.value.toUpperCase()); setPage(1); loadData({ kecamatan: e.target.value.toUpperCase(), page: 1 }); }}
                  placeholder="Ketik kecamatan..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Desa / Kelurahan</label>
                <input
                  type="text"
                  value={desa}
                  onChange={(e) => { setDesa(e.target.value); setPage(1); loadData({ desa: e.target.value, page: 1 }); }}
                  placeholder="Ketik desa..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                />
              </div>
            </div>
            {hasActiveFilters && (
              <button
                onClick={() => { setStatus(""); setKecamatan(""); setDesa(""); setPage(1); loadData({ status: "", kecamatan: "", desa: "", page: 1 }); }}
                className="mt-3 text-[12px] text-red-500 hover:text-red-600 font-medium cursor-pointer transition-colors"
              >
                ✕ Hapus semua filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Anggota</th>
                <th className="px-5 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">No. Anggota</th>
                <th className="px-5 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Jabatan</th>
                <th className="px-5 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Wilayah</th>
                <th className="px-5 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Masa Berlaku</th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-gray-50 ${isPending ? "opacity-50" : ""} transition-opacity`}>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <User className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-gray-400 text-[14px]">Tidak ada data ditemukan.</p>
                  </td>
                </tr>
              ) : (
                members.map((m) => {
                  const badge = getStatusBadge(m.status, m.masaBerlaku);
                  return (
                    <tr key={m.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => router.push(`/monitoring/${m.id}`)}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {m.fotoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={m.fotoUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-[11px] font-bold">
                                {m.nama.charAt(0)}
                              </div>
                            )}
                          </div>
                          <span className="text-[13px] font-semibold text-gray-900">{m.nama}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[13px] text-gray-600 font-mono">{m.noAnggota}</td>
                      <td className="px-5 py-3.5 text-[13px] text-gray-600">{m.jabatan || "—"}</td>
                      <td className="px-5 py-3.5 text-[12px] text-gray-500">
                        {[m.desa, m.kecamatan].filter(Boolean).join(", ") || "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                      </td>
                      <td className="px-5 py-3.5 text-[12px] text-gray-500">{formatDate(m.masaBerlaku)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
            <p className="text-[12px] text-gray-400">
              Halaman {page} dari {totalPages}
            </p>
            <div className="flex gap-1.5">
              <button
                onClick={() => { const p = page - 1; setPage(p); loadData({ page: p }); }}
                disabled={page <= 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => { const p = page + 1; setPage(p); loadData({ page: p }); }}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
