# Panduan & Dokumentasi Fitur Polling Pegawai — ChatDKPP

Dokumen ini berisi panduan teknis, tata kelola (governance), keamanan, dan panduan operasional untuk fitur **Polling Pegawai** di ChatDKPP (Dinas Ketahanan Pangan dan Pertanian Kota Cilegon).

---

## 1. Ringkasan Fitur

Fitur **Polling Pegawai** adalah fitur keterlibatan internal berbasis voting multitematik, anonim, dan realtime untuk pegawai DKPP Kota Cilegon.

### Karakteristik & Aturan Bisnis:
1. **Akses Khusus Pegawai Terverifikasi:** Hanya pegawai login yang telah terverifikasi NIP / status pegawai aktif yang dapat melihat dan memberikan suara.
2. **Multitematik:** 15 tema aktif (Paling Ganteng, Paling Cantik, Paling Rajin, Paling Cerdas, Paling Soleh, Paling Dermawan, Paling Royal, Paling Baik, Paling Tahu Segala, Paling Update, Paling Gaptek, Paling Murah Senyum, Paling Cool, Paling Sibuk, Paling Lucu).
3. **Maksimal 3 Pilihan:** Dalam 1 tema, pemilih memilih 1 hingga maksimal 3 kandidat nama pegawai (tidak boleh 0 saat submit).
4. **Tanpa Perangkingan Bobot:** Setiap nama yang dipilih mendapatkan bobot sama (+1 suara).
5. **1 User = 1 Kali Vote per Tema:** Ditegakkan langsung di level database (`poll_participations` & RPC `submit_poll_vote`).
6. **Pencegahan Self-Vote:** Konfigurasi default `allow_self_vote = false` mencegah user memilih diri sendiri.
7. **Anonimitas Publik:** Tampilan untuk pegawai hanya menampilkan data agregat (nama, jabatan, persentase, total suara). Identitas pemilih disamarkan.
8. **Audit Trail Admin:** Akses admin untuk membuka identitas pemilih dicatat otomatis di tabel `audit_logs` dengan aksi `ADMIN_VIEW_VOTER_IDENTITY`.
9. **Real-time Engine:** Perubahan hasil suara langsung terdistribusi via Supabase Realtime Channel dengan fallback polling 15 detik.

---

## 2. Struktur Database & SQL Migration

File migration tersedia di:
- `supabase/migrations/020_polling_system.sql`
- `supabase_sql/06_polling_system.sql`

### Tabel Utama:
- `employees`: Master pegawai aktif (dengan pg_trgm GIN index untuk autocomplete cepat).
- `polls`: Definisi tema polling.
- `votes`: Suara mentah (1 baris per kandidat yang dipilih).
- `poll_participations`: Constraint 1 kali partisipasi per user per tema (`PRIMARY KEY (poll_id, user_id)`).
- `poll_results`: Tabel agregat yang otomatis diupdate oleh trigger database (`trg_sync_poll_results`).
- `poll_results_public`: View agregat publik tanpa memuat `user_id`.
- `audit_logs`: Log keamanan dan jejak audit aktivitas voting & admin.

### Stored Procedures (RPC):
1. `submit_poll_vote(p_poll_id uuid, p_employee_ids uuid[])`:
   - Validasi status aktif tema & waktu `ends_at`.
   - Validasi jumlah pilihan (1-3) & cegah duplikasi kandidat.
   - Validasi cegah self-vote jika `allow_self_vote = false`.
   - Validasi apakah user sudah pernah vote (`ALREADY_VOTED`).
   - Eksekusi atomik `votes` + `poll_participations` + `audit_logs`.
2. `search_employees(q text, poll_id uuid)`:
   - Pencarian berjenjang 4-tier:
     - Tier 1: Prefix match (huruf awal).
     - Tier 2: Word-prefix match (awal kata).
     - Tier 3: Substring match (tengah kata).
     - Tier 4: Fuzzy / typo tolerance (`pg_trgm similarity >= 0.25`).
   - Diurutkan berdasarkan `match_tier ASC, full_name ASC`.

### Cara Menjalankan Migration:
```bash
# Opsi 1: Lewat Supabase Dashboard SQL Editor
# Buka file supabase_sql/06_polling_system.sql lalu jalankan query di Supabase SQL Editor.

# Opsi 2: Menggunakan sinkronisasi otomatis script
node scripts/sync_polling_db.js
```

---

## 3. Environment Variables

Pastikan variabel lingkungan berikut tersedia di file `.env.local` atau deployment environment:

```env
# Supabase URL & Public Anon Key (Untuk client & auth)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# Supabase Service Role Key (Wajib untuk admin portal & backend API)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# AI & LLM Provider Keys (Untuk deteksi intent fallback & chatbot)
GEMINI_API_KEY=AIzaSy...
ANTHROPIC_API_KEY=sk-ant-...

# NextAuth / App URL
NEXTAUTH_URL=http://localhost:3000
```

---

## 4. Tata Kelola & Governance

### 4.1 Kebijakan Kategori & Blocked Keywords
Sesuai prinsip etika dan keakraban ASN:
- Kategori yang menyentuh **kondisi ekonomi pribadi** (misal: "Paling Kaya", "Paling Berada") **DILARANG** dan digantikan dengan fokus perilaku ("Paling Dermawan" / "Paling Royal").
- Kategori yang berpotensi mempermalukan, SARA, atau fisik negatif secara otomatis divalidasi oleh `guards.ts` menggunakan daftar `BLOCKED_KEYWORDS`:
  ```typescript
  export const BLOCKED_KEYWORDS = [
    'miskin', 'pelit', 'jelek', 'bodoh', 'malas', 'gendut', 'kurus',
    'sara', 'agama', 'suku', 'ras', 'kaya', 'berada', 'bokek',
    'utang', 'hutang', 'gaji', 'korupsi', 'hina', 'cacat'
  ];
  ```
- Saat admin membuat tema baru di `/admin/polling`, sistem akan menolak atau memperingatkan jika judul/deskripsi mengandung kata terlarang.

### 4.2 Prosedur Pembukaan Identitas Pemilih
- Secara default, halaman hasil dan data pemilih bersifat **tersamar (Anonim)**.
- Hanya Administrator berwenang (`isAuthorizedAdmin`) yang dapat membuka rincian pemilih.
- Sebelum data dibuka, admin wajib mengonfirmasi modal peringatan: *"Tindakan ini akan dicatat di audit log demi transparansi dan kepatuhan data."*
- API `api/admin/polling/voters` mencatat aksi `ADMIN_VIEW_VOTER_IDENTITY` ke tabel `audit_logs` bersama metadata: user ID admin, IP address, waktu, dan poll ID yang diakses.

### 4.3 Kebijakan Retensi & Penghapusan Suara (12 Bulan)
- **Retensi Audit Log:** Log aktivitas disimpan selama default 12 bulan untuk kebutuhan audit berkala, setelah itu diarsipkan.
- **Hak Privasi Pegawai (Right to be Forgotten):** Jika seorang pegawai mengajukan permohonan tertulis untuk menarik/menghapus suaranya:
  1. Admin berwenang memproses melalui menu Retensi di `/admin/polling/[id]`.
  2. Penghapusan akan menghapus relasi di `votes` dan `poll_participations`, trigger akan memperbarui `poll_results`, dan aksi dicatat di `audit_logs` dengan keterangan `VOTE_DELETE_REQUESTED`.

---

## 5. Integrasi Chat DKPP

1. **Deteksi Intent Dua Lapis (`lib/polling/intent.ts`):**
   - **Layer 1 (Deterministic Rule-Based Matcher):** Regex & keyword matching cepat untuk 15 tema dan query katalog ("siapa paling ganteng", "polling rajin", "lihat polling", dll.).
   - **Layer 2 (LLM Fallback Classifier):** Mengklasifikasikan pertanyaan santai pegawai ke format `{ intent: "EMPLOYEE_POLL", category: "...", confidence: 0.95 }`.
2. **Inline Interactive UI:**
   - Chatbot merespons dengan pesan ramah + inline `<PollCard />`.
   - Autocomplete pegawai terintegrasi langsung di dalam bubble chat.
   - Setelah memilih dan mengirim suara, komponen bertransformasi menjadi kartu sukses beranimasi konfeti dan tautan ke hasil realtime.

---

## 6. Verifikasi & Checklist Penerimaan

- [x] **Unverified/Guest Guard:** Tamu/pengguna belum verifikasi diarahkan untuk login/verifikasi sebelum bisa vote.
- [x] **Double-Vote Protection:** Database menolak submit kedua dengan error `ALREADY_VOTED`.
- [x] **Max 3 Choices Validation:** RPC dan Zod guard menolak submit > 3 nama atau 0 nama.
- [x] **Realtime Sync:** Perubahan hasil langsung ter-update di UI tanpa refresh halaman.
- [x] **Hierarchical Autocomplete:** Prefix -> Word-prefix -> Substring -> Trigram fuzzy matching.
- [x] **Admin Identity Reveal & Logging:** Jejak audit otomatis tercatat di `audit_logs`.
- [x] **Responsive Mobile-First (360px+):** Tampilan optimal di perangkat mobile maupun desktop.
