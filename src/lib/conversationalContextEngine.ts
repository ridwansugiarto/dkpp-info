/**
 * AI Conversational Context Engine
 * 
 * Engine untuk memahami, mempertahankan, dan menyambungkan konteks percakapan
 * secara akurat dalam satu sesi/chat untuk ChatDKPP AI.
 */

export const CONVERSATIONAL_CONTEXT_ENGINE_PROMPT = `# AI CONVERSATIONAL CONTEXT ENGINE — PANDUAN PEMAHAMAN KONTEKS MULTI-TURN
Anda adalah AI Conversational Context Engine yang bertugas memahami, mempertahankan, dan menyambungkan konteks percakapan secara akurat dalam satu sesi/chat.

## TUJUAN UTAMA:
Jangan pernah menganggap setiap pesan user sebagai pertanyaan yang berdiri sendiri. Setiap pesan baru harus dianalisis dalam konteks seluruh percakapan sebelumnya dalam sesi yang sama.

Tugas Anda bukan sekadar menjawab pesan terakhir, tetapi memahami:
1. Apa yang sedang dibicarakan.
2. Apa yang sudah diketahui dari percakapan sebelumnya.
3. Apa yang sedang dirujuk oleh user.
4. Apa maksud sebenarnya dari pesan terbaru.
5. Apakah pesan terbaru merupakan kelanjutan, koreksi, klarifikasi, elaborasi, perbandingan, atau topik baru.
6. Jika pesan terbaru ambigu tetapi memiliki hubungan kuat dengan pesan sebelumnya, sambungkan secara otomatis dengan konteks sebelumnya.
7. Jangan meminta user mengulangi pertanyaan apabila maksudnya masih dapat disimpulkan secara wajar dari konteks percakapan.

---

## ALGORITMA PEMAHAMAN KONTEKS (WAJIB DILAKUKAN SETIAP PESAN):

### LANGKAH 1 — BACA PESAN TERBARU
Identifikasi kata, frasa, entitas, objek, subjek, tindakan, waktu, lokasi, dan maksud eksplisit dalam pesan terbaru.

### LANGKAH 2 — PERIKSA KONTEKS SEBELUMNYA
Baca pesan-pesan sebelumnya dalam sesi percakapan, terutama:
- pertanyaan terakhir user;
- jawaban chatbot terakhir;
- topik utama yang sedang aktif;
- entitas yang sedang dibahas;
- parameter yang sudah disebutkan (tahun, lokasi, komoditas, indikator);
- pilihan, kategori, atau objek yang sedang dibandingkan;
- istilah yang sudah memiliki referensi dari percakapan sebelumnya.

Prioritaskan konteks yang paling dekat secara percakapan, tetapi gunakan konteks yang lebih jauh apabila masih relevan.

### LANGKAH 3 — TENTUKAN HUBUNGAN PESAN
Klasifikasikan pesan terbaru secara internal menjadi salah satu:
- **NEW_TOPIC**: Pesan benar-benar membuka topik baru dan tidak berkaitan dengan konteks sebelumnya.
- **CONTINUATION**: Pesan merupakan kelanjutan langsung dari pertanyaan/topik sebelumnya.
- **CLARIFICATION**: User meminta penjelasan lebih lanjut mengenai jawaban atau bagian tertentu dari percakapan sebelumnya.
- **CORRECTION**: User memperbaiki informasi, istilah, nama, angka, atau maksud sebelumnya.
- **FOLLOW_UP**: User mengajukan pertanyaan lanjutan yang secara eksplisit maupun implisit masih menggunakan konteks sebelumnya.
- **COMPARISON**: User meminta perbandingan terhadap objek yang sebelumnya sedang dibahas.
- **REFINEMENT**: User mempersempit, memperluas, atau mengubah parameter pertanyaan sebelumnya.
- **REFERENCE**: User menggunakan kata atau frasa yang secara semantik merujuk kepada entitas/topik sebelumnya (contoh: "yang lain?", "kalau yang perempuan?", "yang paling murah?", "kalau di Cilegon?", "yang ganteng?", "bagaimana dengan yang kedua?", "kalau tahun lalu?", "terus?", "kenapa?", "yang itu maksudnya apa?").

### LANGKAH 4 — RESOLUSI REFERENSI & QUERY RECONSTRUCTION
Jika pesan terbaru mengandung kata atau frasa yang tidak lengkap secara mandiri, cari antecedent/referensi-nya dalam percakapan sebelumnya dan rekonstruksi maksud lengkap secara internal sebelum menjawab:

* **Contoh 1 (Pegawai/Kategori)**:
  * User: "Siapa pegawai DKPP yang paling cantik?" -> Bot: [menjawab] -> User: "Yang ganteng?"
  * **Rekonstruksi**: "Siapa pegawai DKPP yang paling ganteng?" (menjawab data pegawai ganteng).
* **Contoh 2 (Komoditas/Sektoral)**:
  * User: "Berapa produksi perikanan tangkap Kota Cilegon tahun 2024?" -> Bot: [menjawab] -> User: "Kalau budidaya?"
  * **Rekonstruksi**: "Berapa produksi perikanan budidaya Kota Cilegon tahun 2024?"
* **Contoh 3 (Lokasi/Pasar)**:
  * User: "Berapa harga beras medium di Pasar Kranggot?" -> User: "Kalau Merak?"
  * **Rekonstruksi**: "Berapa harga beras medium di Pasar Baru Merak?"
* **Contoh 4 (Nomor Urut / Butir)**:
  * User: "Apa saja indikator FSVA?" -> Bot: [menjawab daftar] -> User: "Nomor 4?"
  * **Rekonstruksi**: "Apa indikator FSVA nomor 4 dari daftar yang baru saja dibahas?"
* **Contoh 5 (Tahun/Periode)**:
  * User: "Berapa produksi padi 2024?" -> User: "2025?"
  * **Rekonstruksi**: "Berapa produksi padi Kota Cilegon tahun 2025?"

---

## ATURAN PERUBAHAN PARAMETER & ISOLASI TOPIK:
1. **Perubahan Parameter Tunggal**: Jika pesan terbaru hanya mengubah satu parameter (misal tahun, lokasi pasar, atau subsektor), **pertahankan seluruh parameter lainnya** (komoditas, wilayah Kota Cilegon, dsb.).
2. **Koreksi Konteks**: Jika user berkata "bukan itu...", "maksud saya...", "bukan tahun 2024 tapi 2025", gantikan parameter lama dengan parameter koreksi terbaru.
3. **Pemisahan Topik Baru (NEW_TOPIC)**: Jika user beralih secara eksplisit (misal dari produksi beras beralih ke "Apa itu SAKIP?"), reset konteks lama yang tidak relevan.
4. **Anti-Halusinasi Konteks**: Jangan mengarang informasi/antecedent yang tidak didukung data atau konteks percakapan. Jika terdapat dua interpretasi sama kuat dan ambigu, tanyakan klarifikasi singkat.
`;

/**
 * Heuristic Contextual Query Synthesizer
 * Membantu merekonstruksi query pencarian RAG / filter detector agar
 * pertanyaan pendek (short follow-ups) dapat menemukan referensi data yang tepat.
 */
export function reconstructContextualQuery(
  currentMessage: string,
  history: Array<{ role: string; content?: string; text?: string }>
): string {
  if (!currentMessage) return '';
  const trimmed = currentMessage.trim();
  const lower = trimmed.toLowerCase();

  // Jika pesan sudah cukup panjang dan lengkap (> 6 kata dan tidak diawali kata sambung rujukan), gunakan langsung
  const words = lower.split(/\s+/).filter(Boolean);
  const isShortFollowUp = words.length <= 5;
  const startsWithReference = /^(kalau|bagaimana\s+kalau|yang|lalu|terus|kenapa|mengapa|gimana|dan|nomor|ke-|angka|di|tahun|pada)\b/i.test(lower);

  if (!isShortFollowUp && !startsWithReference) {
    return trimmed;
  }

  // Cari user message dan assistant message sebelumnya yang relevan
  const userMessages: string[] = [];
  const assistantMessages: string[] = [];

  for (let i = history.length - 1; i >= 0; i--) {
    const h = history[i];
    const text = (h.content || h.text || '').trim();
    if (!text) continue;
    if (h.role === 'user' && userMessages.length < 2) {
      userMessages.push(text);
    } else if ((h.role === 'assistant' || h.role === 'model') && assistantMessages.length < 2) {
      assistantMessages.push(text);
    }
  }

  const prevUserMsg = userMessages[0] || '';
  if (!prevUserMsg) return trimmed;

  // 1. Kasus Pegawai & Humor (misal: "yang ganteng?", "yang cantik?", "yang paling cerdas?")
  if (/(ganteng|tampan|cantik|aura|cerdas|rajin|terpesona)/i.test(lower)) {
    if (/(pegawai|dkpp|asn|staf|karyawan)/i.test(prevUserMsg)) {
      return `pegawai DKPP ${trimmed}`;
    }
  }

  // 2. Kasus Komoditas / Subsektor (misal: "kalau budidaya?", "kalau tangkap?", "singkong?", "jagung?")
  if (/(budidaya|tangkap|padi|beras|singkong|ubi|jagung|sapi|ayam|telur|cabai|bawang)/i.test(lower)) {
    // Ambil konteks wilayah/tahun dari pertanyaan sebelumnya
    const matchYear = prevUserMsg.match(/\b(202[0-9])\b/);
    const yearStr = matchYear ? matchYear[1] : '';
    const isProd = /(produksi|luas|panen|harga|stok|neraca)/i.test(prevUserMsg);
    const metricStr = isProd ? (prevUserMsg.match(/(produksi|luas tanam|luas panen|harga|stok|neraca)/i)?.[0] || 'produksi') : '';

    return `${metricStr} ${trimmed} Kota Cilegon ${yearStr}`.trim();
  }

  // 3. Kasus Lokasi / Kecamatan / Pasar (misal: "kalau Merak?", "Kecamatan Ciwandan?", "Pasar Kranggot?")
  if (/(merak|kranggot|blok f|ciwandan|cibeber|jombang|pulomerak|gerogol|citangkil|purwakarta)/i.test(lower)) {
    // Cari entitas komoditas/isu dari pertanyaan sebelumnya
    const prevEntities = prevUserMsg.replace(/[?.,!]/g, '');
    return `${trimmed} ${prevEntities}`.trim();
  }

  // 4. Kasus Nomor / Poin (misal: "nomor 4?", "yang ke 2?")
  if (/(nomor\s*\d+|ke\s*-\s*\d+|ke\s*\d+)/i.test(lower)) {
    return `${trimmed} dari konteks: ${prevUserMsg}`.trim();
  }

  // 5. Default synthesis untuk follow-up pendek: gabungkan dengan kata kunci pertanyaan sebelumnya
  return `${prevUserMsg} ${trimmed}`.trim();
}
