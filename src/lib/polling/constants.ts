import { PollTheme } from './types';

export const OFFICIAL_POLL_THEMES: PollTheme[] = [
  {
    id: 'poll-cantik',
    code: 'cantik',
    title: 'Pegawai Paling Cantik',
    short_label: 'Paling Cantik',
    icon: '💃',
    description: 'Siapa pegawai wanita paling anggun, memukau, dan berpenampilan menawan?',
    max_choices: 3,
    allow_self_vote: false,
    is_active: true,
  },
  {
    id: 'poll-ganteng',
    code: 'ganteng',
    title: 'Pegawai Paling Ganteng',
    short_label: 'Paling Ganteng',
    icon: '💇',
    description: 'Siapa pegawai pria dengan pesona dan penampilan paling ganteng & rapi di kantor?',
    max_choices: 3,
    allow_self_vote: false,
    is_active: true,
  },
  {
    id: 'poll-cerdas',
    code: 'cerdas',
    title: 'Pegawai Paling Cerdas',
    short_label: 'Paling Cerdas',
    icon: '🧠',
    description: 'Siapa pegawai paling solutif, analitis, dan cepat memecahkan masalah rumit?',
    max_choices: 3,
    allow_self_vote: false,
    is_active: true,
  },
  {
    id: 'poll-rajin',
    code: 'rajin',
    title: 'Pegawai Paling Rajin',
    short_label: 'Paling Rajin',
    icon: '📚',
    description: 'Siapa pegawai paling disiplin, selalu tepat waktu, dan gigih menuntaskan tugas?',
    max_choices: 3,
    allow_self_vote: false,
    is_active: true,
  },
  {
    id: 'poll-soleh',
    code: 'soleh',
    title: 'Pegawai Paling Soleh & Religius',
    short_label: 'Paling Soleh',
    icon: '🕌',
    description: 'Siapa pegawai paling on time di mushola, dan paling baik akhlaknya di kantor?',
    max_choices: 3,
    allow_self_vote: false,
    is_active: true,
  },
  {
    id: 'poll-dermawan',
    code: 'dermawan',
    title: 'Pegawai Paling Bersih',
    short_label: 'Paling Bersih',
    icon: '🧹',
    description: 'Siapa pegawai yang paling suka beberes dan menjaga kebersihan ruangan kantor?',
    max_choices: 3,
    allow_self_vote: false,
    is_active: true,
  },
  {
    id: 'poll-royal',
    code: 'royal',
    title: 'Pegawai Paling Royal',
    short_label: 'Paling Royal (Suka Traktir)',
    icon: '🎁',
    description: 'Siapa rekan kerja yang paling hobi traktir kopi, jajan, dan makan siang bareng?',
    max_choices: 3,
    allow_self_vote: false,
    is_active: true,
  },
  {
    id: 'poll-baik',
    code: 'baik',
    title: 'Pegawai Paling Baik Hati',
    short_label: 'Paling Baik',
    icon: '❤️',
    description: 'Siapa pegawai yang paling ramah, hangat, tulus, dan tidak pernah mengeluh?',
    max_choices: 3,
    allow_self_vote: false,
    is_active: true,
  },
  {
    id: 'poll-tahu_segala',
    code: 'tahu_segala',
    title: 'Pegawai Paling Ramah',
    short_label: 'Paling Ramah',
    icon: '😀',
    description: 'Siapa pegawai yang selalu menyapa duluan dan paling ramah kepada siapa saja?',
    max_choices: 3,
    allow_self_vote: false,
    is_active: true,
  },
  {
    id: 'poll-update',
    code: 'update',
    title: 'Pegawai Paling Pendiam',
    short_label: 'Paling Pendiam',
    icon: '🤫',
    description: 'Siapa pegawai yang paling pendiam, diam-diam menghanyutkan di kantor?',
    max_choices: 3,
    allow_self_vote: false,
    is_active: true,
  },
  {
    id: 'poll-gaptek',
    code: 'gaptek',
    title: 'Pegawai Paling Suka Jajan',
    short_label: 'Paling Banyak Jajan',
    icon: '🍔',
    description: 'Siapa yang paling sering ke warung beli jajanan atau ngemil di kantor?',
    max_choices: 3,
    allow_self_vote: false,
    is_active: true,
  },
  {
    id: 'poll-murah_senyum',
    code: 'murah_senyum',
    title: 'Pegawai Paling Murah Senyum',
    short_label: 'Paling Murah Senyum',
    icon: '😊',
    description: 'Siapa yang senyumnya selalu merekah dari pagi hingga sore mencairkan suasana kantor?',
    max_choices: 3,
    allow_self_vote: false,
    is_active: true,
  },
  {
    id: 'poll-cool',
    code: 'cool',
    title: 'Pegawai Paling Cool & Nyantai',
    short_label: 'Paling Cool',
    icon: '😎',
    description: 'Siapa yang selalu santai, tenang menghadapi deadline badai, dan tetap berkharisma?',
    max_choices: 3,
    allow_self_vote: false,
    is_active: true,
  },
  {
    id: 'poll-trendy',
    code: 'trendy',
    title: 'Pegawai Paling Sibuk',
    short_label: 'Paling Sibuk',
    icon: '🤓',
    description: 'Siapa pegawai yang kelihatannya sibuk mulai pagi sampai sore setiap harinya?',
    max_choices: 3,
    allow_self_vote: false,
    is_active: true,
  },
  {
    id: 'poll-lucu',
    code: 'lucu',
    title: 'Pegawai Paling Lucu (Komika DKPP)',
    short_label: 'Paling Lucu',
    icon: '😂',
    description: 'Siapa yang celetukannya selalu bikin seisi ruangan tertawa terpingkal-pingkal?',
    max_choices: 3,
    allow_self_vote: false,
    is_active: true,
  },
];

/**
 * Determine employee gender ('L' = Laki-laki / Pria, 'P' = Perempuan / Wanita)
 * Uses standard Indonesian ASN NIP 15th digit (1 = L, 2 = P) and fallback female name matching.
 */
export function getEmployeeGender(nip?: string | null, fullName?: string): 'L' | 'P' {
  const cleanNip = (nip || '').replace(/\D/g, '');
  if (cleanNip.length >= 15) {
    const genderDigit = cleanNip.charAt(14);
    if (genderDigit === '1') return 'L';
    if (genderDigit === '2') return 'P';
  }

  const nameLower = (fullName || '').toLowerCase();

  // Female name keywords & indicators
  const femalePatterns = [
    'efa', 'cahyaning', 'dina', 'linda', 'meisaroh', 'winda', 'sanlin', 'febrika', 'maryori',
    'shofi', 'ghesika', 'lina', 'sri', 'nina', 'erna', 'intan', 'minarni', 'maisaroh', 'fani',
    'mariatul', 'rofiqoh', 'ayara', 'ayaza', 'nova', 'ita', 'ayu', 'maida', 'mastufah',
    'rofiatul', 'ninin', 'musfiroh', 'devi', 'rosmani', 'hj.', 'dra.', 'pertiwi', 'astuti',
    'lestari', 'titalia', 'safitri', 'yessi', 'yessy', 'putri', 'cahyani', 'piliang',
    'anggraeni', 'amelia', 'dewi', 'ratna', 'rahmawati', 'hidayah', 'liva', 'anisa', 'rini',
    'riska', 'nurul'
  ];

  if (femalePatterns.some(p => nameLower.includes(p))) {
    return 'P';
  }

  return 'L';
}

