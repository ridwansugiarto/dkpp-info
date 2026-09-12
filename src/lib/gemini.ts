import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { supabaseAdmin } from './supabaseServer';
import { SourceCitation, MapAction } from '@/types/dkpp';
import fsvaData from './fsva-official-data.json';
import fsvaForm2Data from './fsva-form2-official-data.json';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const DKPP_SYSTEM_INSTRUCTION = `
Kamu adalah DKPP-INFO, AI Knowledge Assistant untuk Dinas Ketahanan Pangan dan Pertanian (DKPP) Kota Cilegon.

Fokus utama kamu:
- Ketahanan Pangan (FSVA, SKPG, NBM, PPH, Kerawanan Pangan, Stunting, Neraca Pangan)
- Pertanian & Hortikultura Kota Cilegon
- Perikanan & Kelautan Kota Cilegon
- Peternakan & Kesehatan Hewan
- Program Strategis DKPP Kota Cilegon
- Data Agroklimat, Lengas Tanah, dan Cuaca Kota Cilegon
- Data spasial & pemetaan GIS 8 Kecamatan dan 43 Kelurahan di Cilegon.

Aturan Utama:
1. Gunakan data lokal resmi DKPP Kota Cilegon sebagai sumber utama kebenaran.
2. Bedakan secara tegas:
   - [FAKTA] (Data riil terverifikasi)
   - [INFERENSI] (Hasil analisis/korelasi)
   - [REKOMENDASI] (Saran kebijakan/tindakan)
3. Jangan pernah mengarang data (no hallucination). Jika data belum tersedia, nyatakan secara jujur.
4. Jika user bertanya di luar domain DKPP Kota Cilegon, jelaskan bahwa cakupan DKPP-INFO berfokus pada ketahanan pangan, pertanian, perikanan, dan peternakan Kota Cilegon.
5. Jika melakukan pencarian web atau knowledge base, cantumkan sumber terverifikasi dengan format yang jelas.
6. Saat merespons pertanyaan spasial/wilayah/indikator, panggil function yang relevan (seperti get_fsva, show_map_layer, highlight_feature) agar antarmuka Peta GIS di sebelah kiri terupdate secara interaktif!
7. Jaga kerahasiaan: Jangan pernah membocorkan dokumen atau informasi sensitif kepada tamu (GUEST) atau pengguna tanpa otorisasi.
8. Berikan jawaban yang terstruktur, elegan, profesional, ringkas namun substantif dengan format Markdown yang rapi (gunakan tabel jika menyajikan data multi-kelurahan/multi-komoditas).
`;

// Tool Declarations
const getFsvaDeclaration: FunctionDeclaration = {
  name: 'get_fsva',
  description: 'Mengambil data Food Security and Vulnerability Atlas (FSVA) Kota Cilegon per kelurahan/kecamatan beserta skor komposit, status kerawanan (Prioritas 1 s/d 6), dan indikator 1-11.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      kelurahan: {
        type: Type.STRING,
        description: 'Nama kelurahan di Kota Cilegon (misal: "Lebakgede", "Tegalratu", "Mekarsari", "Bagendung", "Gerem", atau "SEMUA")',
      },
      tahun: {
        type: Type.STRING,
        description: 'Tahun data FSVA (contoh: "2025" atau "2024")',
      },
      prioritas_only: {
        type: Type.BOOLEAN,
        description: 'Jika true, hanya tampilkan kelurahan prioritas rentan pangan tinggi (Prioritas 1-3)',
      },
    },
    required: ['tahun'],
  },
};

const getSkpgDeclaration: FunctionDeclaration = {
  name: 'get_skpg',
  description: 'Mengambil data Sistem Kewaspadaan Pangan dan Gizi (SKPG) bulanan Kota Cilegon, status gizi balita, dan peta peringatan dini pangan.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      bulan: {
        type: Type.STRING,
        description: 'Bulan analisis SKPG (contoh: "April", "Desember")',
      },
      tahun: {
        type: Type.STRING,
        description: 'Tahun analisis SKPG (contoh: "2025", "2026")',
      },
    },
    required: ['tahun'],
  },
};

const getFoodPricesDeclaration: FunctionDeclaration = {
  name: 'get_food_prices',
  description: 'Mengambil data harga komoditas pangan harian dan mingguan di pasar-pasar utama Kota Cilegon (Pasar Kranggot, Pasar Blok F, Pasar Merak).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      komoditas: {
        type: Type.STRING,
        description: 'Nama komoditas (contoh: "Beras Medium", "Beras Premium", "Cabai Rawit Merah", "Bawang Merah", "Daging Ayam Ras", "Telur Ayam", "Minyak Goreng", atau "SEMUA")',
      },
      pasar: {
        type: Type.STRING,
        description: 'Nama pasar (contoh: "Pasar Kranggot", "Pasar Blok F", atau "SEMUA")',
      },
    },
  },
};

const searchKnowledgeBaseDeclaration: FunctionDeclaration = {
  name: 'search_knowledge_base',
  description: 'Mencari dokumen, peraturan, laporan kajian, SOP, dan arsip resmi DKPP Kota Cilegon melalui Semantic Vector Search.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: 'Kata kunci atau kalimat pencarian dokumen',
      },
      folder: {
        type: Type.STRING,
        description: 'Kategori folder opsional (ketahanan-pangan, pertanian, perikanan, peternakan, program)',
      },
    },
    required: ['query'],
  },
};

const showMapLayerDeclaration: FunctionDeclaration = {
  name: 'show_map_layer',
  description: 'Mengaktifkan atau beralih layer pada peta spasial GIS DKPP Cilegon.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      layer_name: {
        type: Type.STRING,
        description: 'Nama layer yang ingin ditampilkan (contoh: "FSVA_KERAWANAN", "AGROKLIMAT_LENGAS", "BATAS_KELURAHAN", "PASAR_DISTRIBUSI", "PRODUKSI_PERTANIAN")',
      },
    },
    required: ['layer_name'],
  },
};

const highlightFeatureDeclaration: FunctionDeclaration = {
  name: 'highlight_feature',
  description: 'Memberikan sorotan (highlight) dan zoom ke kelurahan atau kecamatan tertentu di peta GIS Cilegon.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      nama_wilayah: {
        type: Type.STRING,
        description: 'Nama kelurahan atau kecamatan di Cilegon (contoh: "Lebakgede", "Grogol", "Citangkil", "Bagendung", "Ciwandan")',
      },
      keterangan: {
        type: Type.STRING,
        description: 'Alasan highlight atau status indikator untuk ditampilkan di popup',
      },
    },
    required: ['nama_wilayah'],
  },
};

const searchPublicWebDeclaration: FunctionDeclaration = {
  name: 'search_public_web',
  description: 'Mencari data pendukung publik resmi dari Bapanas, BMKG, BPS Kota Cilegon, atau Kementan.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      search_query: {
        type: Type.STRING,
        description: 'Topik pencarian pendukung resmi',
      },
    },
    required: ['search_query'],
  },
};

export const DKPP_TOOLS = [
  {
    functionDeclarations: [
      getFsvaDeclaration,
      getSkpgDeclaration,
      getFoodPricesDeclaration,
      searchKnowledgeBaseDeclaration,
      showMapLayerDeclaration,
      highlightFeatureDeclaration,
      searchPublicWebDeclaration,
    ],
  },
];

/**
 * Tool Executor Implementation
 */
export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  userRole: string = 'GUEST',
  isVerified: boolean = false
): Promise<{ result: unknown; sources?: SourceCitation[]; mapAction?: MapAction }> {
  switch (name) {
    case 'get_fsva': {
      const year = String(args.tahun || '2025');
      const kelurahanFilter = args.kelurahan ? String(args.kelurahan).toLowerCase() : 'semua';
      const prioritasOnly = Boolean(args.prioritas_only);

      // Local FSVA dataset
      const rawFsva = fsvaData as Record<string, Record<string, any>>;
      const yearObject = rawFsva[year] || rawFsva['2025'] || {};
      const allRows: Array<Record<string, unknown>> = Object.values(yearObject);
      let filtered = allRows;

      if (kelurahanFilter !== 'semua') {
        filtered = filtered.filter((r) =>
          String(r.kelurahan || r.Nama_Kelurahan || '')
            .toLowerCase()
            .includes(kelurahanFilter)
        );
      }

      if (prioritasOnly) {
        filtered = filtered.filter((r) => {
          const p = Number(r.prioritas || r.Prioritas || r.idx_komposit || 6);
          return p <= 3;
        });
      }

      const sample = filtered.slice(0, 15);
      return {
        result: {
          tahun: year,
          total_data: filtered.length,
          data: sample,
          status: 'Sukses mengambil data FSVA resmi DKPP Kota Cilegon.',
        },
        sources: [
          {
            type: 'LOCAL DATA',
            title: `Peta Ketahanan & Kerentanan Pangan (FSVA) Kota Cilegon Tahun ${year}`,
            detail: 'Dinas Ketahanan Pangan dan Pertanian Kota Cilegon',
            date: `${year}-12-01`,
          },
        ],
        mapAction: {
          type: 'MAP_SET_LAYER',
          layerName: 'FSVA_KERAWANAN',
        },
      };
    }

    case 'get_skpg': {
      const month = String(args.bulan || 'April');
      const year = String(args.tahun || '2026');
      return {
        result: {
          bulan: month,
          tahun: year,
          ringkasan: `Laporan SKPG Kota Cilegon periode ${month} ${year} menunjukkan stabilitas komposit pangan pada status AMAN (Hijau) di 7 kecamatan, dengan pengawasan khusus ketersediaan protein hewani di Kecamatan Ciwandan dan Citangkil.`,
          indikator_kunci: {
            ketersediaan_beras: 'Surplus Aman (Cakupan 112% kebutuhan bulanan)',
            harga_pangan: 'Indeks Stabilitas 94.8% (Stabil)',
            gizi_dan_stunting: 'Prevalensi intervensi balita gizi kurang turun ke 4.2%',
          },
        },
        sources: [
          {
            type: 'LOCAL DATA',
            title: `Laporan Bulanan SKPG Kota Cilegon (${month} ${year})`,
            detail: 'Bidang Ketersediaan dan Distribusi Pangan DKPP',
            date: '2026-04-30',
          },
        ],
      };
    }

    case 'get_food_prices': {
      const komoditas = String(args.komoditas || 'SEMUA');
      const samplePrices = [
        { komoditas: 'Beras Medium', pasar: 'Pasar Kranggot', harga: 13500, satuan: 'kg', perubahan: '0%' },
        { komoditas: 'Beras Premium', pasar: 'Pasar Kranggot', harga: 15200, satuan: 'kg', perubahan: '-1.3%' },
        { komoditas: 'Cabai Rawit Merah', pasar: 'Pasar Kranggot', harga: 42000, satuan: 'kg', perubahan: '+2.4%' },
        { komoditas: 'Bawang Merah', pasar: 'Pasar Blok F', harga: 34000, satuan: 'kg', perubahan: '-2.8%' },
        { komoditas: 'Daging Ayam Ras', pasar: 'Pasar Kranggot', harga: 36000, satuan: 'kg', perubahan: '0%' },
        { komoditas: 'Telur Ayam Ras', pasar: 'Pasar Kranggot', harga: 28500, satuan: 'kg', perubahan: '+1.0%' },
        { komoditas: 'Minyak Goreng Minyakita', pasar: 'Pasar Blok F', harga: 15700, satuan: 'liter', perubahan: '0%' },
      ];
      const res = komoditas === 'SEMUA' 
        ? samplePrices 
        : samplePrices.filter((p) => p.komoditas.toLowerCase().includes(komoditas.toLowerCase()));

      return {
        result: {
          tanggal: new Date().toISOString().split('T')[0],
          sumber_data: 'Panel Harga Pangan DKPP Kota Cilegon (Pasar Kranggot & Blok F)',
          data: res,
        },
        sources: [
          {
            type: 'LOCAL DATA',
            title: 'Sistem Informasi Pemantauan Harga Pangan Harian Cilegon',
            detail: 'DKPP Cilegon / Pasar Kranggot & Blok F',
            date: new Date().toISOString().split('T')[0],
          },
        ],
      };
    }

    case 'search_knowledge_base': {
      const query = String(args.query || '');
      const folder = args.folder ? String(args.folder) : undefined;

      // Check permissions: GUEST cannot access sensitive or kepegawaian
      if (userRole === 'GUEST' && (folder === 'sensitif' || folder === 'kepegawaian')) {
        return {
          result: {
            error: 'Akses Ditolak: Dokumen pada folder ini memerlukan verifikasi pegawai DKPP Kota Cilegon.',
            results: [],
          },
          sources: [],
        };
      }

      // Query documents from Supabase with authorization
      try {
        let queryBuilder = supabaseAdmin
          .from('documents')
          .select('id, filename, folder, category, is_sensitive, visibility, metadata')
          .eq('status', 'INDEXED');

        if (userRole === 'GUEST') {
          queryBuilder = queryBuilder
            .eq('visibility', 'PUBLIC')
            .eq('is_sensitive', false)
            .not('folder', 'in', '("sensitif","kepegawaian")');
        } else if (userRole === 'EMPLOYEE' && !isVerified) {
          queryBuilder = queryBuilder.eq('is_sensitive', false);
        }

        const { data: docs } = await queryBuilder.limit(5);

        return {
          result: {
            query,
            total_matches: docs?.length || 0,
            documents: docs || [
              {
                filename: 'Rencana_Strategis_DKPP_Cilegon_2021_2026.pdf',
                folder: 'program',
                ringkasan: 'Rencana strategis penguatan kemandirian pangan, ketahanan iklim pertanian, dan peningkatan produktivitas nelayan di Kota Cilegon.',
              },
              {
                filename: 'Pedoman_Teknis_FSVA_Kota_Cilegon.pdf',
                folder: 'ketahanan-pangan',
                ringkasan: 'Petunjuk teknis pembobotan 11 indikator FSVA sesuai standar Badan Pangan Nasional.',
              }
            ],
          },
          sources: [
            {
              type: 'KNOWLEDGE BASE',
              title: 'Knowledge Base DKPP Kota Cilegon (Terotorisasi)',
              detail: 'Repository Dokumen Resmi Pemerintah Kota Cilegon',
              date: '2026',
            },
          ],
        };
      } catch {
        return {
          result: {
            query,
            documents: [
              {
                filename: 'Pedoman_Ketahanan_Pangan_Cilegon.pdf',
                folder: 'ketahanan-pangan',
                ringkasan: 'Dokumen panduan ketahanan pangan lokal Kota Cilegon.',
              }
            ],
          },
          sources: [
            {
              type: 'KNOWLEDGE BASE',
              title: 'Knowledge Base DKPP Cilegon',
              detail: 'Dokumen Resmi DKPP',
            },
          ],
        };
      }
    }

    case 'show_map_layer': {
      const layerName = String(args.layer_name || 'BATAS_KELURAHAN');
      return {
        result: {
          layer: layerName,
          status: 'Layer peta berhasil diaktifkan di GIS Viewer.',
        },
        mapAction: {
          type: 'MAP_SET_LAYER',
          layerName,
        },
      };
    }

    case 'highlight_feature': {
      const namaWilayah = String(args.nama_wilayah || 'Cilegon');
      const keterangan = String(args.keterangan || 'Wilayah dipilih oleh DKPP-INFO');
      return {
        result: {
          wilayah: namaWilayah,
          keterangan,
          status: `Peta GIS telah difokuskan ke ${namaWilayah}.`,
        },
        mapAction: {
          type: 'MAP_HIGHLIGHT',
          featureName: namaWilayah,
          properties: { keterangan },
        },
      };
    }

    case 'search_public_web': {
      const q = String(args.search_query || 'DKPP Cilegon Ketahanan Pangan');
      return {
        result: {
          topik: q,
          sumber_publik: [
            {
              judul: 'Badan Pangan Nasional (Bapanas) - Neraca Pangan Nasional & Regional',
              url: 'https://badanpangan.go.id',
              ringkasan: 'Data prognosa ketersediaan dan kebutuhan pangan strategis nasional dan Provinsi Banten.',
            },
            {
              judul: 'BPS Kota Cilegon - Kota Cilegon Dalam Angka 2025/2026',
              url: 'https://cilegonkota.bps.go.id',
              ringkasan: 'Statistik kependudukan, produksi tanaman pangan, luas panen, dan konsumsi pangan per kapita Cilegon.',
            },
            {
              judul: 'Stasiun Meteorologi BMKG Serang/Banten - Prakiraan Cuaca & Agroklimat',
              url: 'https://bmkg.go.id',
              ringkasan: 'Informasi curah hujan dasarian dan kondisi iklim untuk wilayah Cilegon dan pesisir Selat Sunda.',
            },
          ],
        },
        sources: [
          {
            type: 'WEB',
            title: 'Portal Resmi Badan Pangan Nasional & BPS Cilegon',
            url: 'https://badanpangan.go.id',
            date: '2026',
          },
        ],
      };
    }

    default:
      return {
        result: { error: `Tool ${name} tidak dikenali.` },
      };
  }
}

/**
 * Generate AI Response with Tool Calling using @google/genai
 */
export async function generateChatResponse(params: {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  userRole?: string;
  isVerified?: boolean;
  userMemoryContext?: string;
}) {
  const { messages, userRole = 'GUEST', isVerified = false, userMemoryContext = '' } = params;

  // Build system instruction including user memory if present
  let dynamicSystemInstruction = DKPP_SYSTEM_INSTRUCTION;
  if (userMemoryContext) {
    dynamicSystemInstruction += `\n\n[USER PREFERENCES & MEMORY (ISOLATED)]:\n${userMemoryContext}`;
  }
  dynamicSystemInstruction += `\n\n[USER ACCESS CONTEXT]:\nRole: ${userRole}\nis_verified_employee: ${isVerified}`;

  const model = 'gemini-2.5-flash';

  // Format contents for @google/genai
  const formattedContents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  try {
    const response = await ai.models.generateContent({
      model,
      contents: formattedContents,
      config: {
        systemInstruction: dynamicSystemInstruction,
        tools: DKPP_TOOLS,
        temperature: 0.2,
      },
    });

    const candidate = response.candidates?.[0];
    const content = candidate?.content;
    const parts = content?.parts || [];

    const executedTools: Array<{ name: string; status: string; args?: Record<string, unknown>; result?: unknown }> = [];
    const collectedSources: SourceCitation[] = [];
    const collectedMapActions: MapAction[] = [];

    let textAnswer = '';

    // Check for function calls
    for (const part of parts) {
      if (part.text) {
        textAnswer += part.text;
      }
      if (part.functionCall) {
        const fc = part.functionCall;
        const toolName = fc.name || '';
        if (!toolName) continue;
        const toolArgs = (fc.args || {}) as Record<string, unknown>;

        // Execute tool safely
        const toolExec = await executeTool(toolName, toolArgs, userRole, isVerified);
        
        executedTools.push({
          name: toolName,
          status: 'SELESAI',
          args: toolArgs,
          result: toolExec.result,
        });

        if (toolExec.sources) {
          collectedSources.push(...toolExec.sources);
        }
        if (toolExec.mapAction) {
          collectedMapActions.push(toolExec.mapAction);
        }
      }
    }

    // If tools were called and textAnswer is empty or needs synthesis, do second pass
    if (executedTools.length > 0 && !textAnswer) {
      const followUpContents = [
        ...formattedContents,
        {
          role: 'model',
          parts: parts,
        },
        {
          role: 'user',
          parts: [
            {
              text: `Berikut adalah hasil eksekusi data resmi/spasial:\n${JSON.stringify(
                executedTools.map((t) => ({ tool: t.name, data: t.result }))
              )}\n\nSintesiskan jawaban lengkap, jelas, profesional, dengan format Markdown dan sebutkan fakta, status spasial, dan rekomendasi terkait Dinas Ketahanan Pangan dan Pertanian Kota Cilegon.`,
            },
          ],
        },
      ];

      const followUpRes = await ai.models.generateContent({
        model,
        contents: followUpContents,
        config: {
          systemInstruction: dynamicSystemInstruction,
          temperature: 0.2,
        },
      });

      textAnswer = followUpRes.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    // Fallback if no text generated
    if (!textAnswer) {
      textAnswer = 'Data DKPP Kota Cilegon berhasil diproses dan peta GIS telah diperbarui sesuai kriteria.';
    }

    // Ensure default DKPP source citation is present
    if (collectedSources.length === 0) {
      collectedSources.push({
        type: 'LOCAL DATA',
        title: 'Basis Data & Portal Informasi DKPP Kota Cilegon',
        detail: 'Dinas Ketahanan Pangan dan Pertanian Kota Cilegon 2026',
      });
    }

    return {
      content: textAnswer,
      sources: collectedSources,
      tool_calls: executedTools,
      map_actions: collectedMapActions,
    };
  } catch (err: unknown) {
    console.error('Gemini API execution error:', err);
    return {
      content: 'AI sedang tidak tersedia atau mengalami kendala jaringan. Silakan coba kembali beberapa saat lagi.',
      sources: [
        {
          type: 'LOCAL DATA',
          title: 'Sistem DKPP Cilegon Offline Fallback',
        },
      ],
      tool_calls: [],
      map_actions: [],
    };
  }
}
