const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// 1. Read env
const env = fs.readFileSync('.env.local', 'utf-8');
const envVars = Object.fromEntries(
  env.split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const idx = l.indexOf('='); return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]; })
);

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = envVars.SUPABASE_SECRET_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Supabase URL or Secret Key not found in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  console.log('=== SYNCING PEGAWAI DKPP 2026 KE SUPABASE ===');

  const active = JSON.parse(fs.readFileSync('scratch/all_active_pegawai.json', 'utf-8'));
  const inactive = JSON.parse(fs.readFileSync('scratch/all_inactive_pegawai.json', 'utf-8'));

  console.log(`Data Aktif: ${active.length} orang`);
  console.log(`Data Mutasi/Resign: ${inactive.length} orang`);

  // Step 1: Update Inactive Employees (is_active = false)
  console.log('\n--- 1. Memperbarui status pegawai yang sudah pindah / resign ---');
  let inactCount = 0;
  for (const p of inactive) {
    if (!p.nip) continue;
    const { data, error } = await supabase
      .from('dkpp_pegawai_nip')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('nip', p.nip);

    if (error) {
      console.warn(`[Inactive] NIP ${p.nip} (${p.nama}) error:`, error.message);
    } else {
      inactCount++;
    }
  }
  console.log(`✓ ${inactCount} pegawai lama berhasil ditandai sebagai non-aktif (pindah/resign).`);

  // Step 2: Upsert Active Employees (is_active = true)
  console.log('\n--- 2. Memperbarui dan menyisipkan data pegawai aktif 2026 ---');
  let actCount = 0;
  let failCount = 0;

  for (const p of active) {
    const payload = {
      nip: p.nip,
      nama: p.nama,
      jabatan: p.jabatan,
      bidang: p.bidang,
      golongan: p.golongan,
      status_pegawai: p.status_pegawai,
      is_sensitive: true,
      is_active: true,
      updated_at: new Date().toISOString()
    };

    if (p.npwp) payload.npwp = p.npwp;
    if (p.kelas_jabatan) payload.kelas_jabatan = p.kelas_jabatan;

    const { data, error } = await supabase
      .from('dkpp_pegawai_nip')
      .upsert(payload, { onConflict: 'nip' })
      .select('nip, nama, jabatan, is_active');

    if (error) {
      console.error(`[Active Failed] ${p.nama} (${p.nip}):`, error.message);
      failCount++;
    } else {
      actCount++;
    }
  }

  console.log(`\n=== RINGKASAN SYNC SUPABASE ===`);
  console.log(`✓ Sukses Update/Insert Aktif : ${actCount} / ${active.length}`);
  console.log(`✓ Sukses Update Non-Aktif     : ${inactCount} / ${inactive.length}`);
  if (failCount > 0) {
    console.log(`⚠️ Gagal                     : ${failCount}`);
  }

  // Verifikasi Jumlah Akhir
  const { data: activeCheck } = await supabase
    .from('dkpp_pegawai_nip')
    .select('nip, nama, jabatan, status_pegawai')
    .eq('is_active', true);

  console.log(`\nTotal Pegawai Aktif Terverifikasi di Supabase: ${activeCheck ? activeCheck.length : 0}`);
}

main().catch(console.error);
