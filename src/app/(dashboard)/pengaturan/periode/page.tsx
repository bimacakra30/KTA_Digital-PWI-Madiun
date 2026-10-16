"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { CalendarDays, Plus, Pencil, Trash2, CheckCircle, XCircle, Users, Upload } from "lucide-react";
import {
  getLeadershipPeriods,
  createLeadershipPeriod,
  updateLeadershipPeriod,
  deleteLeadershipPeriod,
} from "@/server/actions/leadership-actions";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface Period {
  id: string;
  namaKetua: string;
  jabatan: string;
  tandaTanganUrl: string | null;
  periodeMulai: string;
  periodeSelesai: string | null;
  isActive: boolean;
  memberCount: number;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export default function PeriodePage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadData = () => {
    getLeadershipPeriods()
      .then(setPeriods)
      .catch(() => toast.error("Gagal memuat data"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      try {
        if (editId) {
          await updateLeadershipPeriod(editId, formData);
          toast.success("Periode berhasil diperbarui");
        } else {
          await createLeadershipPeriod(formData);
          toast.success("Periode berhasil ditambahkan");
        }
        setShowForm(false);
        setEditId(null);
        loadData();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
      }
    });
  };

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const handleDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      try {
        await deleteLeadershipPeriod(deleteTarget.id);
        toast.success("Periode dihapus");
        loadData();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal menghapus");
      } finally {
        setDeleteTarget(null);
      }
    });
  };

  const editPeriod = periods.find((p) => p.id === editId);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded-lg w-56" />
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
              <CalendarDays className="w-5 h-5 text-emerald-600" />
            </div>
            Periode Kepengurusan
          </h1>
          <p className="text-gray-500 text-[14px] mt-1">Kelola periode dan tanda tangan ketua</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-[13px] font-semibold rounded-xl hover:bg-emerald-700 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Tambah Periode
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-[16px] font-bold text-gray-900 mb-4">
            {editId ? "Edit Periode" : "Tambah Periode Baru"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1">Nama Ketua *</label>
                <input name="namaKetua" defaultValue={editPeriod?.namaKetua ?? ""} required className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1">Jabatan *</label>
                <input name="jabatan" defaultValue={editPeriod?.jabatan ?? "Ketua Umum"} required className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1">Periode Mulai *</label>
                <input name="periodeMulai" type="date" defaultValue={editPeriod?.periodeMulai?.split("T")[0] ?? ""} required className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1">Periode Selesai</label>
                <input name="periodeSelesai" type="date" defaultValue={editPeriod?.periodeSelesai?.split("T")[0] ?? ""} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1">Tanda Tangan (gambar)</label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" /> Pilih file
                    <input name="tandaTangan" type="file" accept="image/*" className="hidden" />
                  </label>
                  {editPeriod?.tandaTanganUrl && <span className="text-[11px] text-gray-400">Sudah ada TTD</span>}
                </div>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input name="isActive" type="checkbox" value="true" defaultChecked={editPeriod?.isActive ?? true} className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                  <span className="text-[13px] font-medium text-gray-700">Periode Aktif</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={isPending} className="px-4 py-2 bg-emerald-600 text-white text-[13px] font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer">
                {isPending ? "Menyimpan..." : editId ? "Simpan Perubahan" : "Tambah"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="px-4 py-2 bg-gray-100 text-gray-600 text-[13px] font-medium rounded-xl hover:bg-gray-200 transition-colors cursor-pointer">
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {periods.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-gray-400 text-[15px]">Belum ada periode kepengurusan.</p>
          </div>
        ) : (
          periods.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[15px] font-bold text-gray-900">{p.namaKetua}</h3>
                    {p.isActive && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" /> Aktif
                      </span>
                    )}
                    {!p.isActive && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                        <XCircle className="w-3 h-3" /> Nonaktif
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-gray-500">{p.jabatan}</p>
                  <div className="flex items-center gap-4 mt-2 text-[12px] text-gray-400">
                    <span>{formatDate(p.periodeMulai)} — {p.periodeSelesai ? formatDate(p.periodeSelesai) : "Sekarang"}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {p.memberCount} anggota</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setEditId(p.id); setShowForm(true); }}
                    className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id, p.namaKetua)}
                    disabled={p.memberCount > 0}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title={p.memberCount > 0 ? "Tidak bisa hapus, masih ada anggota" : "Hapus"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Hapus Periode"
        message={`Yakin ingin menghapus periode "${deleteTarget?.name}"? Tindakan ini tidak bisa dibatalkan.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        variant="danger"
        loading={isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
