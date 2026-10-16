import { NextRequest, NextResponse } from "next/server";

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const relativePath = segments.join("/");

  if (relativePath.includes("..")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (!R2_PUBLIC_URL) {
    return new NextResponse("Storage not configured", { status: 500 });
  }

  return NextResponse.redirect(`${R2_PUBLIC_URL}/${relativePath}`, {
    status: 301,
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
