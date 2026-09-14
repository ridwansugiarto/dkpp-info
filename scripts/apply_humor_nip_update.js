const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Load env
const env = fs.readFileSync('.env.local', 'utf-8');
const envVars = Object.fromEntries(
  env.split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const idx = l.indexOf('='); return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]; })
);

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = envVars.SUPABASE_SECRET_KEY;

async function runSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_raw`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': 'Bearer ' + SERVICE_KEY
    },
    body: JSON.stringify({ sql })
  });
  return res;
}

async function step1_addColumns() {
  const sql = `
ALTER TABLE public.dkpp_pegawai_humor
ADD COLUMN IF NOT EXISTS nip VARCHAR(30),
ADD COLUMN IF NOT EXISTS tanggal_lahir DATE,
ADD COLUMN IF NOT EXISTS tanggal_mulai_kerja_cpns VARCHAR(20),
ADD COLUMN IF NOT EXISTS jenis_kelamin CHAR(1);
  `.trim();
  
  const res = await runSQL(sql);
  const body = await res.text();
  console.log('Step 1 (ADD COLUMN):', res.status, body.substring(0, 200));
  return res.status < 400 || body.includes('already exists') || body.includes('column');
}

// Actually, let's just use fetch directly to Supabase SQL endpoint
async function applyViaSQL(statement, label) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql_admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': 'Bearer ' + SERVICE_KEY,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query: statement })
    });
    const body = await res.text();
    console.log(`[${label}] ${res.status}: ${body.substring(0, 150)}`);
  } catch (e) {
    console.log(`[${label}] ERROR: ${e.message}`);
  }
}

// Try updating directly via supabase SDK for the explicit update statements
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Explicit NIP data for each person in the humor table
const nipUpdates = [
  { nomor: 9, nip: '197604152002121006', tanggal_lahir: '1976-04-15', tanggal_mulai_kerja_cpns: '2002-12', jenis_kelamin: 'L', nama: 'Sutisna, SP' },
  { nomor: 10, nip: '197204081998021002', tanggal_lahir: '1972-04-08', tanggal_mulai_kerja_cpns: '1998-02', jenis_kelamin: 'L', nama: 'Udin Saprudin, SE, M.M.' },
  { nomor: 12, nip: '197610182002121002', tanggal_lahir: '1976-10-18', tanggal_mulai_kerja_cpns: '2002-12', jenis_kelamin: 'L', nama: 'Ridwan Sugiarto, Spi' },
  { nomor: 14, nip: '197703142006041012', tanggal_lahir: '1977-03-14', tanggal_mulai_kerja_cpns: '2006-04', jenis_kelamin: 'L', nama: 'Abdul Latif, S.KH.' },
  { nomor: 18, nip: '197708102007011011', tanggal_lahir: '1977-08-10', tanggal_mulai_kerja_cpns: '2007-01', jenis_kelamin: 'L', nama: 'Wahyudi, SE' },
  { nomor: 22, nip: '197603162009011003', tanggal_lahir: '1976-03-16', tanggal_mulai_kerja_cpns: '2009-01', jenis_kelamin: 'L', nama: 'Paulus Dwi  Ari K D, ST' },
  { nomor: 24, nip: '197910162010012008', tanggal_lahir: '1979-10-16', tanggal_mulai_kerja_cpns: '2010-01', jenis_kelamin: 'P', nama: 'Winda Ratnasari, SP' },
  { nomor: 25, nip: '198111032010012005', tanggal_lahir: '1981-11-03', tanggal_mulai_kerja_cpns: '2010-01', jenis_kelamin: 'P', nama: 'Sanlin Novitriana, SP' },
  { nomor: 26, nip: '198209262010012005', tanggal_lahir: '1982-09-26', tanggal_mulai_kerja_cpns: '2010-01', jenis_kelamin: 'P', nama: 'Linda Setiawati, SP' },
  { nomor: 27, nip: '198602152010012006', tanggal_lahir: '1986-02-15', tanggal_mulai_kerja_cpns: '2010-01', jenis_kelamin: 'P', nama: 'Febrika Indah Cahyani, SE, MM' },
  { nomor: 28, nip: '198203222010012008', tanggal_lahir: '1982-03-22', tanggal_mulai_kerja_cpns: '2010-01', jenis_kelamin: 'P', nama: 'Maryori, S.Pi' },
  { nomor: 31, nip: '197705252008011010', tanggal_lahir: '1977-05-25', tanggal_mulai_kerja_cpns: '2008-01', jenis_kelamin: 'L', nama: 'Arifudin, SP' },
  { nomor: 32, nip: '198611152009011001', tanggal_lahir: '1986-11-15', tanggal_mulai_kerja_cpns: '2009-01', jenis_kelamin: 'L', nama: 'Mas Akhmad Rangga P, SE, MM' },
  { nomor: 35, nip: '198908242015032006', tanggal_lahir: '1989-08-24', tanggal_mulai_kerja_cpns: '2015-03', jenis_kelamin: 'P', nama: 'Ghesika Tiandra Yusty, SP' },
  { nomor: 37, nip: '198907132022211001', tanggal_lahir: '1989-07-13', tanggal_mulai_kerja_cpns: '2022-21', jenis_kelamin: 'L', nama: 'Sandhi Maulana Adha, SP' },
  { nomor: 39, nip: '198107152014062001', tanggal_lahir: '1981-07-15', tanggal_mulai_kerja_cpns: '2014-06', jenis_kelamin: 'P', nama: 'Sri Rahmadani Piliang, SE' },
  { nomor: 40, nip: '198705022017061001', tanggal_lahir: '1987-05-02', tanggal_mulai_kerja_cpns: '2017-06', jenis_kelamin: 'L', nama: 'Subandi' },
];

async function main() {
  console.log('=== STEP 1: Add columns via Supabase SDK ===');
  
  // Test if column already exists by trying to select it
  const { data: testData, error: testErr } = await supabase
    .from('dkpp_pegawai_humor')
    .select('nomor, nip, tanggal_lahir, tanggal_mulai_kerja_cpns, jenis_kelamin')
    .limit(1);
    
  console.log('Column test:', testErr ? 'COLUMNS NOT YET ADDED: ' + testErr.message : 'COLUMNS EXIST ✓');
  
  if (testErr && testErr.code === 'PGRST204') {
    console.log('\n⚠️  Kolom belum ada! Perlu jalankan migration SQL di Supabase SQL Editor.');
    console.log('File migration: supabase/migrations/018_update_pegawai_humor_nip_info.sql');
    console.log('\nSQLyang perlu dijalankan dulu:');
    console.log('ALTER TABLE public.dkpp_pegawai_humor ADD COLUMN IF NOT EXISTS nip VARCHAR(30), ADD COLUMN IF NOT EXISTS tanggal_lahir DATE, ADD COLUMN IF NOT EXISTS tanggal_mulai_kerja_cpns VARCHAR(20), ADD COLUMN IF NOT EXISTS jenis_kelamin CHAR(1);');
    return;
  }
  
  console.log('\n=== STEP 2: Update data ASN dari NIP ===');
  let success = 0, fail = 0;
  
  for (const u of nipUpdates) {
    const { data, error } = await supabase
      .from('dkpp_pegawai_humor')
      .update({
        nip: u.nip,
        tanggal_lahir: u.tanggal_lahir,
        tanggal_mulai_kerja_cpns: u.tanggal_mulai_kerja_cpns,
        jenis_kelamin: u.jenis_kelamin
      })
      .eq('nomor', u.nomor)
      .select('nomor, nama, nip, tanggal_lahir, tanggal_mulai_kerja_cpns, jenis_kelamin');
      
    if (error) {
      console.log(`[No ${u.nomor}] ${u.nama} - ERROR: ${error.message}`);
      fail++;
    } else if (data && data.length > 0) {
      console.log(`[No ${u.nomor}] ${u.nama} ✓ Lahir: ${data[0].tanggal_lahir} | CPNS: ${data[0].tanggal_mulai_kerja_cpns} | JK: ${data[0].jenis_kelamin}`);
      success++;
    } else {
      console.log(`[No ${u.nomor}] ${u.nama} - ROW NOT FOUND (might not be in humor table)`);
    }
  }
  
  console.log(`\n=== HASIL: ${success} berhasil, ${fail} gagal ===`);
  
  // Verify final state
  const { data: verify } = await supabase
    .from('dkpp_pegawai_humor')
    .select('nomor, nama, nip, tanggal_lahir, tanggal_mulai_kerja_cpns, jenis_kelamin')
    .not('nip', 'is', null)
    .order('nomor');
    
  console.log(`\n=== VERIFIKASI: ${verify ? verify.length : 0} baris memiliki data NIP ===`);
  if (verify) {
    for (const r of verify) {
      console.log(`  No ${r.nomor}: ${r.nama} | Lahir: ${r.tanggal_lahir} | CPNS: ${r.tanggal_mulai_kerja_cpns} | JK: ${r.jenis_kelamin}`);
    }
  }
}

main();
