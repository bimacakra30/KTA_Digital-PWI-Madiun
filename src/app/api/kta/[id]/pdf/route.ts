import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { KtaDocument } from "@/components/kta/kta-document";
import React from "react";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";

export const dynamic = "force-dynamic";


async function getFileAsDataUrl(imageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return null;

    const arrayBuffer = await res.arrayBuffer();
    const rawBuffer = Buffer.from(arrayBuffer);
    const contentType = res.headers.get("content-type") || "";

    let buffer: Buffer;
    let mime: string;

    if (contentType.includes("webp") || imageUrl.endsWith(".webp")) {

      buffer = await sharp(rawBuffer).png().toBuffer();
      mime = "image/png";
    } else if (contentType.includes("png")) {
      buffer = rawBuffer;
      mime = "image/png";
    } else {
      buffer = rawBuffer;
      mime = "image/jpeg";
    }

    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      leadershipPeriod: {
        select: {
          namaKetua: true,
          jabatan: true,
          tandaTanganUrl: true,
        },
      },
    },
  });

  if (!member) {
    return NextResponse.json({ error: "Anggota tidak ditemukan" }, { status: 404 });
  }

  if (member.status === "DRAFT") {
    return NextResponse.json({ error: "KTA belum bisa dicetak untuk anggota berstatus Draft" }, { status: 400 });
  }


  const fotoDataUrl = member.fotoUrl ? await getFileAsDataUrl(member.fotoUrl) : null;

  let ttdDataUrl: string | null = null;
  if (member.leadershipPeriod?.tandaTanganUrl) {
    ttdDataUrl = await getFileAsDataUrl(member.leadershipPeriod.tandaTanganUrl);
  }


  const logoPath = path.join(process.cwd(), "public", "logo-pwi.png");
  let logoDataUrl: string;
  try {
    const logoBuffer = await fs.readFile(logoPath);
    logoDataUrl = `data:image/png;base64,${logoBuffer.toString("base64")}`;
  } catch {
    logoDataUrl = "";
  }


  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  let qrDataUrl = "";
  if (member.verifyToken) {
    const QRCode = (await import("qrcode")).default;
    const verifyUrl = `${baseUrl}/verifikasi/${member.verifyToken}`;
    qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#065f46", light: "#ffffff" },
    });
  }


  const alamat = [member.desa, member.kecamatan, member.kabupaten, member.provinsi]
    .filter(Boolean)
    .join(", ") + (member.rt && member.rw ? ` RT ${member.rt}/RW ${member.rw}` : "");


  const logoLaskarPath = path.join(process.cwd(), "public", "logo-laskar.png");
  let logoLaskarDataUrl: string;
  try {
    const laskarBuffer = await fs.readFile(logoLaskarPath);
    logoLaskarDataUrl = `data:image/png;base64,${laskarBuffer.toString("base64")}`;
  } catch {
    logoLaskarDataUrl = "";
  }

  const data = {
    noAnggota: member.noAnggota,
    nama: member.nama,
    jabatan: member.jabatan,
    tempatLahir: member.tempatLahir,
    tanggalLahir: member.tanggalLahir?.toISOString() ?? null,
    alamat,
    masaBerlaku: member.masaBerlaku.toISOString(),
    approvedAt: member.approvedAt?.toISOString() ?? null,
    fotoUrl: fotoDataUrl,
    qrUrl: qrDataUrl,
    pengesah: member.leadershipPeriod
      ? {
          nama: member.leadershipPeriod.namaKetua,
          jabatan: member.leadershipPeriod.jabatan,
          tandaTanganUrl: ttdDataUrl,
        }
      : null,
    logoUrl: logoDataUrl,
    logoLaskarUrl: logoLaskarDataUrl,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer = await renderToBuffer(
    React.createElement(KtaDocument, { data }) as any
  );

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="KTA-${member.noAnggota}.pdf"`,
    },
  });
}
