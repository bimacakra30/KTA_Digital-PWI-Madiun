"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { createMember, updateMember } from "@/server/actions/member-actions";
import { ArrowLeft, Upload, User, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { AlamatFields } from "@/components/members/alamat-fields";

interface MemberFormProps {
  mode: "create" | "edit";
  initialData?: {
    id: string;
    noAnggota: string;
    nama: string;
    jabatan: string | null;
    tempatLahir: string | null;
    tanggalLahir: string | null;
    provinsi: string | null;
    kabupaten: string | null;
    kecamatan: string | null;
    desa: string | null;
    rt: string | null;
    rw: string | null;
    tanggalBergabung: string;
    masaBerlaku: string;
    fotoUrl: string | null;
  };
}

export function MemberForm({ mode, initialData }: MemberFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialData?.fotoUrl ?? null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB.");
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function removePhoto() {
    setPhotoPreview(null);
    setPhotoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Add photo file if selected
    if (photoFile) {
      formData.set("foto", photoFile);
    }

    // Default consent to true for simplicity
    formData.set("consent", "true");

    startTransition(async () => {
      try {
        if (mode === "create") {
          await createMember(formData);
          toast.success("Anggota berhasil ditambahkan!");
        } else if (initialData) {
          await updateMember(initialData.id, formData);
          toast.success("Data anggota berhasil diperbarui!");
        }
        router.push("/anggota");
        router.refresh();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
        if (message.includes("Unique constraint") || message.includes("noAnggota")) {
          setErrors({ noAnggota: "Nomor anggota sudah digunakan." });
        } else {
          toast.error(message);
        }
      }
    });
  }

  const defaultBergabung = initialData?.tanggalBergabung
    ? new Date(initialData.tanggalBergabung).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  const defaultBerlaku = initialData?.masaBerlaku
    ? new Date(initialData.masaBerlaku).toISOString().split("T")[0]
    : "";

  return (
    <div>
      <form onSubmit={handleSubmit}>
        {/* Header with actions */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {mode === "create" ? "Tambah Anggota" : "Edit Anggota"}
              </h1>
              <p className="text-gray-500 text-[13px]">
                {mode === "create" ? "Isi data anggota baru." : "Perbarui data anggota."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={isPending}
              className="px-4 py-2 rounded-xl text-[13px] font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-[13px] text-white shadow-md shadow-emerald-700/15 hover:shadow-emerald-700/25 active:scale-[0.98] transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #065f46 0%, #059669 60%, #0d9488 100%)" }}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : mode === "create" ? (
                "Tambah Anggota"
              ) : (
                "Simpan Perubahan"
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4" style={{ minHeight: 'calc(100vh - 10rem)' }}>
          {/* ── Left Column: Foto + Keanggotaan (merged) ── */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 w-full flex flex-col h-full">
              {/* Photo upload */}
              <div className="flex-1 flex flex-col items-center justify-center gap-2 mb-4">
                <label className="block text-[13px] font-semibold text-gray-800 mb-1 self-start">
                  Foto Anggota
                </label>
                <div className="relative">
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-32 h-[170px] rounded-xl object-cover border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm hover:bg-red-600 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-[170px] rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
                      <User className="w-10 h-10 text-gray-300 mb-1" />
                      <span className="text-[11px] text-gray-400">3:4</span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-[12px] font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {photoPreview ? "Ganti Foto" : "Upload Foto"}
                </button>
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  JPG/PNG/WebP. Maks 5MB.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100" />

              {/* Keanggotaan */}
              <div className="space-y-3">
                <h3 className="text-[13px] font-bold text-gray-800">Keanggotaan</h3>

                {/* Tanggal Bergabung */}
                <div>
                  <label htmlFor="tanggalBergabung" className="block text-[12px] font-medium text-gray-500 mb-1">
                    Tanggal Bergabung <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="tanggalBergabung"
                    name="tanggalBergabung"
                    type="date"
                    defaultValue={defaultBergabung}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                  />
                </div>

                {/* Masa Berlaku */}
                <div>
                  <label htmlFor="masaBerlaku" className="block text-[12px] font-medium text-gray-500 mb-1">
                    Masa Berlaku Sampai <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="masaBerlaku"
                    name="masaBerlaku"
                    type="date"
                    defaultValue={defaultBerlaku}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                  />
                </div>

                {/* Status */}
                <div>
                  <label htmlFor="status" className="block text-[12px] font-medium text-gray-500 mb-1">
                    Status Awal
                  </label>
                  <select
                    id="status"
                    name="status"
                    defaultValue={mode === "create" ? "DISETUJUI" : undefined}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                  >
                    <option value="DISETUJUI">Aktif</option>
                    <option value="DRAFT">Draft (perlu persetujuan)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Column: Data Anggota + Alamat ── */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {/* Data Anggota */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
              <h3 className="text-[13px] font-bold text-gray-800">Data Anggota</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* No Anggota */}
                <div>
                  <label htmlFor="noAnggota" className="block text-[12px] font-medium text-gray-500 mb-1">
                    Nomor Anggota <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="noAnggota"
                    name="noAnggota"
                    type="text"
                    defaultValue={initialData?.noAnggota ?? ""}
                    required
                    placeholder="Contoh: 0006/KTA/2026"
                    className={`w-full px-3 py-2 rounded-lg border bg-white text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all ${
                      errors.noAnggota ? "border-red-300 bg-red-50/50" : "border-gray-200"
                    }`}
                  />
                  {errors.noAnggota && (
                    <p className="text-[11px] text-red-500 mt-0.5">{errors.noAnggota}</p>
                  )}
                </div>

                {/* Nama */}
                <div>
                  <label htmlFor="nama" className="block text-[12px] font-medium text-gray-500 mb-1">
                    Nama Lengkap <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="nama"
                    name="nama"
                    type="text"
                    defaultValue={initialData?.nama ?? ""}
                    required
                    placeholder="Nama lengkap anggota"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Jabatan */}
                <div>
                  <label htmlFor="jabatan" className="block text-[12px] font-medium text-gray-500 mb-1">
                    Jabatan
                  </label>
                  <input
                    id="jabatan"
                    name="jabatan"
                    type="text"
                    defaultValue={initialData?.jabatan ?? ""}
                    placeholder="Jabatan (opsional)"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                  />
                </div>

                {/* Tempat Lahir */}
                <div>
                  <label htmlFor="tempatLahir" className="block text-[12px] font-medium text-gray-500 mb-1">
                    Tempat Lahir
                  </label>
                  <input
                    id="tempatLahir"
                    name="tempatLahir"
                    type="text"
                    defaultValue={initialData?.tempatLahir ?? ""}
                    placeholder="Kota/Kabupaten"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                  />
                </div>

                {/* Tanggal Lahir */}
                <div>
                  <label htmlFor="tanggalLahir" className="block text-[12px] font-medium text-gray-500 mb-1">
                    Tanggal Lahir
                  </label>
                  <input
                    id="tanggalLahir"
                    name="tanggalLahir"
                    type="date"
                    defaultValue={initialData?.tanggalLahir ? new Date(initialData.tanggalLahir).toISOString().split("T")[0] : ""}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Alamat */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex-1">
              <AlamatFields
                defaultValue={{
                  provinsi: initialData?.provinsi ?? "",
                  kabupaten: initialData?.kabupaten ?? "",
                  kecamatan: initialData?.kecamatan ?? "",
                  desa: initialData?.desa ?? "",
                  rt: initialData?.rt ?? "",
                  rw: initialData?.rw ?? "",
                }}
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
