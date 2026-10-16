"use client";

import { Suspense } from "react";
import { SessionProvider } from "next-auth/react";
import { Sidebar } from "@/components/layout/sidebar";

function SidebarSkeleton() {
  return (
    <aside className="hidden lg:block w-60 bg-white border-r border-gray-100">
      <div className="p-5 animate-pulse">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 bg-gray-200 rounded-xl" />
          <div className="h-5 bg-gray-200 rounded w-24" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    </aside>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="flex h-screen bg-gray-50" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>
        <Suspense fallback={<SidebarSkeleton />}>
          <Sidebar />
        </Suspense>
        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </SessionProvider>
  );
}
