"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getMemberDetail } from "@/server/actions/member-queries";
import { ArrowLeft, User } from "lucide-react";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function getStatusBadge(status: string, masaBerlaku: string) {
  const isExpired = status === "DISETUJUI" && new Date(masaBerlaku) < new Date();
  if (isExpired) return { label: "Kedaluwarsa", cls: "text-orange-600 bg-orange-50 border-orange-200" };
  return {
    DISETUJUI: { label: "Aktif", cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    DRAFT: { label: "Draft", cls: "text-amber-600 bg-amber-50 border-amber-200" },
    DICABUT: { label: "Dicabut", cls: "text-red-600 bg-red-50 border-red-200" },
    KEDALUWARSA: { label: "Kedaluwarsa", cls: "text-orange-600 bg-orange-50 border-orange-200" },
  }[status] ?? { label: status, cls: "text-gray-600 bg-gray-50 border-gray-200" };
}

function getActionLabel(action: string) {
  return ({ CREATE: "Ditambahkan", UPDATE: "Diubah", APPROVE: "Disetujui", REVOKE: "Dicabut", EXTEND: "Diperpanjang", REISSUE: "Diterbitkan ulang", DELETE: "Dihapus", EXPIRE: "Kedaluwarsa" } as Record<string, string>)[action] ?? action;
}

function getActionDotColor(action: string) {
  return ({ APPROVE: "bg-emerald-400", REVOKE: "bg-red-400", DELETE: "bg-red-400", CREATE: "bg-teal-400", UPDATE: "bg-amber-400", EXTEND: "bg-blue-400", EXPIRE: "bg-orange-400" } as Record<string, string>)[action] ?? "bg-gray-300";
}

type MemberDetail = NonNullable<Awaited<ReturnType<typeof getMemberDetail>>>;

export default function MonitoringDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = params.id as string;
    getMemberDetail(id)
      .then((data) => {
        if (!data) {
          router.replace("/monitoring");
          return;
        }
        setMember(data);
      })
      .catch(() => router.replace("/monitoring"))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-200 rounded-xl" />
          <div className="h-7 bg-gray-200 rounded-lg w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_300px] gap-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 h-80" />
          <div className="bg-white rounded-2xl border border-gray-100 p-6 h-80" />
          <div className="bg-white rounded-2xl border border-gray-100 p-5 h-80" />
        </div>
      </div>
    );
  }

  if (!member) return null;

  const badge = getStatusBadge(member.status, member.masaBerlaku);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/monitoring")}
            className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{member.nama}</h1>
            <p className="text-[13px] text-gray-500">{member.noAnggota}</p>
          </div>
        </div>
        <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full border ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      {/* 3-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_300px] gap-5">
        {/* Kiri: Foto */}
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
        </div>

        {/* Kanan: Riwayat Aktivitas */}
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
    </div>
  );
}
