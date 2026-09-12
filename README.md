# DKPP-INFO
> **AI Knowledge Assistant & GIS Intelligence — Dinas Ketahanan Pangan dan Pertanian Kota Cilegon**

Aplikasi web modern production-ready yang menggabungkan kemampuan Large Language Model (Google Gemini via `@google/genai`), Retrieval-Augmented Generation (RAG dengan pgvector di Supabase), dan Geographic Information System (GIS spasial dengan Leaflet) untuk menganalisis dan menyajikan informasi ketahanan pangan, pertanian, perikanan, peternakan, agroklimat, dan program strategis Kota Cilegon.

---

## 📸 Antarmuka & Fitur Utama

- **Modern ChatGPT-style Layout**:
  - **Sidebar Kiri**: Riwayat percakapan pengguna (maksimal 10 sesi aktif per user dengan auto-archive), New Chat, Rename, dan Delete.
  - **Header Switcher**: Tiga mode tampilan fleksibel: `[ SPLIT ]`, `[ PETA ]`, `[ CHAT ]`.
  - **Split Mode 50:50**: Panel kiri menampilkan Peta GIS Interaktif (Batas 8 Kecamatan & 43 Kelurahan Cilegon, FSVA, overlay Telemetri Agroklimat & Lengas Tanah), panel kanan menampilkan Chat Assistant responsif.
  - **AI-GIS Realtime Integration**: AI dapat memanggil tools (`get_fsva`, `get_skpg`, `get_food_prices`, `show_map_layer`, `highlight_feature`) yang langsung berinteraksi dan menggerakkan Peta GIS di sebelah kiri.
  - **Status Rujukan Transparan**: Setiap jawaban AI dilengkapi kartu sumber data yang jelas (`[LOCAL DATA]`, `[KNOWLEDGE BASE]`, `[WEB]`).

---

## 🔐 Keamanan & Access Control (3-Tier)

1. **GUEST (Publik / Tamu)**:
   - Mengakses data publik, peta FSVA, pasar pangan, dan web rujukan resmi.
   - **Dilarang** mengakses folder `sensitif/` dan `kepegawaian/`.
   - Filter otorisasi dijalankan **sebelum** data dikirim ke context Gemini (RAG pre-authorization).
2. **EMPLOYEE (Pegawai Terverifikasi)**:
   - Otentikasi Google OAuth via Supabase Auth.
   - Terverifikasi pada database tabel `employees` berdasarkan Email terdaftar dan NIP di halaman `/verify`.
   - Mengakses dokumen internal teknis DKPP.
3. **ADMIN (Administrator)**:
   - Terverifikasi server-side (Akun `ridwansugiarto.mail@gmail.com` / NIP `197610182002121002`).
   - Akses penuh ke portal `/admin` untuk upload dokumen, kelola hak akses folder, re-indexing pgvector, dan audit log.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, Lucide Icons, Leaflet / React-Leaflet
- **AI & LLM**: Google Gemini API via package resmi `@google/genai` (`gemini-2.5-flash`)
- **Database & Storage**: Supabase PostgreSQL, pgvector, Row Level Security (RLS), Supabase Storage
- **GIS & Data**: GeoJSON, KML/KMZ parser (`@mapbox/togeojson`, `jszip`), ECMWF ERA5-Land agroklimat

---

## 🚀 Panduan Instalasi & Menjalankan Lokal

### 1. Prasyarat
- Node.js versi 18 atau 20+
- Akun Supabase & Google Gemini API Key

### 2. Konfigurasi Environment
Salin file `.env.example` menjadi `.env.local` dan isi nilainya:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://fnhrdwfmwhglbrnzlxxv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SECRET_KEY=your-secret-key
GEMINI_API_KEY=your-gemini-api-key
ADMIN_EMAIL=ridwansugiarto.mail@gmail.com
ADMIN_NIP=197610182002121002
```

### 3. Migrasi Database Supabase
Jalankan file migrasi SQL di folder `supabase/migrations/` secara berurutan pada Supabase SQL Editor:
- `001_profiles.sql`
- `002_employees.sql`
- `003_roles.sql`
- `004_chat_sessions.sql`
- `005_chat_messages.sql`
- `006_user_memories.sql`
- `007_documents.sql`
- `008_document_chunks.sql`
- `009_audit_logs.sql`
- `010_storage_policies.sql`
- `011_vector_search.sql`
- `012_rls_policies.sql`

### 4. Menjalankan Aplikasi

```bash
# Install dependensi
npm install

# Jalankan server pengembangan lokal
npm run dev

# Build untuk production / Vercel
npm run build
```

Buka peramban di `http://localhost:3000`.

---

## 📂 Struktur Folder Proyek

```
dkpp-info/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/route.ts          # Endpoint Chat AI + Tool Calling + RAG
│   │   │   ├── sessions/route.ts      # Sesi Chat (Max 10 per user)
│   │   │   ├── messages/route.ts      # Pesan chat per sesi
│   │   │   ├── verify/route.ts        # Verifikasi NIP Pegawai
│   │   │   └── admin/                 # API Manajemen Dokumen & Audit Log
│   │   ├── admin/page.tsx             # Portal Administrator
│   │   ├── verify/page.tsx            # Halaman Verifikasi Pegawai
│   │   ├── layout.tsx                 # Root Layout
│   │   └── page.tsx                   # Halaman Utama Chat DKPP
│   ├── components/
│   │   └── chat/
│   │       ├── ChatDKPPApp.tsx        # Master Controller (Split / Peta / Chat)
│   │       ├── ChatSidebar.tsx        # Sidebar Riwayat Chat & Profil
│   │       ├── SplitMapPane.tsx       # Viewer Peta Leaflet & Telemetri
│   │       ├── ChatContainer.tsx      # Komponen Chat & Sumber Rujukan
│   │       └── ChatInput.tsx          # Input Box dengan Think, Mic & Lampiran
│   ├── lib/
│   │   ├── gemini.ts                  # Integrasi @google/genai & Tools
│   │   ├── supabaseServer.ts          # Supabase Server Client & Auth Helper
│   │   └── supabaseClient.ts          # Supabase Browser Client
│   └── types/
│       └── dkpp.ts                    # Tipe data TypeScript
├── scripts/
│   ├── ingest-local-files.ts          # Scanner aset & data lokal
│   ├── inspect-gis.ts                 # Pemeriksa data spasial GIS
│   └── convert-kmz.ts                 # Konverter KMZ ke GeoJSON
├── supabase/
│   └── migrations/                    # 12 Migrasi SQL & RLS Policies
└── README.md
```

---

## ☁️ Deployment ke Vercel

1. Push kode ke repository GitHub.
2. Hubungkan repository ke Vercel Dashboard.
3. Atur Environment Variables di pengaturan Vercel Project Settings sesuai `.env.local`.
4. Deploy secara otomatis.
