"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronLeft, ChevronRight, Loader2, FileEdit, Users } from "lucide-react";
import { getDraftMembers, type DraftMemberListResult } from "@/server/actions/member-queries";
import { toast } from "sonner";

interface ApprovalTableProps {
  initialData: DraftMemberListResult;
}

export function ApprovalTable({ initialData }: ApprovalTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(initialData.page);

  useEffect(() => {
    setData(initialData);
    setCurrentPage(initialData.page);
  }, [initialData]);

  function fetchData(page: number, searchVal?: string) {
    startTransition(async () => {
      try {
        const result = await getDraftMembers({
          search: searchVal ?? search,
          page,
          perPage: 15,
        });
        setData(result);
        setCurrentPage(result.page);
      } catch {
        toast.error("Gagal memuat data");
      }
    });
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Persetujuan</h1>
        <p className="text-gray-500 mt-1 text-[15px]">
          Anggota berstatus Draft yang datanya belum lengkap
        </p>
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 shadow-sm flex-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
              <FileEdit className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700">{data.total}</p>
              <p className="text-[13px] text-gray-500 font-medium">Data Belum Lengkap</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama, no. anggota, atau jabatan..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              fetchData(1, e.target.value);
            }}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 text-[14px] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {data.members.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-400 text-[15px] font-medium">
              {search ? "Tidak ada anggota Draft yang cocok." : "Tidak ada anggota dengan data belum lengkap."}
            </p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_1fr_1fr_1fr_120px] gap-3 px-5 py-3 bg-gray-50/80 border-b border-gray-100 text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
              <div>Anggota</div>
              <div>No. Anggota</div>
              <div>Jabatan</div>
              <div>Tanggal Input</div>
              <div className="text-center">Aksi</div>
            </div>

            {/* Table Rows */}
            {data.members.map((member) => (
              <div
                key={member.id}
                className="grid grid-cols-[1fr_1fr_1fr_1fr_120px] gap-3 px-5 py-3.5 border-b border-gray-50 items-center hover:bg-gray-50/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0 bg-cover bg-center"
                    style={{
                      backgroundImage: member.fotoUrl ? `url(${member.fotoUrl})` : undefined,
                    }}
                  >
                    {!member.fotoUrl && (
                      <div className="w-full h-full rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-[13px] font-bold">
                        {member.nama.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-gray-900 truncate">{member.nama}</p>
                    {member.kecamatan && (
                      <p className="text-[12px] text-gray-400 truncate">{member.kecamatan}{member.desa ? `, ${member.desa}` : ""}</p>
                    )}
                  </div>
                </div>
                <div className="text-[14px] text-gray-600 font-medium">{member.noAnggota}</div>
                <div className="text-[14px] text-gray-600">{member.jabatan || "—"}</div>
                <div className="text-[13px] text-gray-500">{formatDate(member.createdAt)}</div>
                <div className="text-center">
                  <button
                    onClick={() => router.push(`/anggota/${member.id}/edit`)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 text-white text-[12px] font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
                  >
                    <FileEdit className="w-3.5 h-3.5" />
                    Lengkapi
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-[13px] text-gray-500">
            Menampilkan {(currentPage - 1) * data.perPage + 1}–
            {Math.min(currentPage * data.perPage, data.total)} dari {data.total} anggota
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchData(currentPage - 1)}
              disabled={currentPage <= 1 || isPending}
              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[13px] font-medium text-gray-700 min-w-[80px] text-center">
              {currentPage} / {data.totalPages}
            </span>
            <button
              onClick={() => fetchData(currentPage + 1)}
              disabled={currentPage >= data.totalPages || isPending}
              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {isPending && (
        <div className="fixed inset-0 bg-white/40 backdrop-blur-[1px] z-50 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
        </div>
      )}
    </div>
  );
}
