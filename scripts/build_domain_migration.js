import fs from 'fs';
import path from 'path';

const serumpunSqlPath = path.join(process.cwd(), 'scratch', 'serumpun-padi-v2', 'supabase_produksi_pangan.sql');
const masterKwtSqlPath = path.join(process.cwd(), 'scratch', 'serumpun-padi-v2', 'supabase_master_produk.sql');
const masterTangkapSqlPath = path.join(process.cwd(), 'scratch', 'serumpun-padi-v2', 'supabase_master_produk_tangkap.sql');
const masterWilayahPath = path.join(process.cwd(), 'migrate_master_wilayah_bps.sql');
const hargaSagonPath = path.join(process.cwd(), 'migrate_harga_sagon_harian.sql');
const giziSkpgPath = path.join(process.cwd(), 'migrate_gizi_balita_skpg.sql');
const giziKelurahanPath = path.join(process.cwd(), 'migrate_gizi_balita_skpg_kelurahan.sql');
const intervensiPath = path.join(process.cwd(), 'migrate_intervensi_kelurahan.sql');
const fsvaPath = path.join(process.cwd(), 'migrate_fsva_2024_2025.sql');
const kpiPath = path.join(process.cwd(), 'migrate_kpi.sql');

let combinedSql = `-- ==============================================================================
-- 013_all_domain_data_tables.sql
-- Inisialisasi Seluruh Tabel Domain Data Pertanian, Pangan, SKPG, dan Master Wilayah
-- ==============================================================================

`;

const files = [
  { name: '1. Produksi Pangan (Serumpun Padi 2014-2025)', path: serumpunSqlPath },
  { name: '2. Master Produk KWT', path: masterKwtSqlPath },
  { name: '3. Master Produk Tangkap', path: masterTangkapSqlPath },
  { name: '4. Master Wilayah BPS (Kecamatan & Kelurahan Cilegon)', path: masterWilayahPath },
  { name: '5. Harga Sagon Harian', path: hargaSagonPath },
  { name: '6. Gizi Balita SKPG', path: giziSkpgPath },
  { name: '7. Gizi Balita SKPG Kelurahan', path: giziKelurahanPath },
  { name: '8. Intervensi Kelurahan', path: intervensiPath },
  { name: '9. KPI Data', path: kpiPath },
  { name: '10. FSVA 2024-2025', path: fsvaPath }
];

for (const f of files) {
  if (fs.existsSync(f.path)) {
    console.log(`Adding ${f.name}...`);
    combinedSql += `\n\n-- ========================================================\n`;
    combinedSql += `-- SECTION: ${f.name}\n`;
    combinedSql += `-- ========================================================\n\n`;
    combinedSql += fs.readFileSync(f.path, 'utf8') + '\n';
  } else {
    console.log(`Skipping missing ${f.path}`);
  }
}

const outPath = path.join(process.cwd(), 'supabase', 'migrations', '013_all_domain_data_tables.sql');
fs.writeFileSync(outPath, combinedSql, 'utf8');
console.log(`✅ Generated: ${outPath} (${(combinedSql.length / 1024).toFixed(1)} KB)`);
