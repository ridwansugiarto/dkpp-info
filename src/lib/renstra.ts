import { supabase } from './supabase';

/**
 * renstra.ts
 * Integrates Renstra (Rencana Strategis) DKPP Kota Cilegon 2025-2030
 * Database Tables:
 *   - renstra_tujuan_sasaran (Tabel 3.3)
 *   - renstra_cascading_program (Tabel 4.1)
 *   - renstra_subkegiatan_prioritas (Tabel 4.4)
 *   - renstra_iku (Tabel 4.5)
 *   - renstra_ikk (Tabel 4.6)
 *   - renstra_ikd (Tabel 4.3 IKD)
 *   - renstra_program_kegiatan_pagu (Tabel 4.3 V2)
 */

export interface RenstraData {
  tujuanSasaran: any[];
  cascading: any[];
  prioritas: any[];
  iku: any[];
  ikk: any[];
  ikd: any[];
  paguSearchResults: any[];
}

export function isRenstraQuery(q: string): boolean {
  const lq = q.toLowerCase();
  const keywords = [
    'renstra', 'rencana strategis', 'program', 'kegiatan', 'subkegiatan', 'sub kegiatan',
    'iku', 'ikk', 'ikd', 'indikator kinerja', 'pagu', 'anggaran', 'tujuan', 'sasaran',
    'prioritas', 'target 2025', 'target 2026', 'target 2027', 'target 2028', 'target 2029', 'target 2030',
    'keamanan pangan', 'penyuluhan', 'perikanan budidaya', 'padi', 'jagung', 'cabai',
    'bawang merah', 'hortikultura', 'lahan lp2b', 'lp2b', 'reformasi birokrasi',
    'sakip', 'polapangan harapan', 'pph', 'pou', 'undernourishment', 'phms', 'nkv',
    'uptd', 'rph', 'puskeswan', 'kawasan pertanian terpadu'
  ];
  return keywords.some(k => lq.includes(k));
}

export async function fetchRenstraData(query?: string): Promise<RenstraData> {
  const lq = (query || '').toLowerCase().trim();

  try {
    // 1. Fetch Master Indicators (IKU, IKK, Prioritas, Tujuan)
    const [
      { data: tujuanSasaran },
      { data: cascading },
      { data: prioritas },
      { data: iku },
      { data: ikk },
      { data: ikd },
    ] = await Promise.all([
      supabase.from('renstra_tujuan_sasaran').select('*').limit(20),
      supabase.from('renstra_cascading_program').select('*').limit(30),
      supabase.from('renstra_subkegiatan_prioritas').select('*').limit(20),
      supabase.from('renstra_iku').select('*').limit(20),
      supabase.from('renstra_ikk').select('*').limit(50),
      supabase.from('renstra_ikd').select('*').limit(50),
    ]);

    // 2. If there's a specific query term, search the 27-page Program & Pagu table
    let paguSearchResults: any[] = [];
    if (lq && lq.length > 2) {
      // Extract keywords
      const words = lq.split(/\s+/).filter(w => w.length > 3 && !['berapa', 'apakah', 'bagaimana', 'tampilkan', 'minta', 'data', 'pada', 'yang', 'untuk', 'kota', 'cilegon'].includes(w));
      const searchTerms = words.length > 0 ? words : [lq];

      let queryBuilder = supabase.from('renstra_program_kegiatan_pagu').select('*');
      if (searchTerms.length === 1) {
        queryBuilder = queryBuilder.or(`kode_uraian.ilike.%${searchTerms[0]}%,indikator.ilike.%${searchTerms[0]}%,perangkat_daerah.ilike.%${searchTerms[0]}%`);
      } else {
        const orConditions = searchTerms.map(term => `kode_uraian.ilike.%${term}%,indikator.ilike.%${term}%`).join(',');
        queryBuilder = queryBuilder.or(orConditions);
      }
      const { data: searchData } = await queryBuilder.limit(25);
      paguSearchResults = searchData || [];
    }

    return {
      tujuanSasaran: tujuanSasaran || [],
      cascading: cascading || [],
      prioritas: prioritas || [],
      iku: iku || [],
      ikk: ikk || [],
      ikd: ikd || [],
      paguSearchResults,
    };
  } catch (err) {
    console.warn('[renstra] Error fetching renstra tables:', err);
    return {
      tujuanSasaran: [],
      cascading: [],
      prioritas: [],
      iku: [],
      ikk: [],
      ikd: [],
      paguSearchResults: [],
    };
  }
}

function formatRupiah(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num) || num === 0) return '-';
  return 'Rp ' + Number(num).toLocaleString('id-ID');
}

export function buildRenstraContext(data: RenstraData, queryText?: string): string {
  let ctx = `\n=== BASIS DATA RESMI RENSTRA DKPP KOTA CILEGON (2025 - 2030) ===\n`;

  // 1. Program & Subkegiatan Prioritas
  if (data.prioritas && data.prioritas.length > 0) {
    ctx += `\n[PROGRAM & SUBKEGIATAN PRIORITAS DAERAH RENSTRA DKPP]:\n`;
    data.prioritas.forEach((p, idx) => {
      ctx += `${idx + 1}. ${p.nama_program} (${p.kode_program})\n`;
      ctx += `   - Outcome: ${p.outcome}\n`;
      ctx += `   - Kegiatan: ${p.nama_kegiatan} (${p.kode_kegiatan})\n`;
      ctx += `   - Subkegiatan: ${p.nama_subkegiatan} (${p.kode_subkegiatan})\n`;
    });
  }

  // 2. Indikator Kinerja Utama (IKU)
  if (data.iku && data.iku.length > 0) {
    ctx += `\n[INDIKATOR KINERJA UTAMA (IKU) DKPP KOTA CILEGON]:\n`;
    data.iku.forEach((i, idx) => {
      ctx += `${idx + 1}. ${i.indikator} (Satuan: ${i.satuan})\n`;
      ctx += `   - Baseline 2024: ${i.baseline_2024} | Target 2025: ${i.target_2025} | 2026: ${i.target_2026} | 2027: ${i.target_2027} | 2028: ${i.target_2028} | 2029: ${i.target_2029} | 2030: ${i.target_2030}\n`;
    });
  }

  // 3. Tujuan dan Sasaran Renstra (Tabel 3.3)
  if (data.tujuanSasaran && data.tujuanSasaran.length > 0) {
    ctx += `\n[TUJUAN, SASARAN, & INDIKATOR SASARAN STRATEGIS (TABEL 3.3)]:\n`;
    data.tujuanSasaran.forEach((t, idx) => {
      ctx += `${idx + 1}. Sasaran RPJMD: ${t.nspk_sasaran_rpjmd}\n`;
      ctx += `   - Tujuan DKPP: ${t.tujuan}\n`;
      ctx += `   - Indikator: ${t.indikator_sasaran} (Satuan: ${t.satuan}, Baseline 2024: ${t.baseline_2024}, Target 2026: ${t.target_2026}, Target 2030: ${t.target_2030})\n`;
    });
  }

  // 4. Cascading Program & Pagu Indikatif (Tabel 4.1)
  if (data.cascading && data.cascading.length > 0) {
    ctx += `\n[CASCADING PROGRAM, TARGET OUTCOME & PAGU INDIKATIF (TABEL 4.1)]:\n`;
    data.cascading.slice(0, 15).forEach((c, idx) => {
      ctx += `${idx + 1}. ${c.program}\n`;
      ctx += `   - Indikator Outcome: ${c.indikator_program} (Satuan: ${c.satuan})\n`;
      ctx += `   - Target: Baseline ${c.target_baseline_2024} -> 2026: ${c.target_2026} -> 2030: ${c.target_2030}\n`;
      if (c.pagu_2026) {
        ctx += `   - Pagu Indikatif: 2025: ${formatRupiah(c.pagu_2025)}, 2026: ${formatRupiah(c.pagu_2026)}, 2027: ${formatRupiah(c.pagu_2027)}, 2028: ${formatRupiah(c.pagu_2028)}, 2029: ${formatRupiah(c.pagu_2029)}\n`;
      }
    });
  }

  // 5. Indikator Kinerja Kunci (IKK) Urusan & UPTD
  if (data.ikk && data.ikk.length > 0) {
    ctx += `\n[INDIKATOR KINERJA KUNCI (IKK) URUSAN PANGAN, PERIKANAN, PERTANIAN, & UPTD]:\n`;
    data.ikk.slice(0, 20).forEach((k) => {
      ctx += `- [${k.kode_urusan_pd}] ${k.indikator}: Baseline ${k.baseline_2024} ${k.satuan} | Target 2026: ${k.target_2026} | Target 2030: ${k.target_2030}\n`;
    });
  }

  // 6. Hasil Pencarian Rincian Subkegiatan & Pagu Anggaran (Tabel 4.3 V2)
  if (data.paguSearchResults && data.paguSearchResults.length > 0) {
    ctx += `\n[RINCIAN PROGRAM / KEGIATAN / SUBKEGIATAN & PAGU ANGGARAN RELEVAN DARI HASIL PENCARIAN (TABEL 4.3 V2)]:\n`;
    data.paguSearchResults.forEach((p, idx) => {
      ctx += `${idx + 1}. Uraian: ${p.kode_uraian}\n`;
      if (p.indikator) ctx += `   - Indikator: ${p.indikator}\n`;
      if (p.target_2026) ctx += `   - Target Output: 2026 (${p.target_2026}), 2027 (${p.target_2027}), 2030 (${p.target_2030})\n`;
      if (p.pagu_2026 || p.pagu_2027 || p.pagu_2028) {
        ctx += `   - Pagu Anggaran: 2026 (${formatRupiah(p.pagu_2026)}), 2027 (${formatRupiah(p.pagu_2027)}), 2028 (${formatRupiah(p.pagu_2028)}), 2029 (${formatRupiah(p.pagu_2029)}), 2030 (${formatRupiah(p.pagu_2030)})\n`;
      }
      if (p.perangkat_daerah) ctx += `   - Unit Penanggung Jawab: ${p.perangkat_daerah}\n`;
      if (p.lokasi_keterangan) ctx += `   - Lokasi/Keterangan: ${p.lokasi_keterangan}\n`;
    });
  }

  return ctx;
}
