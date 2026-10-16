import { Suspense } from "react";
import { MemberForm } from "@/components/members/member-form";

function FormSkeleton() {
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

export default function TambahAnggotaPage() {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <MemberForm mode="create" />
    </Suspense>
  );
}
