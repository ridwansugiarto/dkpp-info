import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserRole, UserProfile } from '@/types/dkpp';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fnhrdwfmwhglbrnzlxxv.supabase.co';
const rawSecret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseSecretKey = (rawSecret && rawSecret.trim().length > 0)
  ? rawSecret.trim()
  : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

// Server-side privileged client
export const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'ridwansugiarto.mail@gmail.com';
export const ADMIN_NIP = process.env.ADMIN_NIP || '197610182002121002';

/**
 * Server-side User Authorization resolver
 */
export async function resolveUserAuth(userEmail?: string, userId?: string, userNip?: string): Promise<UserProfile> {
  // 1. Check if Super Admin
  if (userEmail && userEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return {
      id: userId || 'admin-user',
      email: userEmail,
      full_name: 'Ridwan Sugiarto, S.Pi (Super Admin)',
      role: 'ADMIN',
      is_verified_employee: true,
      can_access_sensitive: true,
      nip: ADMIN_NIP,
      department: 'DKPP Kota Cilegon',
      position: 'Kepala Dinas DKPP (Super Admin)',
    };
  }

  // 2. Lookup in dkpp_pegawai_nip by NIP if provided
  if (userNip) {
    const cleanNip = userNip.trim().replace(/\s+/g, '');
    try {
      const { data: nipRecord } = await supabaseAdmin
        .from('dkpp_pegawai_nip')
        .select('*')
        .eq('nip', cleanNip)
        .eq('is_active', true)
        .maybeSingle();

      if (nipRecord) {
        return {
          id: userId || `emp-${nipRecord.nip}`,
          email: userEmail || `${nipRecord.nip}@dkpp.cilegon.go.id`,
          full_name: nipRecord.nama,
          role: 'EMPLOYEE',
          is_verified_employee: true,
          can_access_sensitive: true,
          nip: nipRecord.nip,
          department: nipRecord.bidang || 'DKPP Kota Cilegon',
          position: nipRecord.jabatan,
        };
      }
    } catch (nipErr) {
      console.warn('Error resolving user from dkpp_pegawai_nip:', nipErr);
    }
  }

  // 3. Lookup in employees table by email if provided
  if (userEmail) {
    try {
      const { data: employee } = await supabaseAdmin
        .from('employees')
        .select('*')
        .eq('email', userEmail)
        .eq('is_active', true)
        .maybeSingle();

      if (employee) {
        const isSensitive = employee.access_level === 'SENSITIVE' || employee.access_level === 'ADMIN';
        return {
          id: userId || employee.id,
          email: employee.email,
          full_name: employee.full_name,
          role: employee.access_level === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE',
          is_verified_employee: true,
          can_access_sensitive: isSensitive,
          nip: employee.nip,
          department: employee.department,
          position: employee.position,
        };
      }
    } catch (err) {
      console.error('Error resolving employee from DB:', err);
    }
  }

  // 4. User yang sudah masuk Google/Gmail tapi belum verifikasi NIP adalah User Umum (CITIZEN), bukan GUEST
  if (userEmail && userEmail !== 'guest@dkpp-cilegon.id' && userId !== 'guest') {
    return {
      id: userId || 'citizen-user',
      email: userEmail,
      full_name: userEmail.split('@')[0],
      role: 'CITIZEN',
      is_verified_employee: false,
      can_access_sensitive: false,
    };
  }

  // 5. Tamu murni: Belum masuk akun Google/Gmail sama sekali
  return {
    id: userId || 'guest',
    email: 'guest@dkpp-cilegon.id',
    full_name: 'Tamu DKPP',
    role: 'GUEST',
    is_verified_employee: false,
    can_access_sensitive: false,
  };
}

/**
 * Log action to audit_logs
 */
export async function logAudit(params: {
  userId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  accessResult?: 'SUCCESS' | 'DENIED' | 'ERROR';
  ipHash?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await supabaseAdmin.from('audit_logs').insert({
      user_id: params.userId || 'anonymous',
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId,
      access_result: params.accessResult || 'SUCCESS',
      ip_hash: params.ipHash,
      user_agent: params.userAgent,
      metadata: params.metadata || {},
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

/**
 * Enforce max 10 active chat sessions per user
 */
export async function pruneOldSessions(userId: string) {
  try {
    const { data: sessions } = await supabaseAdmin
      .from('chat_sessions')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false });

    if (sessions && sessions.length > 10) {
      const sessionsToPrune = sessions.slice(10);
      const idsToPrune = sessionsToPrune.map((s) => s.id);
      
      // Mark as archived or delete
      await supabaseAdmin
        .from('chat_sessions')
        .update({ is_archived: true })
        .in('id', idsToPrune);
    }
  } catch (err) {
    console.error('Error pruning sessions:', err);
  }
}
