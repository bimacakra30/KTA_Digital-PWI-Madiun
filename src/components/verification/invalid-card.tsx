import Image from "next/image";

const C = {
  bg: "#F3F6F4",
  muted: "#4A5F56",
  line: "#E4ECE8",
  onHeaderMuted: "rgba(255,255,255,0.5)",
};

export function InvalidCard() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: C.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
        color: "#10231B",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 8px 32px rgba(16,35,27,0.10)" }}>
          {/* Header */}
          <div style={{ background: "#9B1C1C", color: "#fff", padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <Image src="/logo-pwi.png" alt="Logo" width={48} height={48} style={{ objectFit: "contain", flexShrink: 0 }} priority />
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.2 }}>Perjuangan Walisongo Indonesia</div>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: C.onHeaderMuted, marginTop: 2 }}>Sistem KTA Digital</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 18, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9B1C1C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6z" />
                  <path d="M12 8v5M12 16.5v.01" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.2 }}>KTA Tidak Valid</div>
                <div style={{ fontSize: 11, color: C.onHeaderMuted, marginTop: 1 }}>Data tidak ditemukan di database</div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: "24px 22px", textAlign: "center" }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: C.muted, lineHeight: 1.6, margin: 0 }}>
              Kartu Tanda Anggota yang Anda pindai tidak dapat diverifikasi. Token tidak ditemukan atau sudah tidak berlaku.
            </p>
            <div style={{ marginTop: 16, padding: "12px 14px", background: "#FBE6E6", borderRadius: 10, fontSize: 12, fontWeight: 500, color: "#9B1C1C", lineHeight: 1.5 }}>
              Hubungi sekretariat organisasi jika Anda yakin ini adalah KTA resmi.
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: "12px 22px", borderTop: `1px solid ${C.line}`, textAlign: "center", fontSize: 11, color: C.muted }}>
            Sistem KTA Digital — Verifikasi Keanggotaan
          </div>
        </div>
      </div>
    </main>
  );
}
