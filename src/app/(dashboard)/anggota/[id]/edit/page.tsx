import { Suspense } from "react";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getMemberDetail } from "@/server/actions/member-queries";
import { MemberForm } from "@/components/members/member-form";

interface Props {
  params: Promise<{ id: string }>;
}

async function EditContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const member = await getMemberDetail(id);
  if (!member) notFound();

  return (
    <MemberForm
      mode="edit"
      initialData={{
        id: member.id,
        noAnggota: member.noAnggota,
        nama: member.nama,
        jabatan: member.jabatan,
        tempatLahir: member.tempatLahir,
        tanggalLahir: member.tanggalLahir,
        provinsi: member.provinsi,
        kabupaten: member.kabupaten,
        kecamatan: member.kecamatan,
        desa: member.desa,
        rt: member.rt,
        rw: member.rw,
        tanggalBergabung: member.tanggalBergabung,
        masaBerlaku: member.masaBerlaku,
        fotoUrl: member.fotoUrl,
      }}
    />
  );
}

function EditSkeleton() {
  return (
    <div className="max-w-2xl animate-pulse space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-gray-200 rounded-xl" />
        <div className="h-7 bg-gray-200 rounded-lg w-40" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 h-40" />
      <div className="bg-white rounded-2xl border border-gray-100 p-6 h-72" />
    </div>
  );
}

export default function EditAnggotaPage({ params }: Props) {
  return (
    <Suspense fallback={<EditSkeleton />}>
      <EditContent params={params} />
    </Suspense>
  );
}
