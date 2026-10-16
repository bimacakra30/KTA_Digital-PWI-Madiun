"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, ChevronLeft, ChevronRight, UserPlus, Filter, Trash2 } from "lucide-react";
import { getMembers, type MemberListResult } from "@/server/actions/member-queries";
import { bulkDeleteMembers } from "@/server/actions/member-actions";
import { getStatusConfig } from "@/lib/member-status";
import { toast } from "sonner";

const STATUS_TABS = [
  { value: "SEMUA", label: "Semua" },
  { value: "DISETUJUI", label: "Aktif" },
  { value: "DRAFT", label: "Draft" },
  { value: "DICABUT", label: "Dicabut" },
  { value: "KEDALUWARSA", label: "Kedaluwarsa" },
];

interface MemberTableProps {
  initialData: MemberListResult;
  initialSearch?: string;
  initialStatus?: string;
  batchDeleteEnabled?: boolean;
}

export function MemberTable({ initialData, initialSearch = "", initialStatus = "SEMUA", batchDeleteEnabled = false }: MemberTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [currentPage, setCurrentPage] = useState(initialData.page);
  const [kecamatan, setKecamatan] = useState("");
  const [desa, setDesa] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Sync state when initialData changes (e.g. after router.refresh())
  useEffect(() => {
    setData(initialData);
    setCurrentPage(initialData.page);
    setSelectedIds(new Set());
  }, [initialData]);

  const allSelected = data.members.length > 0 && data.members.every((m) => selectedIds.has(m.id));
  const someSelected = selectedIds.size > 0;

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.members.map((m) => m.id)));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBulkDelete() {
    setConfirmingDelete(true);
  }

  function confirmBulkDelete() {
    startTransition(async () => {
      try {
        const result = await bulkDeleteMembers(Array.from(selectedIds));
        toast.success(`${result.deleted} anggota berhasil dihapus.`);
        setSelectedIds(new Set());
        setConfirmingDelete(false);
        const refreshed = await getMembers({
          search: search || undefined,
          status,
          kecamatan: kecamatan || undefined,
          desa: desa || undefined,
          page: currentPage,
          perPage: 15,
        });
        setData(refreshed);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Gagal menghapus.");
        setConfirmingDelete(false);
      }
    });
  }

  function cancelBulkDelete() {
    setConfirmingDelete(false);
  }

  function fetchMembers(params: { search?: string; status?: string; kecamatan?: string; desa?: string; page?: number }) {
    const newSearch = params.search ?? search;
    const newStatus = params.status ?? status;
    const newKecamatan = params.kecamatan ?? kecamatan;
    const newDesa = params.desa ?? desa;
    const newPage = params.page ?? 1;

    startTransition(async () => {
      const result = await getMembers({
        search: newSearch || undefined,
        status: newStatus,
        kecamatan: newKecamatan || undefined,
        desa: newDesa || undefined,
        page: newPage,
        perPage: 15,
      });
      setData(result);
      setCurrentPage(newPage);
    });
  }

  function handleSearch(value: string) {
    setSearch(value);
    fetchMembers({ search: value, page: 1 });
  }

  function handleStatusChange(value: string) {
    setStatus(value);
    fetchMembers({ status: value, page: 1 });
  }

  function handleKecamatanChange(value: string) {
    setKecamatan(value);
    setDesa("");
    // Kalau filter wilayah aktif, otomatis tampilkan hanya yang Aktif
    if (value) {
      setStatus("DISETUJUI");
      fetchMembers({ kecamatan: value, desa: "", status: "DISETUJUI", page: 1 });
    } else {
      fetchMembers({ kecamatan: value, desa: "", page: 1 });
    }
  }

  function handleDesaChange(value: string) {
    setDesa(value);
    if (value) {
      setStatus("DISETUJUI");
      fetchMembers({ desa: value, status: "DISETUJUI", page: 1 });
    } else {
      fetchMembers({ desa: value, page: 1 });
    }
  }

  function clearFilters() {
    setKecamatan("");
    setDesa("");
    setStatus("SEMUA");
    fetchMembers({ kecamatan: "", desa: "", status: "SEMUA", page: 1 });
  }

  const hasActiveFilters = kecamatan || desa;

  // Get unique kecamatan/desa values from all members for quick filter
  // We use server-side filter, so user types the name directly

  function handlePageChange(page: number) {
    fetchMembers({ page });
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  }

  function getStatusBadge(status: string, masaBerlaku: string) {
    const expired = new Date(masaBerlaku) < new Date();
    const effectiveStatus = status === "DISETUJUI" && expired ? "KEDALUWARSA" : status;
    const config = getStatusConfig(effectiveStatus);
    const styles: Record<string, string> = {
      DISETUJUI: "bg-emerald-50 text-emerald-700 border-emerald-200",
      DRAFT: "bg-amber-50 text-amber-700 border-amber-200",
      DICABUT: "bg-red-50 text-red-600 border-red-200",
      KEDALUWARSA: "bg-orange-50 text-orange-600 border-orange-200",
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${styles[effectiveStatus] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
        {config.label}
      </span>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daftar Anggota</h1>
          <p className="text-gray-500 text-[15px] mt-1">{data.total} anggota terdaftar</p>
        </div>
        <button
          onClick={() => router.push("/anggota/tambah")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-semibold text-white shadow-md shadow-emerald-700/15 hover:shadow-emerald-700/25 active:scale-[0.98] transition-all cursor-pointer"
          style={{ background: "linear-gradient(135deg, #065f46 0%, #059669 60%, #0d9488 100%)" }}
        >
          <UserPlus className="w-4 h-4" />
          Tambah Anggota
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama, nomor, jabatan, kecamatan, desa..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
          />
        </div>

        {/* Status tabs + filter toggle */}
        <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleStatusChange(tab.value)}
                className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
                  status === tab.value
                    ? "text-white shadow-sm"
                    : "text-gray-600 bg-gray-50 hover:bg-gray-100"
                }`}
                style={status === tab.value ? { background: "linear-gradient(135deg, #065f46, #059669)" } : {}}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {batchDeleteEnabled && someSelected ? (
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-gray-700">
                {selectedIds.size} dipilih
              </span>
              {confirmingDelete ? (
                <>
                  <span className="text-[13px] text-red-600 font-medium">Yakin hapus?</span>
                  <button
                    type="button"
                    onClick={confirmBulkDelete}
                    disabled={isPending}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-[12px] font-medium transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isPending ? "Menghapus..." : "Ya, Hapus"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelBulkDelete}
                    className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleBulkDelete}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 text-[12px] font-medium transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedIds(new Set())}
                    className="text-[12px] text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    Batal pilih
                  </button>
                </>
              )}
            </div>
          ) : (
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
          )}
        </div>

        {/* Wilayah filters (collapsible) */}
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

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className={`overflow-x-auto ${isPending ? "opacity-50" : ""} transition-opacity`}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {batchDeleteEnabled && (
                <th className="w-10 px-3 py-3.5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                  />
                </th>
                )}
                <th className="text-left text-[12px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">No. Anggota</th>
                <th className="text-left text-[12px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">Nama</th>
                <th className="text-left text-[12px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5 hidden md:table-cell">Jabatan</th>
                <th className="text-left text-[12px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5 hidden lg:table-cell">Berlaku Sampai</th>
                <th className="text-left text-[12px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.members.length === 0 ? (
                <tr>
                  <td colSpan={batchDeleteEnabled ? 6 : 5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-8 h-8 text-gray-300" />
                      <p className="text-gray-400 text-[15px]">Tidak ada anggota ditemukan.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.members.map((member) => (
                  <tr
                    key={member.id}
                    onClick={() => router.push(`/anggota/${member.id}`)}
                    className={`hover:bg-gray-50/60 transition-colors cursor-pointer ${batchDeleteEnabled && selectedIds.has(member.id) ? "bg-emerald-50/40" : ""}`}
                  >
                    {batchDeleteEnabled && (
                    <td className="w-10 px-3 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(member.id)}
                        onChange={() => toggleSelect(member.id)}
                        className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                      />
                    </td>
                    )}
                    <td className="px-5 py-3.5">
                      <span className="text-[13px] font-mono text-gray-500">{member.noAnggota}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {member.fotoUrl ? (
                          <img
                            src={member.fotoUrl}
                            alt={member.nama}
                            className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-gray-100"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                            <span className="text-[13px] font-bold text-emerald-600">
                              {member.nama.charAt(0)}
                            </span>
                          </div>
                        )}
                        <span className="text-[14px] font-semibold text-gray-900">{member.nama}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <p className="text-[13px] text-gray-700">{member.jabatan || "—"}</p>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="text-[13px] text-gray-600">{formatDate(member.masaBerlaku)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      {getStatusBadge(member.status, member.masaBerlaku)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-[13px] text-gray-500">
              Hal. {currentPage} dari {data.totalPages} ({data.total} anggota)
            </p>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              {Array.from({ length: Math.min(data.totalPages, 5) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-8 h-8 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
                      currentPage === page
                        ? "text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                    style={currentPage === page ? { background: "linear-gradient(135deg, #065f46, #059669)" } : {}}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                disabled={currentPage >= data.totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
