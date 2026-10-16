import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDraftMembers } from "@/server/actions/member-queries";
import { ApprovalTable } from "@/components/members/approval-table";

async function PersetujuanContent() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const initialData = await getDraftMembers({ page: 1, perPage: 15 });

  return <ApprovalTable initialData={initialData} />;
}

function PersetujuanSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div>
        <div className="h-8 bg-gray-200 rounded-lg w-44" />
        <div className="h-5 bg-gray-100 rounded-lg w-56 mt-2" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="h-12 bg-gray-100 rounded-xl" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 border-b border-gray-50 px-5 flex items-center gap-4">
            <div className="w-9 h-9 bg-gray-100 rounded-full" />
            <div className="h-4 bg-gray-100 rounded w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PersetujuanPage() {
  return (
    <Suspense fallback={<PersetujuanSkeleton />}>
      <PersetujuanContent />
    </Suspense>
  );
}
