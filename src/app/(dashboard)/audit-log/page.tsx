"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { ScrollText, ChevronLeft, ChevronRight } from "lucide-react";
import { getAuditLogs } from "@/server/actions/audit-actions";

interface LogEntry {
  id: string;
  action: string;
  memberNama: string;
  memberNoAnggota: string;
  actorNama: string;
  note: string | null;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Menambahkan",
  UPDATE: "Mengubah",
  APPROVE: "Menyetujui",
  REVOKE: "Mencabut",
  EXTEND: "Memperpanjang",
  REISSUE: "Menerbitkan ulang",
  DELETE: "Menghapus",
  EXPIRE: "Kedaluwarsa (otomatis)",
};

const ACTION_COLORS: Record<string, string> = {
  CREATE: "text-teal-600 bg-teal-50",
  UPDATE: "text-amber-600 bg-amber-50",
  APPROVE: "text-emerald-600 bg-emerald-50",
  REVOKE: "text-red-600 bg-red-50",
  EXTEND: "text-blue-600 bg-blue-50",
  REISSUE: "text-indigo-600 bg-indigo-50",
  DELETE: "text-red-600 bg-red-50",
  EXPIRE: "text-orange-600 bg-orange-50",
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const loadData = (p: number) => {
    startTransition(async () => {
      try {
        const result = await getAuditLogs(p);
        setLogs(result.logs);
        setPage(result.page);
        setTotalPages(result.totalPages);
        setTotal(result.total);
      } catch {
        toast.error("Gagal memuat audit log");
      } finally {
        setLoading(false);
      }
    });
  };

  useEffect(() => { loadData(1); }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded-lg w-40" />
        <div className="h-64 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <ScrollText className="w-5 h-5 text-emerald-600" />
          </div>
          Audit Log
        </h1>
        <p className="text-gray-500 text-[14px] mt-1">{total} total aktivitas tercatat</p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Aksi</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Anggota</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Oleh</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Catatan</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-gray-400 text-[15px]">
                    Belum ada aktivitas.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-3">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${ACTION_COLORS[log.action] ?? "text-gray-600 bg-gray-50"}`}>
                        {ACTION_LABELS[log.action] ?? log.action}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <p className="text-[13px] font-semibold text-gray-900">{log.memberNama}</p>
                      <p className="text-[11px] text-gray-400">{log.memberNoAnggota}</p>
                    </td>
                    <td className="px-6 py-3 text-[13px] text-gray-600">{log.actorNama}</td>
                    <td className="px-6 py-3 text-[12px] text-gray-500 max-w-[200px] truncate">{log.note || "—"}</td>
                    <td className="px-6 py-3 text-[12px] text-gray-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric", month: "short", year: "numeric",
                      })}{" "}
                      {new Date(log.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
            <p className="text-[12px] text-gray-400">
              Halaman {page} dari {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => loadData(page - 1)}
                disabled={page <= 1 || isPending}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => loadData(page + 1)}
                disabled={page >= totalPages || isPending}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
