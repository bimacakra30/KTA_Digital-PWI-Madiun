"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { User, Mail, Lock, Shield, ArrowLeft, Eye, EyeOff, KeyRound, Settings2, Trash2 } from "lucide-react";
import { updateProfile, changePassword, toggleBatchDelete } from "@/server/actions/settings-actions";

interface SettingsUser {
  id: string;
  nama: string;
  email: string;
  role: string;
  batchDeleteEnabled: boolean;
}

export function SettingsForm({ user }: { user: SettingsUser }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Profile
  const [nama, setNama] = useState(user.nama);
  const [email, setEmail] = useState(user.email);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Batch delete toggle
  const [batchDelete, setBatchDelete] = useState(user.batchDeleteEnabled);

  function getRoleLabel(role: string) {
    return { SEKRETARIS: "Sekretaris", KETUA: "Ketua", SUPERADMIN: "Super Admin" }[role] ?? role;
  }

  function handleProfileSave() {
    startTransition(async () => {
      try {
        await updateProfile({ nama, email });
        toast.success("Profil berhasil diperbarui.");
        router.refresh();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Gagal memperbarui profil.");
      }
    });
  }

  function handlePasswordSave() {
    if (newPassword !== confirmPassword) {
      toast.error("Password baru dan konfirmasi tidak cocok.");
      return;
    }
    startTransition(async () => {
      try {
        await changePassword({ currentPassword, newPassword });
        toast.success("Password berhasil diubah.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Gagal mengubah password.");
      }
    });
  }

  function handleBatchDeleteToggle() {
    const newValue = !batchDelete;
    setBatchDelete(newValue);
    startTransition(async () => {
      try {
        await toggleBatchDelete(newValue);
        toast.success(newValue ? "Fitur hapus massal diaktifkan." : "Fitur hapus massal dinonaktifkan.");
      } catch (err: unknown) {
        setBatchDelete(!newValue);
        toast.error(err instanceof Error ? err.message : "Gagal mengubah pengaturan.");
      }
    });
  }

  const inputClass =
    "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pengaturan Akun</h1>
          <p className="text-gray-500 text-[13px]">Kelola informasi akun dan preferensi.</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Row 1: Profile card + Profile form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
          {/* Profile card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center justify-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md"
              style={{ background: "linear-gradient(135deg, #047857, #0d9488)" }}
            >
              {nama.charAt(0).toUpperCase()}
            </div>
            <p className="text-[15px] font-bold text-gray-900 leading-tight mt-3">{nama}</p>
            <p className="text-[12px] text-gray-400 mt-0.5">{email}</p>
            <span className="inline-block mt-1.5 text-[10.5px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              {getRoleLabel(user.role)}
            </span>
          </div>

          {/* Profile form */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
            <h3 className="text-[13px] font-bold text-gray-800 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              Informasi Profil
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1">Nama</label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className={inputClass}
                  placeholder="Nama lengkap"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${inputClass} pl-10`}
                    placeholder="email@example.com"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={handleProfileSave}
                disabled={isPending}
                className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white cursor-pointer disabled:opacity-50 active:scale-[0.98] transition-all shadow-sm"
                style={{ background: "linear-gradient(135deg, #065f46 0%, #059669 60%, #0d9488 100%)" }}
              >
                Simpan Profil
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Feature toggle + Password form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
          {/* Feature settings */}
          {user.role === "SEKRETARIS" ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
              <h3 className="text-[13px] font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-emerald-600" />
                Pengaturan Fitur
              </h3>
              <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-gray-50/80 border border-gray-100 flex-1">
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-gray-800">Hapus Massal</p>
                    <p className="text-[10.5px] text-gray-400 mt-0.5 leading-relaxed">
                      Tampilkan checkbox dan tombol hapus massal di daftar anggota.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleBatchDeleteToggle}
                  disabled={isPending}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 flex-shrink-0 ${batchDelete ? "bg-emerald-500" : "bg-gray-200"}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${batchDelete ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
              </div>
            </div>
          ) : (
            <div className="hidden lg:block" />
          )}

          {/* Password form */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
            <h3 className="text-[13px] font-bold text-gray-800 mb-4 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-600" />
              Ubah Password
            </h3>
            <div className="space-y-3 flex-1">
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1">Password Lama</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={`${inputClass} pl-10 pr-10`}
                    placeholder="Masukkan password lama"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-gray-500 mb-1">Password Baru</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`${inputClass} pr-10`}
                      placeholder="Minimal 6 karakter"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-500 mb-1">Konfirmasi Password Baru</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputClass}
                    placeholder="Ketik ulang password baru"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={handlePasswordSave}
                disabled={isPending || !currentPassword || !newPassword}
                className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white cursor-pointer disabled:opacity-50 active:scale-[0.98] transition-all shadow-sm"
                style={{ background: "linear-gradient(135deg, #065f46 0%, #059669 60%, #0d9488 100%)" }}
              >
                Ubah Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
