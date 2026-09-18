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
};

if (!globalForPolling._memoryVotes) {
  globalForPolling._memoryVotes = [];
}
if (!globalForPolling._memoryParticipations) {
  globalForPolling._memoryParticipations = [];
}

export const memoryVotes = globalForPolling._memoryVotes;
export const memoryParticipations = globalForPolling._memoryParticipations;

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


