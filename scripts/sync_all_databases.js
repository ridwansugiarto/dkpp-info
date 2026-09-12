import { createClient } from '@supabase/supabase-js';

// DKPP Target Database
const DKPP_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fnhrdwfmwhglbrnzlxxv.supabase.co';
const DKPP_SECRET = process.env.SUPABASE_SECRET_KEY || '';
const dkpp = createClient(DKPP_URL, DKPP_SECRET, { auth: { persistSession: false } });

// Source 1: Serumpun Padi
const SERUMPUN_URL = process.env.SERUMPUN_SUPABASE_URL || 'https://xxdbgnxxlumdfczflytg.supabase.co';
const SERUMPUN_ANON = process.env.SERUMPUN_SUPABASE_ANON_KEY || '';
const serumpun = createClient(SERUMPUN_URL, SERUMPUN_ANON, { auth: { persistSession: false } });

// Source 2: Dashboard Ketapang
const KETAPANG_URL = process.env.KETAPANG_SUPABASE_URL || 'https://fjycaxccbasksjooxrqg.supabase.co';
const KETAPANG_SECRET = process.env.KETAPANG_SUPABASE_SECRET_KEY || '';
const ketapang = createClient(KETAPANG_URL, KETAPANG_SECRET, { auth: { persistSession: false } });

async function syncTable(sourceClient, targetClient, sourceTable, targetTable = sourceTable, conflictCol = 'id') {
  console.log(`\n⏳ Syncing [${sourceTable}] -> [${targetTable}]...`);
  try {
    let offset = 0;
    const limit = 500;
    let totalInserted = 0;

    while (true) {
      const { data, error } = await sourceClient
        .from(sourceTable)
        .select('*')
        .range(offset, offset + limit - 1);

      if (error) {
        console.error(`Error fetching from ${sourceTable}:`, error.message);
        break;
      }

      if (!data || data.length === 0) break;

      const { error: upsertErr } = await targetClient
        .from(targetTable)
        .upsert(data, { onConflict: conflictCol });

      if (upsertErr) {
        console.error(`Error upserting into ${targetTable}:`, upsertErr.message);
        // Try insert without conflict if upsert fails
        const { error: insErr } = await targetClient.from(targetTable).insert(data);
        if (insErr) {
          console.error(`Insert fallback failed:`, insErr.message);
          break;
        }
      }

      totalInserted += data.length;
      offset += limit;
      if (data.length < limit) break;
    }

    console.log(`✅ Completed [${targetTable}]: ${totalInserted} rows synced.`);
  } catch (err) {
    console.error(`❌ Exception syncing ${sourceTable}:`, err.message);
  }
}

async function run() {
  console.log('🚀 Starting Full Cross-Database Synchronization...');

  // 1. Sync from Serumpun Padi
  console.log('\n==============================');
  console.log('📦 1. SINKRONISASI SERUMPUN PADI');
  console.log('==============================');
  await syncTable(serumpun, dkpp, 'produksi_pangan', 'produksi_pangan', 'id');
  await syncTable(serumpun, dkpp, 'master_produk_kwt', 'master_produk_kwt', 'key');
  await syncTable(serumpun, dkpp, 'master_produk_tangkap', 'master_produk_tangkap', 'id');

  // 2. Sync from Dashboard Ketapang
  console.log('\n==============================');
  console.log('📊 2. SINKRONISASI DASHBOARD KETAPANG');
  console.log('==============================');
  await syncTable(ketapang, dkpp, 'master_wilayah_bps', 'master_wilayah_bps', 'id');
  await syncTable(ketapang, dkpp, 'harga_sagon_harian', 'harga_sagon_harian', 'id');
  await syncTable(ketapang, dkpp, 'gizi_balita_skpg', 'gizi_balita_skpg', 'id');
  await syncTable(ketapang, dkpp, 'intervensi_kelurahan', 'intervensi_kelurahan', 'id');

  // Check additional tables if any
  const additional = ['gizi_balita_skpg_kelurahan', 'harga_komoditas_skpg', 'kpi_data', 'fsva_kelurahan_2024_2025'];
  for (const tbl of additional) {
    const { count } = await ketapang.from(tbl).select('*', { count: 'exact', head: true });
    if (count && count > 0) {
      await syncTable(ketapang, dkpp, tbl, tbl, 'id');
    }
  }

  console.log('\n🎉 ALL SYNCHRONIZATION COMPLETED SUCCESSFULLY!');
}

run().catch(console.error);
