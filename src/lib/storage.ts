import sharp from "sharp";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2, R2_BUCKET, R2_PUBLIC_URL } from "./r2";

export async function savePhoto(
  file: File,
  filename: string
): Promise<string> {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Tipe file tidak didukung. Gunakan JPG, PNG, atau WebP.");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Ukuran file maksimal 5 MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = `photos/${filename}.webp`;
  const TARGET_SIZE = 200 * 1024;

  const resized = sharp(buffer)
    .rotate()
    .resize(600, 800, { fit: "cover", position: "centre" })
    .sharpen({ sigma: 0.8 });

  let quality = 82;
  let output = await resized.clone().webp({ quality }).toBuffer();

  while (output.length > TARGET_SIZE && quality > 40) {
    quality -= 8;
    output = await resized.clone().webp({ quality }).toBuffer();
  }

  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: output,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return `${R2_PUBLIC_URL}/${key}`;
}

export async function saveSignature(
  file: File,
  filename: string
): Promise<string> {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Tipe file tidak didukung. Gunakan JPG, PNG, atau WebP.");
  }

  if (file.size > 2 * 1024 * 1024) {
    throw new Error("Ukuran file maksimal 2 MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = `signatures/${filename}.webp`;

  const output = await sharp(buffer)
    .resize(400, 200, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 90 })
    .toBuffer();

  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: output,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return `${R2_PUBLIC_URL}/${key}`;
}

export async function deleteFile(fileUrl: string): Promise<void> {
  try {
    let key: string;

    if (fileUrl.startsWith(R2_PUBLIC_URL)) {
      key = fileUrl.replace(`${R2_PUBLIC_URL}/`, "");
    } else if (fileUrl.includes("/api/uploads/")) {
      key = fileUrl.replace("/api/uploads/", "");
    } else {
      return;
    }

    await r2.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
      })
    );
  } catch {
    // ignore
  }
}
