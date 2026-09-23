import { OFFICIAL_DKPP_PEGAWAI, PegawaiInternalItem } from '@/data/pegawai_dkpp';
import { supabaseAdmin } from '@/lib/supabaseServer';

export interface ResolvedEmployeeProfile {
  id: string;
  nip: string;
  nama: string;
  jabatan: string;
  bidang: string;
  photo_url: string | null;
  is_active: boolean;
}

// Map cache untuk UUID database Supabase yang sudah pernah di-resolve
const dbUuidCache = new Map<string, ResolvedEmployeeProfile>();

// Inisialisasi entri khusus yang sudah diketahui
dbUuidCache.set('ef296822-1d48-4044-92d3-f4b684f723ba', {
  id: 'pns-2026-014',
  nip: '197610182002121002',
  nama: 'Ridwan Sugiarto, S.Pi',
  jabatan: 'Analis Ketahanan Pangan Ahli Muda',
  bidang: 'Ketahanan Pangan',
  photo_url: null,
  is_active: true,
});

/**
 * Mencari profil pegawai secara sinkron dari master data OFFICIAL_DKPP_PEGAWAI dan cache
 */
export function findEmployeeSync(identifier: string): ResolvedEmployeeProfile | null {
  if (!identifier) return null;
  const clean = identifier.trim();
  const lower = clean.toLowerCase();

  // 1. Cek dari UUID cache
  if (dbUuidCache.has(clean)) {
    return dbUuidCache.get(clean)!;
  }

  // 2. Cek dari master data OFFICIAL_DKPP_PEGAWAI
  const found = OFFICIAL_DKPP_PEGAWAI.find((p) => {
    const pNipClean = p.nip ? p.nip.replace(/\s+/g, '') : '';
    const targetClean = clean.replace(/\s+/g, '');
    const isNipMatch = p.nip === clean || pNipClean === targetClean || p.nip_formatted === clean;
    const isIdMatch = p.id === clean;
    const isNameMatch = p.nama.toLowerCase() === lower || p.nama.toLowerCase().includes(lower);

    return isIdMatch || isNipMatch || isNameMatch;
  });

  if (found) {
    const isRidwan = found.nip === '197610182002121002' || found.nama.toLowerCase().includes('ridwan');
    return {
      id: found.id,
      nip: found.nip,
      nama: found.nama,
      jabatan: isRidwan ? 'Analis Ketahanan Pangan Ahli Muda' : (found.jabatan || 'Pegawai DKPP Kota Cilegon'),
      bidang: found.bidang || 'DKPP',
      photo_url: null,
      is_active: found.is_active,
    };
  }

  return null;
}

/**
 * Resolves a list of employee IDs (which may contain Supabase UUIDs, NIPs, custom IDs, or names)
 * by combining in-memory master data and querying the `employees` table from Supabase.
 */
export async function resolveEmployeeProfilesBatch(
  employeeIds: string[]
): Promise<Map<string, ResolvedEmployeeProfile>> {
  const result = new Map<string, ResolvedEmployeeProfile>();
  const unknownUuids: string[] = [];

  for (const empId of employeeIds) {
    if (!empId) continue;
    const syncProfile = findEmployeeSync(empId);
    if (syncProfile) {
      result.set(empId, syncProfile);
    } else {
      // Jika kemungkinan UUID
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(empId)) {
        unknownUuids.push(empId);
      } else {
        // Fallback default
        result.set(empId, {
          id: empId,
          nip: empId,
          nama: empId,
          jabatan: 'Pegawai DKPP Kota Cilegon',
          bidang: 'DKPP',
          photo_url: null,
          is_active: true,
        });
      }
    }
  }

  if (unknownUuids.length > 0) {
    try {
      const { data: dbEmps } = await supabaseAdmin
        .from('employees')
        .select('id, nip, full_name, position, unit, photo_url, is_active')
        .in('id', unknownUuids);

      if (dbEmps && dbEmps.length > 0) {
        for (const dbEmp of dbEmps) {
          // Cari apakah NIP atau namanya ada di master data
          const masterMatch = findEmployeeSync(dbEmp.nip || dbEmp.full_name);
          const isRidwan = dbEmp.nip === '197610182002121002' || (dbEmp.full_name && dbEmp.full_name.toLowerCase().includes('ridwan'));

          const profile: ResolvedEmployeeProfile = {
            id: masterMatch?.id || dbEmp.id,
            nip: masterMatch?.nip || dbEmp.nip || '',
            nama: masterMatch?.nama || dbEmp.full_name || 'Pegawai DKPP',
            jabatan: isRidwan
              ? 'Analis Ketahanan Pangan Ahli Muda'
              : (masterMatch?.jabatan || dbEmp.position || 'Pegawai DKPP Kota Cilegon'),
            bidang: masterMatch?.bidang || dbEmp.unit || 'DKPP',
            photo_url: dbEmp.photo_url || null,
            is_active: dbEmp.is_active ?? true,
          };

          dbUuidCache.set(dbEmp.id, profile);
          result.set(dbEmp.id, profile);
        }
      }
    } catch (err) {
      console.warn('Error resolving unknown UUIDs from DB:', err);
    }
  }

  // Pastikan semua key awal terisi
  for (const empId of employeeIds) {
    if (!result.has(empId)) {
      result.set(empId, {
        id: empId,
        nip: empId,
        nama: empId,
        jabatan: 'Pegawai DKPP Kota Cilegon',
        bidang: 'DKPP',
        photo_url: null,
        is_active: true,
      });
    }
  }

  return result;
}
