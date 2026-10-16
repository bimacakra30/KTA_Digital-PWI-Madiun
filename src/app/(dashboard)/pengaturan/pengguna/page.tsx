"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { UserCog, Plus, Pencil, ToggleLeft, ToggleRight, X } from "lucide-react";
import { getUsers, createUser, updateUser, toggleUserActive } from "@/server/actions/user-actions";

interface User {
  id: string;
  nama: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  SEKRETARIS: "Sekretaris",
  KETUA: "Ketua",
  SUPERADMIN: "Super Admin",
};

const ROLE_COLORS: Record<string, string> = {
  SEKRETARIS: "bg-emerald-50 text-emerald-700",
  KETUA: "bg-teal-50 text-teal-700",
  SUPERADMIN: "bg-green-50 text-green-800",
};

export default function PenggunaPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalUser, setModalUser] = useState<User | null | "new">(null); // null=closed, "new"=tambah, User=edit
  const [isPending, startTransition] = useTransition();

  const loadData = () => {
    getUsers()
      .then(setUsers)
      .catch(() => toast.error("Gagal memuat data"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const isEdit = modalUser !== "new" && modalUser !== null;
    const editId = isEdit ? (modalUser as User).id : null;

    startTransition(async () => {
      try {
        if (editId) {
          await updateUser(editId, formData);
          toast.success("User berhasil diperbarui");
        } else {
          await createUser(formData);
          toast.success("User berhasil ditambahkan");
        }
        setModalUser(null);
        loadData();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
      }
    });
  };

  const handleToggle = (id: string) => {
    startTransition(async () => {
      try {
        const result = await toggleUserActive(id);
        toast.success(result.isActive ? "User diaktifkan" : "User dinonaktifkan");
        loadData();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal mengubah status");
      }
    });
  };

  const isEdit = modalUser !== "new" && modalUser !== null;
  const editUser = isEdit ? (modalUser as User) : null;

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded-lg w-48" />
        <div className="h-48 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <UserCog className="w-5 h-5 text-emerald-600" />
            </div>
            Kelola Pengguna
          </h1>
          <p className="text-gray-500 text-[14px] mt-1">Kelola akun Sekretaris, Ketua, dan SuperAdmin</p>
        </div>
        <button
          onClick={() => setModalUser("new")}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-[13px] font-semibold rounded-xl hover:bg-emerald-700 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Tambah User
        </button>
      </div>

      {/* User List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-50">
          {users.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-gray-400 text-[15px]">Belum ada user.</p>
            </div>
          ) : (
            users.map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-semibold text-gray-900">{u.nama}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role] ?? "bg-gray-100 text-gray-600"}`}>
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                    {!u.isActive && (
                      <span className="text-[10px] font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Nonaktif</span>
                    )}
                  </div>
                  <p className="text-[12px] text-gray-400 mt-0.5">{u.email}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setModalUser(u)}
                    className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {u.role !== "SUPERADMIN" && (
                    <button
                      onClick={() => handleToggle(u.id)}
                      className={`p-2 rounded-lg transition-colors cursor-pointer ${u.isActive ? "text-emerald-500 hover:text-red-500 hover:bg-red-50" : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"}`}
                      title={u.isActive ? "Nonaktifkan" : "Aktifkan"}
                    >
                      {u.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {modalUser !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            style={{ animation: "fadeIn 150ms ease-out" }}
            onClick={() => setModalUser(null)}
          />

          {/* Modal content — key forces re-mount when switching users */}
          <div
            key={editUser?.id ?? "new"}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4"
            style={{ animation: "scaleIn 200ms ease-out" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h3 className="text-[16px] font-bold text-gray-900">
                {isEdit ? "Edit User" : "Tambah User Baru"}
              </h3>
              <button
                onClick={() => setModalUser(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Nama *</label>
                  <input
                    name="nama"
                    defaultValue={editUser?.nama ?? ""}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Email *</label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={editUser?.email ?? ""}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-gray-500 mb-1.5">
                    Password {isEdit && <span className="text-gray-400 font-normal">(opsional)</span>}
                    {!isEdit && " *"}
                  </label>
                  <input
                    name="password"
                    type="password"
                    minLength={6}
                    required={!isEdit}
                    placeholder={isEdit ? "Kosongkan jika tidak diubah" : "Min. 6 karakter"}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Role *</label>
                  <select
                    name="role"
                    defaultValue={editUser?.role ?? "SEKRETARIS"}
                    disabled={editUser?.role === "SUPERADMIN"}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-white disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                  >
                    <option value="SEKRETARIS">Sekretaris</option>
                    <option value="KETUA">Ketua</option>
                    {editUser?.role === "SUPERADMIN" && (
                      <option value="SUPERADMIN">Super Admin</option>
                    )}
                  </select>
                  {editUser?.role === "SUPERADMIN" && (
                    <p className="text-[11px] text-amber-600 mt-1">Role Super Admin tidak bisa diubah</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalUser(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white text-[13px] font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
