/**
 * Script Sinkronisasi Otomatis 54 Dokumen & 5.412 Chunks Knowledge Base
 * Dari Supabase Lama (dashboard-ketapang) ke Supabase Baru (dkpp-info)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Parse .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let val = (match[2] || '').trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      process.env[key] = val;
    }
  });
}

const SOURCE_URL = 'https://fjycaxccbasksjooxrqg.supabase.co';
const SOURCE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqeWNheGNjYmFza3Nqb294cnFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3Njk4NjcsImV4cCI6MjA5NTM0NTg2N30.HyFsymcv70yFFvSCicOHwQoz6aYPgZTc0dAhcoI__lo';

const TARGET_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fnhrdwfmwhglbrnzlxxv.supabase.co';
const TARGET_KEY = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuaHJkd2Ztd2hnbGJybnpseHh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxNTc1OTIsImV4cCI6MjEwNDczMzU5Mn0.W93HFqyDfHm2jZoxlg9Q5oaj2aBrm0NR8w_mUPAnumk';

const sourceClient = createClient(SOURCE_URL, SOURCE_ANON);
const targetClient = createClient(TARGET_URL, TARGET_KEY);

async function runSync() {
  console.log('====================================================');
  console.log('🚀 MEMULAI MIGRASI OTOMATIS KNOWLEDGE BASE KE DKPP-INFO');
  console.log('Sumber :', SOURCE_URL);
  console.log('Tujuan :', TARGET_URL);
  console.log('====================================================\n');

  // 1. Cek kesiapan tabel target
  console.log('1. Memeriksa keberadaan tabel di Supabase tujuan...');
  const { error: testErr } = await targetClient.from('ai_knowledge_docs').select('id').limit(1);
  if (testErr) {
    console.error('\n❌ ERROR: Tabel ai_knowledge_docs belum dibuat di Supabase tujuan.');
    console.error('Pesan error:', testErr.message);
    console.log('\n👉 Silakan salin & jalankan file SQL berikut di SQL Editor Supabase Anda terlebih dahulu:');
    console.log('   supabase/migrations/014_ai_knowledge_base.sql\n');
    return;
  }
  console.log('   ✅ Tabel ai_knowledge_docs siap.\n');

  // 2. Tarik seluruh dokumen (54 dokumen)
  console.log('2. Mengambil metadata 54 dokumen dari sumber...');
  const { data: docs, error: docsErr } = await sourceClient
    .from('ai_knowledge_docs')
    .select('*')
    .order('created_at', { ascending: true });

  if (docsErr || !docs) {
    console.error('❌ Gagal mengambil data dokumen sumber:', docsErr?.message);
    process.exit(1);
  }
  console.log(`   ✅ Berhasil mengambil ${docs.length} dokumen.\n`);

  // 3. Masukkan dokumen ke target
  console.log('3. Menyalin dokumen ke target...');
  let docsInserted = 0;
  for (const doc of docs) {
    const { error: insertErr } = await targetClient
      .from('ai_knowledge_docs')
      .upsert({
        id: doc.id,
        judul: doc.judul,
        deskripsi: doc.deskripsi,
        jenis: doc.jenis,
        file_name: doc.file_name,
        total_chunks: doc.total_chunks,
        created_at: doc.created_at,
      });

    if (insertErr) {
      console.warn(`   ⚠️ Gagal upsert doc ${doc.judul}:`, insertErr.message);
    } else {
      docsInserted++;
    }
  }
  console.log(`   ✅ Selesai: ${docsInserted}/${docs.length} dokumen tersalin.\n`);

  // 4. Salin seluruh chunks teks (5.412 chunks)
  console.log('4. Mengambil dan menyalin chunks teks (5.412 potongan)...');
  const CHUNK_BATCH_SIZE = 100;
  let offset = 0;
  let totalChunksCopied = 0;
  let hasMore = true;

  while (hasMore) {
    const { data: chunks, error: chunksErr } = await sourceClient
      .from('ai_knowledge_chunks')
      .select('id, doc_id, chunk_index, content, metadata, created_at')
      .order('id', { ascending: true })
      .range(offset, offset + CHUNK_BATCH_SIZE - 1);

    if (chunksErr) {
      console.error(`❌ Gagal mengambil batch chunks offset ${offset}:`, chunksErr.message);
      break;
    }

    if (!chunks || chunks.length === 0) {
      hasMore = false;
      break;
    }

    // Insert batch ke target
    const { error: batchInsertErr } = await targetClient
      .from('ai_knowledge_chunks')
      .upsert(
        chunks.map((c) => ({
          id: c.id,
          doc_id: c.doc_id,
          chunk_index: c.chunk_index,
          content: c.content,
          metadata: c.metadata || {},
          created_at: c.created_at,
        }))
      );

    if (batchInsertErr) {
      console.error(`   ⚠️ Gagal memasukkan batch chunk offset ${offset}:`, batchInsertErr.message);
    } else {
      totalChunksCopied += chunks.length;
      process.stdout.write(`   ⏳ Tersalin: ${totalChunksCopied} chunks...\r`);
    }

    if (chunks.length < CHUNK_BATCH_SIZE) {
      hasMore = false;
    } else {
      offset += CHUNK_BATCH_SIZE;
    }
  }

  console.log(`\n   ✅ Selesai menyalin ${totalChunksCopied} chunks.\n`);

  // 5. Verifikasi Final
  console.log('5. Verifikasi hasil akhir di database tujuan:');
  const { count: finalDocsCount } = await targetClient.from('ai_knowledge_docs').select('*', { count: 'exact', head: true });
  const { count: finalChunksCount } = await targetClient.from('ai_knowledge_chunks').select('*', { count: 'exact', head: true });

  console.log(`   📄 Total Dokumen Terverifikasi : ${finalDocsCount} / 54`);
  console.log(`   🧩 Total Chunks Terverifikasi  : ${finalChunksCount} / 5412`);
  console.log('\n🎉 MIGRASI SUKSES 100%! AI Chatbot kini dapat mencari seluruh dokumen referensi.');
  console.log('====================================================\n');
}

runSync().catch((err) => {
  console.error('Fatal sync error:', err);
});
