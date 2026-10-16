import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div>
        <div className="h-8 bg-gray-200 rounded-lg w-40" />
        <div className="h-5 bg-gray-100 rounded-lg w-56 mt-2" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 bg-gray-100 rounded-2xl" />
        ))}
      </div>
      <div className="h-64 bg-gray-100 rounded-2xl" />
    </div>
  );
}

async function DashboardContent() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [total, disetujui, draft, dicabut, kedaluwarsa] = await Promise.all([
    prisma.member.count(),
    prisma.member.count({ where: { status: "DISETUJUI" } }),
    prisma.member.count({ where: { status: "DRAFT" } }),
    prisma.member.count({ where: { status: "DICABUT" } }),
    prisma.member.count({ where: { status: "KEDALUWARSA" } }),
  ]);

  const recentLogs = await prisma.approvalLog.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: { member: { select: { nama: true, noAnggota: true } } },
  });

  const stats = [
    { label: "Total Anggota", value: total, bg: "bg-emerald-50", iconBg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
    { label: "Aktif", value: disetujui, bg: "bg-teal-50", iconBg: "bg-teal-100", text: "text-teal-700", dot: "bg-teal-500" },
    { label: "Draft", value: draft, bg: "bg-amber-50", iconBg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-400" },
    { label: "Dicabut", value: dicabut, bg: "bg-red-50", iconBg: "bg-red-100", text: "text-red-600", dot: "bg-red-400" },
    { label: "Kedaluwarsa", value: kedaluwarsa, bg: "bg-orange-50", iconBg: "bg-orange-100", text: "text-orange-600", dot: "bg-orange-400" },
  ];

  function getActionLabel(action: string) {
    return ({ CREATE: "Menambahkan", UPDATE: "Mengubah", APPROVE: "Menyetujui", REVOKE: "Mencabut", EXTEND: "Memperpanjang", REISSUE: "Menerbitkan ulang", DELETE: "Menghapus" } as Record<string, string>)[action] ?? action;
  }

  function getActionColor(action: string) {
    return ({ APPROVE: "text-emerald-600", REVOKE: "text-red-500", DELETE: "text-red-500", CREATE: "text-teal-600", UPDATE: "text-amber-600", EXTEND: "text-blue-500" } as Record<string, string>)[action] ?? "text-gray-500";
  }

  function getDotColor(action: string) {
    return ({ APPROVE: "bg-emerald-400", REVOKE: "bg-red-400", DELETE: "bg-red-400", CREATE: "bg-teal-400", UPDATE: "bg-amber-400", EXTEND: "bg-blue-400" } as Record<string, string>)[action] ?? "bg-gray-300";
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1 text-[15px]">Selamat datang, {session.user.nama}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`${stat.bg} rounded-2xl p-5 border border-white shadow-sm hover:shadow-md transition-shadow duration-200`}
          >
            <div className={`w-9 h-9 ${stat.iconBg} rounded-xl flex items-center justify-center mb-4`}>
              <div className={`w-3 h-3 rounded-full ${stat.dot}`} />
            </div>
            <p className={`text-2xl font-bold ${stat.text}`}>{stat.value}</p>
            <p className="text-[13px] text-gray-500 mt-0.5 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50">
          <h2 className="text-[16px] font-bold text-gray-900">Aktivitas Terbaru</h2>
          <p className="text-[13px] text-gray-400 mt-0.5">10 aktivitas terakhir di sistem</p>
        </div>
        <div className="divide-y divide-gray-50">
          {recentLogs.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-gray-400 text-[15px]">Belum ada aktivitas.</p>
            </div>
          ) : (
            recentLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getDotColor(log.action)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] text-gray-700 leading-snug">
                    <span className={`font-semibold ${getActionColor(log.action)}`}>
                      {getActionLabel(log.action)}
                    </span>{" "}
                    anggota{" "}
                    <span className="font-semibold text-gray-900">{log.member.nama}</span>
                    <span className="text-gray-500 text-[13px]"> ({log.member.noAnggota})</span>
                  </p>
                  {log.note && (
                    <p className="text-[12.5px] text-gray-500 mt-0.5">{log.note}</p>
                  )}
                  <p className="text-[12px] text-gray-400 mt-1">
                    {new Date(log.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
