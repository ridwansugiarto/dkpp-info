const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf-8');
const envVars = Object.fromEntries(
  env.split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const idx = l.indexOf('='); return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]; })
);

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = envVars.SUPABASE_SECRET_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const themes = [
  {"code": "ganteng", "short_label": "Paling Ganteng", "title": "Pegawai Paling Ganteng", "icon": "💇", "description": "Siapa pegawai pria dengan pesona dan penampilan paling ganteng & rapi di kantor?"},
  {"code": "cantik", "short_label": "Paling Cantik", "title": "Pegawai Paling Cantik", "icon": "💃", "description": "Siapa pegawai wanita paling anggun, memukau, dan berpenampilan menawan?"},
  {"code": "cerdas", "short_label": "Paling Cerdas", "title": "Pegawai Paling Cerdas", "icon": "🧠", "description": "Siapa pegawai paling solutif, analitis, dan cepat memecahkan masalah rumit?"},
  {"code": "rajin", "short_label": "Paling Rajin", "title": "Pegawai Paling Rajin", "icon": "📚", "description": "Siapa pegawai paling disiplin, selalu tepat waktu, dan gigih menuntaskan tugas?"},
  {"code": "soleh", "short_label": "Paling Soleh", "title": "Pegawai Paling Soleh & Santun", "icon": "🕌", "description": "Siapa pegawai paling bersahaja, berakhlak mulia, dan rajin ibadah?"},
  {"code": "dermawan", "short_label": "Paling Dermawan", "title": "Pegawai Paling Dermawan", "icon": "🪙", "description": "Siapa pegawai yang paling ringan tangan suka berbagi rezeki dan membantu sesama?"},
  {"code": "royal", "short_label": "Paling Royal (Suka Traktir)", "title": "Pegawai Paling Royal", "icon": "🎁", "description": "Siapa rekan kerja yang paling hobi traktir kopi, jajan, dan makan siang bareng?"},
  {"code": "baik", "short_label": "Paling Baik", "title": "Pegawai Paling Baik Hati", "icon": "❤️", "description": "Siapa pegawai yang paling ramah, hangat, tulus, dan tidak pernah mengeluh?"},
  {"code": "tahu_segala", "short_label": "Paling Tahu Segala", "title": "Pegawai Paling Tahu Segala (Kamus Berjalan)", "icon": "💡", "description": "Tanya apa saja pasti tahu! Siapa yang punya wawasan paling luas di kantor?"},
  {"code": "update", "short_label": "Paling Update", "title": "Pegawai Paling Update", "icon": "📶", "description": "Siapa pegawai yang paling cepat tahu info terkini, berita viral, dan tren baru?"},
  {"code": "gaptek", "short_label": "Paling Gaptek", "title": "Pegawai Paling Gaptek (Lucu & Innocent)", "icon": "💻", "description": "Siapa yang paling sering minta bantuan klik mouse atau bingung format file tapi tetap bikin gemas?"},
  {"code": "murah_senyum", "short_label": "Paling Murah Senyum", "title": "Pegawai Paling Murah Senyum", "icon": "😊", "description": "Siapa yang senyumnya selalu merekah dari pagi hingga sore mencairkan suasana kantor?"},
  {"code": "cool", "short_label": "Paling Cool", "title": "Pegawai Paling Cool & Tenang", "icon": "😎", "description": "Siapa yang selalu santai, tenang menghadapi deadline badai, dan tetap berkharisma?"},
  {"code": "trendy", "short_label": "Paling Sibuk", "title": "Pegawai Paling Sibuk", "icon": "🤓", "description": "Siapa pegawai yang kelihatannya sibuk mulai pagi sampai sore setiap harinya?"},
  {"code": "lucu", "short_label": "Paling Lucu", "title": "Pegawai Paling Lucu (Komika DKPP)", "icon": "😂", "description": "Siapa yang celetukannya selalu bikin seisi ruangan tertawa terpingkal-pingkal?"}
];

async function sync() {
  console.log('=== SYNCING POLLING DATA TO SUPABASE ===');

  // Sync Employees
  const active = JSON.parse(fs.readFileSync('scratch/all_active_pegawai.json', 'utf-8'));
  console.log(`Syncing ${active.length} active employees to 'employees' table...`);
  let empSuccess = 0;
  for (const p of active) {
    const { error } = await supabase.from('employees').upsert({
      nip: p.nip,
      full_name: p.nama,
      position: p.jabatan,
      unit: p.bidang,
      is_active: true,
      updated_at: new Date().toISOString()
    }, { onConflict: 'nip' });
    if (!error) empSuccess++;
    else console.warn(`Emp failed (${p.nama}):`, error.message);
  }
  console.log(`✓ Employees synced: ${empSuccess}/${active.length}`);

  // Sync Poll Themes
  console.log('Syncing 15 poll themes...');
  let pollSuccess = 0;
  for (const t of themes) {
    const { error } = await supabase.from('polls').upsert({
      code: t.code,
      title: t.title,
      short_label: t.short_label,
      icon: t.icon,
      description: t.description,
      max_choices: 3,
      allow_self_vote: false,
      is_active: true
    }, { onConflict: 'code' });
    if (!error) pollSuccess++;
    else console.warn(`Poll theme failed (${t.code}):`, error.message);
  }
  console.log(`✓ Poll themes synced: ${pollSuccess}/${themes.length}`);
}

sync().catch(console.error);
