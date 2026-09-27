import { supabaseAdmin, ADMIN_EMAIL, ADMIN_NIP, resolveUserAuth } from '@/lib/supabaseServer';
import { OfficerRole } from '@/types/cooperative';

export async function checkCoopOfficerAuth(userEmail?: string, userId?: string, userNip?: string) {
  const authProfile = await resolveUserAuth(userEmail, userId, userNip);
  if (authProfile.role === 'GUEST') {
    return { authorized: false, error: 'Login diperlukan', status: 401, profile: authProfile };
  }

  const nip = authProfile.nip || userNip;
  const isSuper = (authProfile.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) || (nip === ADMIN_NIP);

  if (isSuper) {
    return {
      authorized: true,
      role: 'bendahara' as OfficerRole,
      isSuper: true,
      profile: authProfile,
      nip: nip || ADMIN_NIP,
    };
  }

  if (!nip) {
    return { authorized: false, error: 'NIP diperlukan', status: 403, profile: authProfile };
  }

  const { data: officer } = await supabaseAdmin
    .from('cooperative_officers')
    .select('*')
    .eq('nip', nip)
    .eq('is_active', true)
    .maybeSingle();

  if (!officer) {
    return { authorized: false, error: 'Akses terbatas untuk pengurus koperasi', status: 403, profile: authProfile };
  }

  return {
    authorized: true,
    role: officer.role as OfficerRole,
    officer,
    isSuper: false,
    profile: authProfile,
    nip,
  };
}

export async function checkCoopBendaharaAuth(userEmail?: string, userId?: string, userNip?: string) {
  const check = await checkCoopOfficerAuth(userEmail, userId, userNip);
  if (!check.authorized) return check;

  if (check.isSuper || check.role === 'bendahara' || check.role === 'admin') {
    return check;
  }

  return {
    authorized: false,
    error: 'Akses khusus Bendahara atau Admin Koperasi',
    status: 403,
    profile: check.profile,
  };
}

export async function createCoopAuditLog(params: {
  userId?: string;
  userName?: string;
  userRole?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  description: string;
  dataBefore?: any;
  dataAfter?: any;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    await supabaseAdmin.from('cooperative_audit_logs').insert({
      user_id: params.userId || null,
      user_name: params.userName || 'System',
      user_role: params.userRole || 'officer',
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId || null,
      description: params.description,
      data_before: params.dataBefore || null,
      data_after: params.dataAfter || null,
      ip_address: params.ipAddress || null,
      user_agent: params.userAgent || null,
    });
  } catch (err) {
    console.error('Error logging coop audit:', err);
  }
}

export async function createCoopNotification(params: {
  recipientId?: string;
  recipientNip?: string;
  recipientRole?: string;
  type: string;
  title: string;
  body: string;
  referenceType?: string;
  referenceId?: string;
}) {
  try {
    await supabaseAdmin.from('cooperative_notifications').insert({
      recipient_id: params.recipientId || null,
      recipient_nip: params.recipientNip || null,
      recipient_role: params.recipientRole || null,
      type: params.type,
      title: params.title,
      body: params.body,
      reference_type: params.referenceType || null,
      reference_id: params.referenceId || null,
      is_read: false,
    });
  } catch (err) {
    console.error('Error sending coop notification:', err);
  }
}
