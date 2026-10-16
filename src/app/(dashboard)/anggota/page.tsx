import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getMembers } from "@/server/actions/member-queries";
import { MemberTable } from "@/components/members/member-table";
import { prisma } from "@/lib/prisma";

async function AnggotaContent() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [initialData, user] = await Promise.all([
    getMembers({ page: 1, perPage: 15 }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { batchDeleteEnabled: true },
    }),
  ]);

  return (
    <MemberTable
      initialData={initialData}
      batchDeleteEnabled={user?.batchDeleteEnabled ?? false}
    />
  );
}

function AnggotaSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 bg-gray-200 rounded-lg w-44" />
          <div className="h-5 bg-gray-100 rounded-lg w-36 mt-2" />
        </div>
        <div className="h-10 bg-gray-200 rounded-xl w-40" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="h-12 bg-gray-100 rounded-xl" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-20 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 border-b border-gray-50 px-5 flex items-center gap-4">
            <div className="w-9 h-9 bg-gray-100 rounded-full" />
            <div className="h-4 bg-gray-100 rounded w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnggotaPage() {
  return (
    <Suspense fallback={<AnggotaSkeleton />}>
      <AnggotaContent />
    </Suspense>
  );
}
