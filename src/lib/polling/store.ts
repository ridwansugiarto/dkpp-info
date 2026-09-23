import { supabaseAdmin } from '@/lib/supabaseServer';
import { OFFICIAL_POLL_THEMES } from './constants';
import { PollTheme } from './types';

// In-memory vote store for local and fallback real-time tally
export interface MemoryVote {
  poll_id: string;
  user_id: string;
  employee_id: string;
  created_at: string;
}

export interface MemoryParticipation {
  poll_id: string;
  user_id: string;
  choices_count: number;
  created_at: string;
}

// Global store attached to globalThis in Node to persist across hot reloads
const globalForPolling = globalThis as unknown as {
  _memoryVotes?: MemoryVote[];
  _memoryParticipations?: MemoryParticipation[];
  _cachedActiveThemes?: { data: PollTheme[]; timestamp: number };
};

if (!globalForPolling._memoryVotes) {
  globalForPolling._memoryVotes = [];
}
if (!globalForPolling._memoryParticipations) {
  globalForPolling._memoryParticipations = [];
}

export const memoryVotes = globalForPolling._memoryVotes;
export const memoryParticipations = globalForPolling._memoryParticipations;

/**
 * Invalidate the in-memory cache of poll themes
 */
export function invalidatePollThemesCache() {
  globalForPolling._cachedActiveThemes = undefined;
}

/**
 * Ambil daftar seluruh tema polling aktif dari database Supabase secara dinamis.
 * Menyimpan cache singkat (5 detik) untuk performa tinggi sekaligus sinkronisasi instan pasca edit admin.
 */
export async function getActivePollThemes(): Promise<PollTheme[]> {
  const now = Date.now();
  if (
    globalForPolling._cachedActiveThemes &&
    now - globalForPolling._cachedActiveThemes.timestamp < 5000 &&
    globalForPolling._cachedActiveThemes.data.length > 0
  ) {
    return globalForPolling._cachedActiveThemes.data;
  }

  try {
    const { data: dbPolls, error } = await supabaseAdmin
      .from('polls')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (!error && dbPolls && dbPolls.length > 0) {
      const themes: PollTheme[] = dbPolls.map((p) => ({
        id: p.id,
        code: p.code,
        title: p.title,
        short_label: p.short_label || p.title,
        icon: p.icon || '🏆',
        description: p.description || '',
        max_choices: p.max_choices || 3,
        allow_self_vote: p.allow_self_vote || false,
        is_active: p.is_active ?? true,
      }));

      globalForPolling._cachedActiveThemes = {
        data: themes,
        timestamp: now,
      };
      return themes;
    }
  } catch (err) {
    console.warn('getActivePollThemes DB fetch failed, using fallback:', err);
  }

  // Fallback ke tema resmi jika database belum tersedia
  return OFFICIAL_POLL_THEMES;
}

/**
 * Ambil detail satu tema polling berdasarkan kode atau ID
 */
export async function getPollThemeByCodeOrId(codeOrId: string): Promise<PollTheme> {
  const clean = (codeOrId || '').trim();
  const cleanCode = clean.replace(/^poll-/, '');
  const themes = await getActivePollThemes();

  const found = themes.find(
    (t) => t.code === cleanCode || t.id === clean || t.code === clean || t.id === `poll-${cleanCode}`
  );

  return found || themes[0] || OFFICIAL_POLL_THEMES[0];
}

export function recordMemoryVote(pollId: string, userId: string, employeeIds: string[]) {
  // Normalize pollId
  const cleanPollId = pollId.replace(/^poll-/, '');

  // Check if already voted
  const alreadyVoted = memoryParticipations.some(
    (p) => (p.poll_id === pollId || p.poll_id === cleanPollId) && p.user_id === userId
  );

  if (alreadyVoted) {
    return { success: false, error: 'ALREADY_VOTED' };
  }

  // Record participation
  memoryParticipations.push({
    poll_id: pollId,
    user_id: userId,
    choices_count: employeeIds.length,
    created_at: new Date().toISOString(),
  });

  // Record each vote
  for (const empId of employeeIds) {
    memoryVotes.push({
      poll_id: pollId,
      user_id: userId,
      employee_id: empId,
      created_at: new Date().toISOString(),
    });
  }

  return { success: true };
}

function createPollMatcher(pollIdOrVariants: string | string[]) {
  const ids = Array.isArray(pollIdOrVariants) ? pollIdOrVariants : [pollIdOrVariants];
  const set = new Set<string>();
  for (const id of ids) {
    if (!id) continue;
    set.add(id);
    const clean = id.replace(/^poll-/, '');
    set.add(clean);
    set.add(`poll-${clean}`);
  }
  return (pid: string) => set.has(pid) || set.has(pid.replace(/^poll-/, ''));
}

export function getMemoryResults(pollIdOrVariants: string | string[]) {
  const isMatch = createPollMatcher(pollIdOrVariants);
  const matchedVotes = memoryVotes.filter((v) => isMatch(v.poll_id));

  const tally: Record<string, number> = {};
  for (const v of matchedVotes) {
    tally[v.employee_id] = (tally[v.employee_id] || 0) + 1;
  }

  return {
    tally,
    totalVotes: matchedVotes.length,
  };
}

export function clearMemoryPoll(pollIdOrVariants: string | string[]) {
  const isTarget = createPollMatcher(pollIdOrVariants);

  // Filter out votes
  for (let i = memoryVotes.length - 1; i >= 0; i--) {
    if (isTarget(memoryVotes[i].poll_id)) {
      memoryVotes.splice(i, 1);
    }
  }

  // Filter out participations
  for (let i = memoryParticipations.length - 1; i >= 0; i--) {
    if (isTarget(memoryParticipations[i].poll_id)) {
      memoryParticipations.splice(i, 1);
    }
  }
}

export function deleteUserMemoryVotes(pollIdOrVariants: string | string[], userId: string) {
  const isTarget = createPollMatcher(pollIdOrVariants);
  const userLower = (userId || '').toLowerCase();

  for (let i = memoryVotes.length - 1; i >= 0; i--) {
    if (isTarget(memoryVotes[i].poll_id) && (memoryVotes[i].user_id === userId || memoryVotes[i].user_id.toLowerCase() === userLower)) {
      memoryVotes.splice(i, 1);
    }
  }

  for (let i = memoryParticipations.length - 1; i >= 0; i--) {
    if (isTarget(memoryParticipations[i].poll_id) && (memoryParticipations[i].user_id === userId || memoryParticipations[i].user_id.toLowerCase() === userLower)) {
      memoryParticipations.splice(i, 1);
    }
  }
}

export function deleteCandidateMemoryVotes(pollIdOrVariants: string | string[], employeeIdOrName: string) {
  const isTarget = createPollMatcher(pollIdOrVariants);
  const targetEmpLower = (employeeIdOrName || '').toLowerCase();

  for (let i = memoryVotes.length - 1; i >= 0; i--) {
    const v = memoryVotes[i];
    if (isTarget(v.poll_id)) {
      if (
        v.employee_id === employeeIdOrName ||
        v.employee_id.toLowerCase() === targetEmpLower ||
        targetEmpLower.includes(v.employee_id.toLowerCase()) ||
        v.employee_id.toLowerCase().includes(targetEmpLower)
      ) {
        memoryVotes.splice(i, 1);
      }
    }
  }
}


