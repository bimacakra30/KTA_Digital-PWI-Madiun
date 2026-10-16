import { prisma } from "@/lib/prisma";
import { hashIP, hashToken } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { VerificationCard } from "@/components/verification/verification-card";
import { InvalidCard } from "@/components/verification/invalid-card";

export const dynamic = "force-dynamic";

interface VerifikasiPageProps {
  params: Promise<{ token: string }>;
}

export default async function VerifikasiPage({ params }: VerifikasiPageProps) {
  const { token } = await params;


  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
    || headersList.get("x-real-ip")
    || "unknown";
  const { allowed } = rateLimit(`verify:${ip}`, 30, 60 * 1000);
  if (!allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-sm">
          <p className="text-red-600 font-semibold text-lg">Terlalu Banyak Permintaan</p>
          <p className="text-gray-500 text-sm mt-2">Silakan coba lagi dalam beberapa saat.</p>
        </div>
      </div>
    );
  }


  const member = await prisma.member.findUnique({
    where: { verifyToken: token },
    select: {
      id: true,
      noAnggota: true,
      nama: true,
      fotoUrl: true,
      jabatan: true,
      provinsi: true,
      kabupaten: true,
      kecamatan: true,
      desa: true,
      rt: true,
      rw: true,
      status: true,
      masaBerlaku: true,
      approvedAt: true,

      revokeReason: true,
      leadershipPeriod: {
        select: {
          namaKetua: true,
          jabatan: true,
          tandaTanganUrl: true,
        },
      },
    },
  });


  if (!member || member.status === "DRAFT") {
    return <InvalidCard />;
  }


  const now = new Date();
  const isExpired = member.status === "DISETUJUI" && new Date(member.masaBerlaku) < now;
  const effectiveStatus = isExpired ? "KEDALUWARSA" : member.status;


  try {
    const userAgent = headersList.get("user-agent") || null;


    prisma.scanLog.create({
      data: {
        memberId: member.id,
        tokenHash: hashToken(token),
        ipHash: hashIP(ip),
        userAgent,
      },
    }).catch(() => { /* ignore scan log failures */ });
  } catch {

  }

  return (
    <VerificationCard
      token={token}
      member={{
        noAnggota: member.noAnggota,
        nama: member.nama,
        jabatan: member.jabatan,
        alamat: [member.desa, member.kecamatan, member.kabupaten, member.provinsi].filter(Boolean).join(", ") + (member.rt && member.rw ? ` RT ${member.rt}/RW ${member.rw}` : ""),
        masaBerlaku: member.masaBerlaku.toISOString(),
        approvedAt: member.approvedAt?.toISOString() || null,
        hasFoto: !!member.fotoUrl,
        effectiveStatus,
        revokeReason: member.revokeReason,
      }}
      pengesah={member.leadershipPeriod ? {
        namaKetua: member.leadershipPeriod.namaKetua,
        jabatan: member.leadershipPeriod.jabatan,
        hasTtd: !!member.leadershipPeriod.tandaTanganUrl,
      } : null}
    />
  );
}
