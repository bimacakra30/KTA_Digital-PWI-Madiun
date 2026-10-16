"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Users,
  LayoutDashboard,
  FileCheck,
  CreditCard,
  UserCog,
  CalendarDays,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  BarChart3,
  Settings,
  Eye,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["SEKRETARIS", "KETUA", "SUPERADMIN"] },
  { label: "Daftar Anggota", href: "/anggota", icon: Users, roles: ["SEKRETARIS"] },
  { label: "Persetujuan", href: "/persetujuan", icon: FileCheck, roles: ["SEKRETARIS"] },
  { label: "Kartu Anggota", href: "/kta", icon: CreditCard, roles: ["SEKRETARIS"] },
  { label: "Monitoring", href: "/monitoring", icon: Eye, roles: ["KETUA"] },
  { label: "Audit Log", href: "/audit-log", icon: BarChart3, roles: ["SEKRETARIS", "KETUA", "SUPERADMIN"] },
  { label: "Periode Kepengurusan", href: "/pengaturan/periode", icon: CalendarDays, roles: ["SEKRETARIS"] },
  { label: "Kelola Pengguna", href: "/pengaturan/pengguna", icon: UserCog, roles: ["SUPERADMIN"] },
];

function getRoleLabel(role: string) {
  return { SEKRETARIS: "Sekretaris", KETUA: "Ketua", SUPERADMIN: "Super Admin" }[role] ?? role;
}

function getRoleBadgeStyle(role: string) {
  return {
    SEKRETARIS: "bg-emerald-100 text-emerald-700",
    KETUA: "bg-teal-100 text-teal-700",
    SUPERADMIN: "bg-green-100 text-green-800",
  }[role] ?? "bg-gray-100 text-gray-600";
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const userRole = session?.user?.role ?? "";
  const filteredNav = navItems.filter((item) => item.roles.includes(userRole));
  const initials = session?.user?.nama?.charAt(0)?.toUpperCase() ?? "?";

  const sidebarContent = (
    <div className="flex flex-col h-full" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>

      {/* Logo */}
      <div className="px-5 py-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex-shrink-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-pwi.png" alt="Logo PWI" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-gray-900 leading-tight">KTA Digital</p>
            <p className="text-[11px] text-gray-400 leading-tight">PWI-LS Kabupaten Madiun</p>
          </div>
        </Link>
      </div>

      <div className="mx-5 h-px bg-gray-100" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-150 ${
                isActive
                  ? "text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
              style={isActive ? { background: "linear-gradient(135deg, #065f46, #059669)" } : {}}
            >
              <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? "text-white" : "text-gray-400"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mx-5 h-px bg-gray-100" />

      {/* Settings link */}
      <div className="px-3 py-2">
        <Link
          href="/pengaturan"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-150 ${
            pathname === "/pengaturan"
              ? "text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
          style={pathname === "/pengaturan" ? { background: "linear-gradient(135deg, #065f46, #059669)" } : {}}
        >
          <Settings className={`w-[18px] h-[18px] flex-shrink-0 ${pathname === "/pengaturan" ? "text-white" : "text-gray-400"}`} />
          Pengaturan
        </Link>
      </div>

      {/* User info */}
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0 shadow-sm"
            style={{ background: "linear-gradient(135deg, #047857, #0d9488)" }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13.5px] font-semibold text-gray-900 truncate leading-tight">
              {session?.user?.nama}
            </p>
            <span className={`inline-block text-[10.5px] font-medium px-2 py-0.5 rounded-full mt-0.5 ${getRoleBadgeStyle(userRole)}`}>
              {getRoleLabel(userRole)}
            </span>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13.5px] font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all duration-150 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-white border border-gray-200 text-gray-700 shadow-md"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-60 bg-white border-r border-gray-100 shadow-sm transform transition-transform duration-200 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
