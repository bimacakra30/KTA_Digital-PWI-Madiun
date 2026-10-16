"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Eye, EyeOff, ShieldCheck, CreditCard, QrCode, Users } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError("Email atau password salah.");
      } else if (result?.url) {
        const url = new URL(result.url);
        router.push(url.pathname + url.search);
        router.refresh();
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      console.error("[Login] signIn error:", err);
      setError("Email atau password salah.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ─── LEFT PANEL (Desktop only) ─── */}
      <div
        className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative flex-col justify-between p-14 xl:p-20 overflow-hidden"
        style={{ background: "linear-gradient(155deg, #064e3b 0%, #065f46 20%, #047857 45%, #059669 70%, #0d9488 100%)" }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-[380px] h-[380px] rounded-full bg-white/5" />
        <div className="absolute top-1/3 -right-16 w-56 h-56 rounded-full bg-white/5" />
        <div className="absolute -bottom-24 -left-16 w-[320px] h-[320px] rounded-full bg-white/5" />
        <div className="absolute bottom-1/4 right-1/3 w-32 h-32 rounded-full bg-white/5" />

        {/* Top logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/10 overflow-hidden flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-pwi.png" alt="Logo PWI" className="w-8 h-8 object-contain" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">KTA Digital</span>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10">
          <h1 className="text-4xl xl:text-[2.75rem] font-bold text-white leading-tight">
            Kelola Keanggotaan
            <br />
            <span className="text-emerald-200">Lebih Mudah</span>
          </h1>
          <p className="text-emerald-100/70 text-base mt-4 max-w-sm leading-relaxed">
            Sistem digital untuk penerbitan dan verifikasi Kartu Tanda Anggota dengan QR Code yang aman.
          </p>

          {/* Feature list */}
          <div className="mt-10 space-y-4">
            {[
              { icon: CreditCard, label: "Penerbitan KTA digital otomatis" },
              { icon: QrCode, label: "Verifikasi QR Code real-time" },
              { icon: Users, label: "Manajemen anggota terpusat" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4 text-emerald-200" />
                </div>
                <span className="text-white/75 text-sm">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom org name */}
        <div className="relative z-10">
          <p className="text-emerald-100/40 text-sm">PWI-LS Kabupaten Madiun &copy; {new Date().getFullYear()}</p>
        </div>
      </div>

      {/* ─── RIGHT PANEL — Form ─── */}
      <div className="flex-1 flex flex-col">

        {/* Mobile: green header */}
        <div
          className="lg:hidden relative overflow-hidden"
          style={{ background: "linear-gradient(160deg, #065f46 0%, #047857 30%, #059669 60%, #0d9488 100%)" }}
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute top-10 -right-4 w-24 h-24 rounded-full bg-white/5" />

          <div className="relative z-10 px-8 pt-14 pb-16 max-w-sm mx-auto">
            <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/10 flex items-center justify-center mb-5">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-[1.85rem] font-bold text-white leading-tight">
              Selamat datang<br />kembali
            </h1>
            <p className="text-emerald-100/75 text-[15px] mt-2">
              Silakan masuk untuk mengelola KTA Digital.
            </p>
          </div>

          {/* Curve overlap */}
          <div className="h-8 bg-gray-50 rounded-t-[24px]" />
        </div>

        {/* Form area */}
        <div className="flex-1 bg-gray-50 lg:bg-white flex items-start lg:items-center justify-center px-6 sm:px-10 lg:px-16 xl:px-24 pt-2 lg:pt-0 pb-12">
          <div className="w-full max-w-[400px]">

            {/* Desktop heading */}
            <div className="hidden lg:block mb-10">
              <h2 className="text-[1.75rem] font-bold text-gray-900">Selamat datang kembali</h2>
              <p className="text-gray-500 text-[15px] mt-2">Masuk untuk mengelola Kartu Tanda Anggota.</p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                <p className="text-[15px] text-red-600">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-[15px] font-semibold text-gray-800 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all duration-200 shadow-sm"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-[15px] font-semibold text-gray-800 mb-2">
                  Kata sandi
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan kata sandi"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full px-4 py-3.5 pr-12 rounded-xl border border-gray-200 bg-white text-gray-900 text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all duration-200 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-semibold text-[15px] text-white shadow-lg shadow-emerald-700/20 hover:shadow-emerald-700/30 active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #065f46 0%, #059669 60%, #0d9488 100%)" }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Masuk"
                  )}
                </button>
              </div>
            </form>

            {/* Footer */}
            <div className="mt-10 text-center">
              <p className="text-sm text-emerald-700/50 leading-relaxed">
                Hanya untuk staf yang berwenang.
                <br />
                Semua aktivitas login dicatat oleh sistem.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

function LoginSkeleton() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:block lg:w-[52%] xl:w-[55%]"
        style={{ background: "linear-gradient(155deg, #064e3b 0%, #059669 70%, #0d9488 100%)" }} />
      <div className="flex-1 flex items-center justify-center px-10">
        <div className="w-full max-w-[400px] space-y-5 animate-pulse">
          <div className="h-9 bg-gray-200 rounded-lg w-64" />
          <div className="h-5 bg-gray-100 rounded w-48" />
          <div className="h-14 bg-gray-100 rounded-xl mt-8" />
          <div className="h-14 bg-gray-100 rounded-xl" />
          <div className="h-14 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}
