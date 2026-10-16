import { Suspense } from "react";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getMemberDetail } from "@/server/actions/member-queries";
import { MemberDetail } from "@/components/members/member-detail";

interface Props {
  params: Promise<{ id: string }>;
}

async function DetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const member = await getMemberDetail(id);
  if (!member) notFound();

  return <MemberDetail member={member} />;
}

function DetailSkeleton() {
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

export default function DetailAnggotaPage({ params }: Props) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <DetailContent params={params} />
    </Suspense>
  );
}
