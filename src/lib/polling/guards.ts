import { User } from '@supabase/supabase-js';

// In-memory rate limiting: maksimal 10 submit per user per menit
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(userId: string, maxRequests = 10, windowMs = 60000): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(userId);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + windowMs });
    return { allowed: true };
  }

  if (record.count >= maxRequests) {
    const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, retryAfterSec };
  }

  record.count += 1;
  return { allowed: true };
}

// Daftar kata terlarang (Governance): fisik negatif, SARA, kondisi ekonomi sensitif, atau mempermalukan
export const BLOCKED_KEYWORDS = [
  'miskin', 'kaya', 'berada', 'uang', 'gaji', 'utang', 'hutang',
  'jelek', 'buruk', 'cacat', 'hitam', 'putih', 'gemuk', 'gendut', 'kurus',
  'sara', 'agama', 'suku', 'ras', 'pribumi', 'cina', 'kristen', 'islam', 'hindu', 'buddha',
  'bodoh', 'tolol', 'dungu', 'malas', 'pecat', 'korup', 'korupsi', 'selingkuh', 'jahat', 'licik'
];

export function validateThemeGovernance(title: string, description?: string): { valid: boolean; blockedWord?: string } {
  const text = `${title} ${description || ''}`.toLowerCase();
  for (const word of BLOCKED_KEYWORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(text)) {
      return { valid: false, blockedWord: word };
    }
  }
  return { valid: true };
}

export function isAuthorizedAdmin(email?: string | null): boolean {
  if (!email) return false;
  const adminEmails = [
    'ridwansugiarto.mail@gmail.com',
    'admin@dkpp.cilegon.go.id',
    'dkpp.cilegon@gmail.com'
  ];
  return adminEmails.includes(email.trim().toLowerCase());
}
