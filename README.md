# Sistem KTA Digital — PWI-LS Kabupaten Madiun

Sistem manajemen Kartu Tanda Anggota (KTA) digital dengan verifikasi QR Code untuk PWI-LS Kabupaten Madiun.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Database**: MySQL 8 + Prisma ORM
- **Auth**: NextAuth v5 (Credentials + JWT)
- **Storage**: Cloudflare R2 (S3-compatible)
- **Styling**: Tailwind CSS 4
- **PDF**: @react-pdf/renderer
- **QR Code**: qrcode
- **Image Processing**: sharp

## Fitur

### Manajemen Anggota (Sekretaris)
- Tambah, edit, hapus anggota
- Upload foto otomatis resize, convert WebP, dan simpan ke R2
- Status: Draft → Disetujui → Dicabut / Kedaluwarsa
- Persetujuan satuan & massal
- Pencabutan dengan alasan
- Perpanjangan masa berlaku
- Pencarian & filter (status, kecamatan, desa)
- Pagination

### Desain & Cetak KTA
- Kartu KTA format standar e-KTP Indonesia (85.6mm × 53.98mm)
- QR Code verifikasi tertanam
- Unduh JPG langsung dari daftar
- Preview & unduh dari halaman detail
- Cetak PDF

### Verifikasi Publik
- Halaman verifikasi via scan QR Code (tanpa login)
- Tampil: nama, jabatan, alamat, masa berlaku, status, pengesah
- Log setiap scan (IP hash + user agent)
- Rate limiting (30 req/IP/menit)

### Monitoring (Ketua)
- Dashboard statistik (total, aktif, draft, dicabut, kedaluwarsa)
- Daftar anggota read-only dengan filter & pencarian
- Lihat detail anggota & riwayat aktivitas
- Audit log

### Pengaturan
- **Periode Kepengurusan** (Sekretaris): nama ketua, jabatan, tanda tangan, periode
- **Manajemen Pengguna** (Super Admin): CRUD user, toggle aktif
- **Profil**: ubah nama, email, password
- **Preferensi**: toggle hapus massal

### Keamanan
- Role-Based Access Control (SEKRETARIS, KETUA, SUPERADMIN)
- Route protection via proxy
- Rate limiting login (5 percobaan/email/15 menit)
- Rate limiting verifikasi (30 req/IP/menit)
- Security headers (HSTS, CSP, X-Frame-Options, dll)
- Cron endpoint dilindungi bearer token
- Super Admin hardcoded, tidak bisa diubah/dinonaktifkan
- File lama otomatis dihapus dari R2 saat update

### Auto-Expiry
- Cron job harian: otomatis ubah status DISETUJUI → KEDALUWARSA jika masa berlaku habis
- Audit log otomatis untuk setiap perubahan status

## Struktur Folder

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── anggota/          # CRUD anggota
│   │   ├── audit-log/        # Log aktivitas
│   │   ├── dashboard/        # Statistik
│   │   ├── kta/              # Preview & cetak KTA
│   │   ├── monitoring/       # Read-only untuk Ketua
│   │   ├── pengaturan/       # Periode & pengguna
│   │   └── persetujuan/      # Approval draft
│   ├── api/
│   │   ├── cron/expire/      # Auto-expiry endpoint
│   │   ├── kta/[id]/pdf/     # Generate PDF
│   │   ├── proxy-image/      # CORS proxy untuk R2
│   │   ├── qr/[token]/       # Generate QR PNG
│   │   └── verifikasi/       # Foto proxy
│   ├── login/
│   └── verifikasi/[token]/   # Halaman publik scan QR
├── components/
│   ├── kta/                  # Komponen kartu KTA
│   ├── layout/               # Sidebar
│   ├── members/              # Tabel, form, detail anggota
│   ├── settings/             # Form pengaturan
│   ├── ui/                   # Komponen UI (shadcn)
│   └── verification/         # Kartu verifikasi publik
├── lib/
│   ├── auth.ts               # NextAuth config + rate limit
│   ├── crypto.ts             # Hash token & IP
│   ├── prisma.ts             # Prisma client (auto-compose DB URL)
│   ├── r2.ts                 # Cloudflare R2 client
│   ├── rate-limit.ts         # In-memory rate limiter
│   ├── storage.ts            # Upload foto & tanda tangan ke R2
│   └── validations.ts        # Zod schemas
├── server/
│   ├── actions/              # Server Actions (CRUD, queries)
│   └── auth.ts               # requireRole helper
├── proxy.ts                  # Route protection
└── types/
```

## Peran

| Peran | Hak Akses |
|-------|-----------|
| **Sekretaris** | CRUD anggota, approval, cabut, perpanjang, cetak KTA, periode kepengurusan |
| **Ketua** | Dashboard, monitoring anggota (read-only), audit log |
| **Super Admin** | Manajemen pengguna, audit log |

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Konfigurasi environment

```bash
cp .env.example .env
# Edit .env sesuai kebutuhan
```

### 3. Setup database

```bash
npm run db:push
npm run db:seed
```

### 4. Jalankan development server

```bash
npm run dev
```

### 5. Setup cron (production — Linux)

```bash
crontab -e
# Tambahkan:
0 0 * * * curl -s -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/expire >> /var/log/kta-expire.log 2>&1
```

## Akun Default (Seed)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@kta.local | password123 |
| Sekretaris | sekretaris@kta.local | password123 |
| Ketua | ketua@kta.local | password123 |

> ⚠️ Ganti password default setelah deploy!

## License

Private — PWI-LS Kabupaten Madiun
