import { PrismaClient, Role, MemberStatus } from "@prisma/client";
import { hash } from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Memulai seeding database...\n");

  const passwordHash = await hash("password123", 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@kta.local" },
    update: {},
    create: {
      nama: "Super Admin",
      email: "superadmin@kta.local",
      passwordHash,
      role: Role.SUPERADMIN,
    },
  });
  console.log(`✅ Super Admin: ${superAdmin.email}`);

  const sekretaris = await prisma.user.upsert({
    where: { email: "sekretaris@kta.local" },
    update: {},
    create: {
      nama: "Ahmad Sekretaris",
      email: "sekretaris@kta.local",
      passwordHash,
      role: Role.SEKRETARIS,
    },
  });
  console.log(`✅ Sekretaris: ${sekretaris.email}`);

  const ketua = await prisma.user.upsert({
    where: { email: "ketua@kta.local" },
    update: {},
    create: {
      nama: "Dr. Budi Santoso, M.Pd.",
      email: "ketua@kta.local",
      passwordHash,
      role: Role.KETUA,
    },
  });
  console.log(`✅ Ketua: ${ketua.email}`);

  const existingPeriod = await prisma.leadershipPeriod.findFirst({
    where: { isActive: true },
  });

  let period;
  if (existingPeriod) {
    period = existingPeriod;
    console.log(`✅ Periode kepengurusan sudah ada: ${period.namaKetua}`);
  } else {
    period = await prisma.leadershipPeriod.create({
      data: {
        namaKetua: "Dr. Budi Santoso, M.Pd.",
        jabatan: "Ketua Umum",
        periodeMulai: new Date("2025-01-01"),
        periodeSelesai: new Date("2027-12-31"),
        isActive: true,
      },
    });
    console.log(`✅ Periode kepengurusan: ${period.namaKetua} (2025-2027)`);
  }

  const sampleMembers = [
    {
      noAnggota: "0001/KTA/2026",
      nama: "Siti Nurhaliza",
      jabatan: "Anggota",
      tempatLahir: "Madiun",
      kabupaten: "KOTA MADIUN",
      kecamatan: "TAMAN",
      desa: "MANISREJO",
      rt: "001",
      rw: "002",
      status: MemberStatus.DISETUJUI,
    },
    {
      noAnggota: "0002/KTA/2026",
      nama: "Rizky Pratama",
      jabatan: "Wakil Ketua",
      tempatLahir: "Surabaya",
      kabupaten: "KOTA SURABAYA",
      kecamatan: "GENTENG",
      desa: "GENTENG",
      rt: "003",
      rw: "005",
      status: MemberStatus.DISETUJUI,
    },
    {
      noAnggota: "0003/KTA/2026",
      nama: "Dewi Kartika",
      jabatan: "Bendahara",
      tempatLahir: "Ponorogo",
      kabupaten: "KABUPATEN PONOROGO",
      kecamatan: "PONOROGO",
      desa: "TONATAN",
      rt: "002",
      rw: "001",
      status: MemberStatus.DISETUJUI,
    },
    {
      noAnggota: "0004/KTA/2026",
      nama: "Fajar Hidayat",
      jabatan: "Anggota",
      tempatLahir: "Ngawi",
      kabupaten: "KABUPATEN NGAWI",
      kecamatan: "NGAWI",
      desa: "NGAWI",
      rt: "004",
      rw: "003",
      status: MemberStatus.DRAFT,
    },
    {
      noAnggota: "0005/KTA/2026",
      nama: "Putri Wulandari",
      jabatan: "Anggota",
      tempatLahir: "Magetan",
      kabupaten: "KABUPATEN MAGETAN",
      kecamatan: "MAGETAN",
      desa: "MAGETAN",
      rt: "001",
      rw: "001",
      status: MemberStatus.DISETUJUI,
    },
  ];

  for (const member of sampleMembers) {
    const existing = await prisma.member.findUnique({
      where: { noAnggota: member.noAnggota },
    });

    if (existing) {
      console.log(`⏭️  Anggota sudah ada: ${member.nama}`);
      continue;
    }

    const isApproved = member.status === MemberStatus.DISETUJUI;
    const verifyToken = isApproved
      ? crypto.randomBytes(18).toString("base64url")
      : null;

    const created = await prisma.member.create({
      data: {
        noAnggota: member.noAnggota,
        nama: member.nama,
        jabatan: member.jabatan,
        tempatLahir: member.tempatLahir,
        kabupaten: member.kabupaten,
        kecamatan: member.kecamatan,
        desa: member.desa,
        rt: member.rt,
        rw: member.rw,
        tanggalBergabung: new Date("2026-01-15"),
        masaBerlaku: new Date("2028-01-15"),
        consentAt: new Date(),
        verifyToken,
        status: member.status,
        approvedById: isApproved ? sekretaris.id : null,
        approvedAt: isApproved ? new Date() : null,
        leadershipPeriodId: isApproved ? period.id : null,
        createdById: sekretaris.id,
      },
    });

    if (isApproved) {
      await prisma.approvalLog.create({
        data: {
          memberId: created.id,
          action: "APPROVE",
          actorId: sekretaris.id,
          note: "Data awal (seed)",
        },
      });
    }

    await prisma.approvalLog.create({
      data: {
        memberId: created.id,
        action: "CREATE",
        actorId: sekretaris.id,
        note: "Data awal (seed)",
      },
    });

    console.log(
      `✅ Anggota: ${member.nama} [${member.status}]${verifyToken ? ` → /verifikasi/${verifyToken}` : ""
      }`
    );
  }

  console.log("\n🎉 Seeding selesai!");
  console.log("\n📋 Akun login:");
  console.log("   Super Admin  : superadmin@kta.local / password123");
  console.log("   Sekretaris   : sekretaris@kta.local / password123");
  console.log("   Ketua        : ketua@kta.local / password123");
}

main()
  .catch((e) => {
    console.error("❌ Seeding gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
