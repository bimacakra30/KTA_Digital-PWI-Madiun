"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, Edit, Shield, XCircle, CalendarPlus, User, Trash2, Loader2 } from "lucide-react";
import { revokeMember, extendMember, deleteMember, approveMember } from "@/server/actions/member-actions";
import { getStatusConfig } from "@/lib/member-status";
import { toast } from "sonner";

interface MemberDetailProps {
  member: {
    id: string;
    noAnggota: string;
    nama: string;
    fotoUrl: string | null;
    jabatan: string | null;
    tempatLahir: string | null;
    tanggalLahir: string | null;
    provinsi: string | null;
    kabupaten: string | null;
    kecamatan: string | null;
    desa: string | null;
    rt: string | null;
    rw: string | null;
    status: string;
    tanggalBergabung: string;
    masaBerlaku: string;
    consentAt: string | null;
    approvedAt: string | null;
    approvedById: string | null;
    revokedAt: string | null;
    revokeReason: string | null;
    verifyToken: string | null;
    createdAt: string;
    leadershipPeriod: {
      namaKetua: string;
      periodeMulai: string;
      periodeSelesai: string | null;
    } | null;
    logs: {
      id: string;
      action: string;
      actorId: string;
      note: string | null;
      createdAt: string;
    }[];
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export function MemberDetail({ member }: MemberDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");
  const [newExpiry, setNewExpiry] = useState("");

  const expired = new Date(member.masaBerlaku) < new Date();
  const effectiveStatus = member.status === "DISETUJUI" && expired ? "KEDALUWARSA" : member.status;
  const statusConfig = getStatusConfig(effectiveStatus);

  const statusStyles: Record<string, string> = {
    DISETUJUI: "bg-emerald-50 text-emerald-700 border-emerald-200",
    DRAFT: "bg-amber-50 text-amber-700 border-amber-200",
    DICABUT: "bg-red-50 text-red-600 border-red-200",
    KEDALUWARSA: "bg-orange-50 text-orange-600 border-orange-200",
  };

  function handleApprove() {
    startTransition(async () => {
      try {
        await approveMember(member.id);
        toast.success("Anggota berhasil disetujui!");
        router.refresh();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Gagal menyetujui.");
      }
    });
  }

  function handleRevoke() {
    if (!revokeReason.trim()) {
      toast.error("Alasan pencabutan wajib diisi.");
      return;
    }
    startTransition(async () => {
      try {
        await revokeMember({ memberId: member.id, reason: revokeReason });
        toast.success("KTA berhasil dicabut.");
        setShowRevokeModal(false);
        router.refresh();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Gagal mencabut.");
      }
    });
  }

  function handleExtend() {
    if (!newExpiry) {
      toast.error("Tanggal masa berlaku baru wajib diisi.");
      return;
    }
    startTransition(async () => {
      try {
        await extendMember({ memberId: member.id, masaBerlaku: newExpiry });
        toast.success("Masa berlaku berhasil diperpanjang!");
        setShowExtendModal(false);
        router.refresh();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Gagal memperpanjang.");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteMember(member.id);
        toast.success("Anggota berhasil dihapus.");
        router.push("/anggota");
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Gagal menghapus.");
      }
    });
  }

  function getActionLabel(action: string) {
    return ({ CREATE: "Ditambahkan", UPDATE: "Diubah", APPROVE: "Disetujui", REVOKE: "Dicabut", EXTEND: "Diperpanjang", REISSUE: "Diterbitkan ulang", DELETE: "Dihapus", EXPIRE: "Kedaluwarsa" } as Record<string, string>)[action] ?? action;
  }

  function getActionDotColor(action: string) {
    return ({ APPROVE: "bg-emerald-400", REVOKE: "bg-red-400", DELETE: "bg-red-400", CREATE: "bg-teal-400", UPDATE: "bg-amber-400", EXTEND: "bg-blue-400", EXPIRE: "bg-orange-400" } as Record<string, string>)[action] ?? "bg-gray-300";
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push("/anggota")}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{member.nama}</h1>
            <p className="text-gray-500 text-[14px] font-mono">{member.noAnggota}</p>
          </div>
        </div>
        <span className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold border ${statusStyles[effectiveStatus] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
          {statusConfig.label}
        </span>
      </div>

      {/* Content grid — 3 kolom sejajar memenuhi desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_300px] gap-5">
        {/* Kiri: Photo + actions */}
        <div className="space-y-4">
          {/* Photo card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
            {member.fotoUrl ? (
              <img
                src={member.fotoUrl}
                alt={member.nama}
                className="w-full aspect-[3/4] rounded-xl object-cover border border-gray-100"
              />
            ) : (
              <div className="w-full aspect-[3/4] rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <User className="w-12 h-12 text-emerald-300" />
              </div>
            )}
            <p className="text-[14px] font-bold text-gray-900 mt-3">{member.nama}</p>
            {member.jabatan && <p className="text-[12px] text-gray-500">{member.jabatan}</p>}
            {member.tempatLahir && member.tanggalLahir && (
              <p className="text-[11px] text-gray-400 mt-0.5">
                {member.tempatLahir}, {formatDate(member.tanggalLahir)}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 space-y-1">
            <button
              onClick={() => router.push(`/anggota/${member.id}/edit`)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <Edit className="w-4 h-4 text-gray-400" /> Edit Data
            </button>

            {effectiveStatus === "DRAFT" && (
              <button
                onClick={handleApprove}
                disabled={isPending}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Shield className="w-4 h-4" /> Setujui
              </button>
            )}

            {effectiveStatus === "DISETUJUI" && (
              <>
                <button
                  onClick={() => setShowRevokeModal(true)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <XCircle className="w-4 h-4" /> Cabut KTA
                </button>
                <button
                  onClick={() => setShowExtendModal(true)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <CalendarPlus className="w-4 h-4" /> Perpanjang
                </button>
              </>
            )}

            {(effectiveStatus === "KEDALUWARSA" || effectiveStatus === "DICABUT") && (
              <button
                onClick={() => setShowExtendModal(true)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
              >
                <CalendarPlus className="w-4 h-4" /> Perpanjang / Aktifkan Kembali
              </button>
            )}

            <div className="pt-1 border-t border-gray-100 mt-1">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Hapus Anggota
              </button>
            </div>
          </div>
        </div>

        {/* Tengah: Informasi Detail */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-[15px] font-bold text-gray-900 mb-4">Informasi Detail</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Tempat, Tanggal Lahir", value: member.tempatLahir && member.tanggalLahir ? `${member.tempatLahir}, ${formatDate(member.tanggalLahir)}` : "—" },
              { label: "Alamat", value: [member.desa, member.kecamatan, member.kabupaten, member.provinsi].filter(Boolean).join(", ") || "—" },
              { label: "RT / RW", value: member.rt && member.rw ? `${member.rt} / ${member.rw}` : "—" },
              { label: "Tanggal Bergabung", value: formatDate(member.tanggalBergabung) },
              { label: "Masa Berlaku", value: formatDate(member.masaBerlaku) },
              { label: "Consent Diberikan", value: member.consentAt ? formatDate(member.consentAt) : "—" },
              { label: "Disetujui Pada", value: member.approvedAt ? formatDate(member.approvedAt) : "—" },
              { label: "Periode Kepengurusan", value: member.leadershipPeriod?.namaKetua ?? "—" },
              { label: "Didaftarkan", value: formatDateTime(member.createdAt) },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{item.label}</p>
                <p className="text-[13px] text-gray-800 mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>

          {member.status === "DICABUT" && member.revokeReason && (
            <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100">
              <p className="text-[11px] font-medium text-red-400 uppercase tracking-wider">Alasan Pencabutan</p>
              <p className="text-[13px] text-red-700 mt-0.5">{member.revokeReason}</p>
            </div>
          )}

          {member.verifyToken && effectiveStatus === "DISETUJUI" && (
            <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-[11px] font-medium text-emerald-500 uppercase tracking-wider">Link Verifikasi</p>
              <p className="text-[13px] text-emerald-700 mt-0.5 break-all font-mono">/verifikasi/{member.verifyToken}</p>
            </div>
          )}
        </div>

        {/* Kanan: Riwayat Aktivitas — fixed height, scrollable */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style={{ maxHeight: "calc(100vh - 140px)" }}>
          <div className="px-5 py-4 border-b border-gray-50 flex-shrink-0">
            <h3 className="text-[14px] font-bold text-gray-900">Riwayat Aktivitas</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">{member.logs.length} log</p>
          </div>
          <div className="divide-y divide-gray-50 overflow-y-auto flex-1">
            {member.logs.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-400 text-[13px]">Belum ada riwayat.</p>
              </div>
            ) : (
              member.logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 px-5 py-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getActionDotColor(log.action)}`} />
                  <div className="min-w-0">
                    <p className="text-[12px] text-gray-700">
                      <span className="font-semibold">{getActionLabel(log.action)}</span>
                    </p>
                    {log.note && <p className="text-[11px] text-gray-500 mt-0.5 truncate">{log.note}</p>}
                    <p className="text-[10px] text-gray-400 mt-0.5">{formatDateTime(log.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showRevokeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowRevokeModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Cabut KTA</h3>
            <p className="text-[14px] text-gray-500 mb-4">KTA {member.nama} akan dicabut. Masukkan alasan.</p>
            <textarea
              placeholder="Alasan pencabutan..."
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 resize-none"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowRevokeModal(false)} className="px-4 py-2 text-[14px] text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer">
                Batal
              </button>
              <button
                onClick={handleRevoke}
                disabled={isPending}
                className="px-4 py-2 text-[14px] font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Cabut KTA
              </button>
            </div>
          </div>
        </div>
      )}

      {showExtendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowExtendModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Perpanjang Masa Berlaku</h3>
            <p className="text-[14px] text-gray-500 mb-4">Tentukan tanggal baru masa berlaku KTA.</p>
            <input
              type="date"
              value={newExpiry}
              onChange={(e) => setNewExpiry(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowExtendModal(false)} className="px-4 py-2 text-[14px] text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer">
                Batal
              </button>
              <button
                onClick={handleExtend}
                disabled={isPending}
                className="px-4 py-2 text-[14px] font-semibold text-white rounded-xl cursor-pointer disabled:opacity-50 flex items-center gap-2"
                style={{ background: "linear-gradient(135deg, #065f46, #059669)" }}
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Perpanjang
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Hapus Anggota?</h3>
            <p className="text-[14px] text-gray-500 mt-1">Data {member.nama} akan dihapus (soft delete). Aksi ini tidak bisa dibatalkan.</p>
            <div className="flex justify-center gap-2 mt-5">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-[14px] text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer">
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="px-4 py-2 text-[14px] font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
