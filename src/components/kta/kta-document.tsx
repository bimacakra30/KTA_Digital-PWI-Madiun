import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import path from "path";

// Register local fonts
const fontsDir = path.join(process.cwd(), "public", "fonts");

Font.register({
  family: "PlusJakarta",
  fonts: [
    { src: path.join(fontsDir, "PlusJakartaSans-Regular.ttf"), fontWeight: 400 },
    { src: path.join(fontsDir, "PlusJakartaSans-SemiBold.ttf"), fontWeight: 600 },
    { src: path.join(fontsDir, "PlusJakartaSans-Bold.ttf"), fontWeight: 700 },
  ],
});

// CR80 card size: 85.6mm × 53.98mm → convert to points (1mm = 2.835pt)
const CARD_W = 242.6;
const CARD_H = 153;

const GREEN_DARK = "#0a3d2a";
const GREEN = "#0d5c3f";
const GREEN_LIGHT = "#14704e";
const GOLD = "#c5963a";
const WHITE = "#ffffff";
const DARK = "#1f2937";
const CREAM = "#f5f0e0";

const s = StyleSheet.create({
  page: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    padding: 20,
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    backgroundColor: CREAM,
    borderRadius: 6,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1.5,
    borderColor: GOLD,
  },
  // Header
  header: {
    backgroundColor: GREEN,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderBottomWidth: 1.5,
    borderBottomColor: GOLD,
  },
  logo: { width: 30, height: 30, objectFit: "contain" },
  logoRight: { width: 28, height: 30, objectFit: "contain" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: {
    fontFamily: "PlusJakarta",
    fontWeight: 700,
    fontSize: 7,
    color: GOLD,
    letterSpacing: 0.8,
    textAlign: "center",
  },
  headerMain: {
    fontFamily: "PlusJakarta",
    fontWeight: 700,
    fontSize: 13,
    color: WHITE,
    letterSpacing: 2,
    textAlign: "center",
    marginVertical: 1,
  },
  headerSub: {
    fontFamily: "PlusJakarta",
    fontWeight: 700,
    fontSize: 7,
    color: GOLD,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  // Sub-header bar
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 2,
    gap: 4,
  },
  subHeaderBar: {
    flex: 1,
    backgroundColor: GREEN,
    borderRadius: 2,
    paddingVertical: 1.5,
    alignItems: "center",
  },
  subHeaderText: {
    fontFamily: "PlusJakarta",
    fontWeight: 700,
    fontSize: 6,
    color: WHITE,
    letterSpacing: 1.5,
  },
  ktaBadge: {
    backgroundColor: GOLD,
    borderRadius: 2,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
  },
  ktaBadgeText: {
    fontFamily: "PlusJakarta",
    fontWeight: 700,
    fontSize: 7.5,
    color: WHITE,
    letterSpacing: 1,
  },
  // Body
  body: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingTop: 4,
    paddingBottom: 14,
    gap: 8,
    flex: 1,
  },
  photoCol: { width: 58, flexShrink: 0 },
  photoWrap: {
    width: 58,
    height: 68,
    borderRadius: 3,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: GREEN,
    backgroundColor: "#e5e7eb",
  },
  photo: { width: "100%", height: "100%", objectFit: "cover" },
  photoName: {
    fontFamily: "PlusJakarta",
    fontWeight: 700,
    fontSize: 5,
    color: GREEN,
    textAlign: "center",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  dataCol: { flex: 1, justifyContent: "space-between" },
  dataRow: { flexDirection: "row", marginBottom: 1.5 },
  dataLabel: {
    fontFamily: "PlusJakarta",
    fontWeight: 700,
    fontSize: 5.5,
    color: DARK,
    width: 45,
  },
  dataSep: {
    fontFamily: "PlusJakarta",
    fontWeight: 700,
    fontSize: 5.5,
    color: DARK,
    marginHorizontal: 2,
  },
  dataValue: {
    fontFamily: "PlusJakarta",
    fontWeight: 600,
    fontSize: 5.5,
    color: DARK,
    flex: 1,
  },
  // Bottom section
  bottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 3,
  },
  qrArea: { flexDirection: "row", alignItems: "center", gap: 4 },
  qrImage: { width: 30, height: 30, borderRadius: 2 },
  mottoText: {
    fontFamily: "PlusJakarta",
    fontWeight: 700,
    fontSize: 3.5,
    color: GREEN,
    lineHeight: 1.5,
  },
  endorseArea: { alignItems: "center" },
  endorseDate: {
    fontFamily: "PlusJakarta",
    fontWeight: 400,
    fontSize: 4,
    color: DARK,
  },
  endorseTitle: {
    fontFamily: "PlusJakarta",
    fontWeight: 600,
    fontSize: 4.5,
    color: DARK,
  },
  endorseName: {
    fontFamily: "PlusJakarta",
    fontWeight: 700,
    fontSize: 5,
    color: GREEN,
    textTransform: "uppercase",
    marginTop: 8,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: GREEN_DARK,
    borderTopWidth: 1,
    borderTopColor: GOLD,
    paddingVertical: 2.5,
    alignItems: "center",
  },
  footerText: {
    fontFamily: "PlusJakarta",
    fontWeight: 700,
    fontSize: 4.5,
    color: GOLD,
    letterSpacing: 2,
  },
  // Gold accent
  goldBorderTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: GOLD,
  },
});

export interface KtaPdfData {
  noAnggota: string;
  nama: string;
  jabatan: string | null;
  tempatLahir: string | null;
  tanggalLahir: string | null;
  alamat: string;
  masaBerlaku: string;
  approvedAt: string | null;
  fotoUrl: string | null;
  qrUrl: string;
  pengesah: {
    nama: string;
    jabatan: string;
    tandaTanganUrl: string | null;
  } | null;
  logoUrl: string;
  logoLaskarUrl: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export function KtaDocument({ data }: { data: KtaPdfData }) {
  return (
    <Document title={`KTA - ${data.nama}`} author="Sistem KTA Digital">
      <Page size={[CARD_W + 40, CARD_H + 40]} style={s.page}>
        <View style={s.card}>
          {/* ── Header ── */}
          <View style={s.header}>
            {data.logoUrl ? <Image src={data.logoUrl} style={s.logo} /> : null}
            <View style={s.headerCenter}>
              <Text style={s.headerTitle}>DEWAN PIMPINAN DAERAH</Text>
              <Text style={s.headerMain}>PWI - LS</Text>
              <Text style={s.headerSub}>KABUPATEN MADIUN</Text>
            </View>
            {data.logoLaskarUrl ? <Image src={data.logoLaskarUrl} style={s.logoRight} /> : null}
          </View>

          {/* ── Sub-header ── */}
          <View style={s.subHeader}>
            <View style={s.subHeaderBar}>
              <Text style={s.subHeaderText}>KARTU TANDA ANGGOTA</Text>
            </View>
            <View style={s.ktaBadge}>
              <Text style={s.ktaBadgeText}>KTA</Text>
            </View>
          </View>

          {/* ── Body ── */}
          <View style={s.body}>
            {/* Photo column */}
            <View style={s.photoCol}>
              <View style={s.photoWrap}>
                {data.fotoUrl ? (
                  <Image src={data.fotoUrl} style={s.photo} />
                ) : (
                  <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 16, color: "#9CA3AF" }}>?</Text>
                  </View>
                )}
              </View>
              <Text style={s.photoName}>{data.nama}</Text>
            </View>

            {/* Data column */}
            <View style={s.dataCol}>
              <View>
                <View style={s.dataRow}>
                  <Text style={s.dataLabel}>NO. ANGGOTA</Text>
                  <Text style={s.dataSep}>:</Text>
                  <Text style={s.dataValue}>{data.noAnggota}</Text>
                </View>
                <View style={s.dataRow}>
                  <Text style={s.dataLabel}>NAMA</Text>
                  <Text style={s.dataSep}>:</Text>
                  <Text style={s.dataValue}>{data.nama}</Text>
                </View>
                <View style={s.dataRow}>
                  <Text style={s.dataLabel}>ALAMAT</Text>
                  <Text style={s.dataSep}>:</Text>
                  <Text style={s.dataValue}>{data.alamat || "—"}</Text>
                </View>
                <View style={s.dataRow}>
                  <Text style={s.dataLabel}>JABATAN</Text>
                  <Text style={s.dataSep}>:</Text>
                  <Text style={s.dataValue}>{data.jabatan || "—"}</Text>
                </View>
              </View>

              {/* Bottom: QR + Endorsement */}
              <View style={s.bottom}>
                <View style={s.qrArea}>
                  {data.qrUrl ? (
                    <Image src={data.qrUrl} style={s.qrImage} />
                  ) : (
                    <View style={{ width: 30, height: 30, backgroundColor: "#e5e7eb", borderRadius: 2, alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ fontSize: 4, color: "#9CA3AF" }}>No QR</Text>
                    </View>
                  )}
                  <View>
                    <Text style={s.mottoText}>SATU KOMANDO</Text>
                    <Text style={s.mottoText}>SATU TUJUAN</Text>
                    <Text style={s.mottoText}>UNTUK UMAT</Text>
                    <Text style={s.mottoText}>DAN BANGSA</Text>
                  </View>
                </View>

                <View style={s.endorseArea}>
                  <Text style={s.endorseDate}>Madiun, {data.approvedAt ? formatDate(data.approvedAt) : "—"}</Text>
                  <Text style={s.endorseTitle}>Ketua,</Text>
                  {data.pengesah?.tandaTanganUrl && (
                    <Image src={data.pengesah.tandaTanganUrl} style={{ width: 30, height: 15, objectFit: "contain", marginTop: 1 }} />
                  )}
                  <Text style={s.endorseName}>{data.pengesah?.nama || "—"}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Footer ── */}
          <View style={s.footer}>
            <Text style={s.footerText}>LOYALITAS  -  SOLIDARITAS  -  DAKWAH  -  PENGABDIAN</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
