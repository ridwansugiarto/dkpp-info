import json
import re

with open('scratch/all_active_pegawai.json', 'r', encoding='utf-8') as f:
    active = json.load(f)

with open('scratch/all_inactive_pegawai.json', 'r', encoding='utf-8') as f:
    inactive = json.load(f)

# 1. GENERATE SQL
sql_lines = []
sql_lines.append('-- ====================================================================')
sql_lines.append('-- MIGRATION 019: UPDATE MASTER DATA PEGAWAI (PNS & PPPK 2026) DKPP CILEGON')
sql_lines.append('-- PEMBARUAN NAMA, NIP, TEMPAT/TANGGAL LAHIR, PANGKAT/GOLONGAN, JABATAN,')
sql_lines.append('-- PENDIDIKAN, SERTA PENETAPAN STATUS PEGAWAI SUDAH PINDAH/RESIGN')
sql_lines.append('-- ====================================================================')
sql_lines.append('')
sql_lines.append('-- 1. Penambahan Kolom Baru ke Tabel public.dkpp_pegawai_nip')
sql_lines.append('ALTER TABLE public.dkpp_pegawai_nip')
sql_lines.append('ADD COLUMN IF NOT EXISTS tempat_lahir VARCHAR(100),')
sql_lines.append('ADD COLUMN IF NOT EXISTS tanggal_lahir DATE,')
sql_lines.append('ADD COLUMN IF NOT EXISTS tanggal_lahir_str VARCHAR(100),')
sql_lines.append('ADD COLUMN IF NOT EXISTS pangkat VARCHAR(100),')
sql_lines.append('ADD COLUMN IF NOT EXISTS tmt_golongan VARCHAR(50),')
sql_lines.append('ADD COLUMN IF NOT EXISTS tmt_jabatan VARCHAR(50),')
sql_lines.append('ADD COLUMN IF NOT EXISTS esselon VARCHAR(50),')
sql_lines.append('ADD COLUMN IF NOT EXISTS pendidikan VARCHAR(100),')
sql_lines.append('ADD COLUMN IF NOT EXISTS diklat VARCHAR(150),')
sql_lines.append('ADD COLUMN IF NOT EXISTS kategori_pegawai VARCHAR(50),')
sql_lines.append('ADD COLUMN IF NOT EXISTS keterangan TEXT;')
sql_lines.append('')
sql_lines.append('-- 2. Buat Index Tambahan untuk Kolom Baru')
sql_lines.append('CREATE INDEX IF NOT EXISTS idx_dkpp_pegawai_nip_kategori ON public.dkpp_pegawai_nip (kategori_pegawai);')
sql_lines.append('CREATE INDEX IF NOT EXISTS idx_dkpp_pegawai_nip_tgl_lahir ON public.dkpp_pegawai_nip (tanggal_lahir);')
sql_lines.append('')
sql_lines.append('-- 3. Tandai seluruh data pegawai sebelumnya yang TIDAK ADA dalam update 2026 sebagai SUDAH PINDAH / RESIGN')
sql_lines.append('UPDATE public.dkpp_pegawai_nip')
sql_lines.append('SET is_active = false,')
sql_lines.append("    keterangan = 'sudah pindah atau sudah resign',")
sql_lines.append('    updated_at = now()')
sql_lines.append('WHERE nip NOT IN (')

active_nips = [p['nip'] for p in active if p['nip']]
nips_str = ',\n    '.join([f"'{n}'" for n in active_nips])
sql_lines.append(f'    {nips_str}')
sql_lines.append(');')
sql_lines.append('')

sql_lines.append('-- 4. UPSERT 82 DATA PEGAWAI AKTIF 2026 (44 PNS & 38 PPPK)')
sql_lines.append('INSERT INTO public.dkpp_pegawai_nip (')
sql_lines.append('    nip, nama, tempat_lahir, tanggal_lahir, tanggal_lahir_str,')
sql_lines.append('    pangkat, golongan, tmt_golongan, jabatan, tmt_jabatan,')
sql_lines.append('    esselon, pendidikan, diklat, status_pegawai, kategori_pegawai,')
sql_lines.append('    bidang, npwp, kelas_jabatan, is_sensitive, is_active, keterangan, updated_at')
sql_lines.append(')')
sql_lines.append('VALUES')

def sql_val(v):
    if v is None:
        return 'NULL'
    if isinstance(v, bool):
        return 'true' if v else 'false'
    s = str(v).replace("'", "''")
    return f"'{s}'"

val_rows = []
for p in active:
    tgl_val = f"'{p['tanggal_lahir']}'::DATE" if p['tanggal_lahir'] else 'NULL'
    row_str = f"({sql_val(p['nip'])}, {sql_val(p['nama'])}, {sql_val(p['tempat_lahir'])}, {tgl_val}, {sql_val(p['tanggal_lahir_str'])}, {sql_val(p['pangkat'])}, {sql_val(p['golongan'])}, {sql_val(p['tmt_golongan'])}, {sql_val(p['jabatan'])}, {sql_val(p['tmt_jabatan'])}, {sql_val(p['esselon'])}, {sql_val(p['pendidikan'])}, {sql_val(p['diklat'])}, {sql_val(p['status_pegawai'])}, {sql_val(p['kategori_pegawai'])}, {sql_val(p['bidang'])}, {sql_val(p['npwp'])}, {sql_val(p['kelas_jabatan'])}, true, true, {sql_val(p['keterangan'])}, now())"
    val_rows.append(row_str)

sql_lines.append(',\n'.join(val_rows))
sql_lines.append('ON CONFLICT (nip) DO UPDATE SET')
sql_lines.append('    nama = EXCLUDED.nama,')
sql_lines.append('    tempat_lahir = EXCLUDED.tempat_lahir,')
sql_lines.append('    tanggal_lahir = EXCLUDED.tanggal_lahir,')
sql_lines.append('    tanggal_lahir_str = EXCLUDED.tanggal_lahir_str,')
sql_lines.append('    pangkat = EXCLUDED.pangkat,')
sql_lines.append('    golongan = EXCLUDED.golongan,')
sql_lines.append('    tmt_golongan = EXCLUDED.tmt_golongan,')
sql_lines.append('    jabatan = EXCLUDED.jabatan,')
sql_lines.append('    tmt_jabatan = EXCLUDED.tmt_jabatan,')
sql_lines.append('    esselon = EXCLUDED.esselon,')
sql_lines.append('    pendidikan = EXCLUDED.pendidikan,')
sql_lines.append('    diklat = EXCLUDED.diklat,')
sql_lines.append('    status_pegawai = EXCLUDED.status_pegawai,')
sql_lines.append('    kategori_pegawai = EXCLUDED.kategori_pegawai,')
sql_lines.append('    bidang = EXCLUDED.bidang,')
sql_lines.append('    npwp = COALESCE(EXCLUDED.npwp, public.dkpp_pegawai_nip.npwp),')
sql_lines.append('    kelas_jabatan = COALESCE(EXCLUDED.kelas_jabatan, public.dkpp_pegawai_nip.kelas_jabatan),')
sql_lines.append('    is_sensitive = EXCLUDED.is_sensitive,')
sql_lines.append('    is_active = EXCLUDED.is_active,')
sql_lines.append('    keterangan = EXCLUDED.keterangan,')
sql_lines.append('    updated_at = now();')
sql_lines.append('')
sql_lines.append('-- 5. Perbarui Fungsi RPC Verifikasi NIP')
sql_lines.append('CREATE OR REPLACE FUNCTION public.verify_dkpp_nip(input_nip TEXT)')
sql_lines.append('RETURNS TABLE (')
sql_lines.append('    valid BOOLEAN,')
sql_lines.append('    nama VARCHAR,')
sql_lines.append('    jabatan VARCHAR,')
sql_lines.append('    bidang VARCHAR,')
sql_lines.append('    status_pegawai VARCHAR,')
sql_lines.append('    keterangan TEXT')
sql_lines.append(') LANGUAGE plpgsql SECURITY DEFINER AS $$')
sql_lines.append('BEGIN')
sql_lines.append('    RETURN QUERY')
sql_lines.append('    SELECT true, p.nama, p.jabatan, p.bidang, p.status_pegawai, p.keterangan')
sql_lines.append('    FROM public.dkpp_pegawai_nip p')
sql_lines.append("    WHERE REPLACE(p.nip, ' ', '') = REPLACE(TRIM(input_nip), ' ', '') AND p.is_active = true")
sql_lines.append('    LIMIT 1;')
sql_lines.append('END;')
sql_lines.append('$$;')

full_sql = '\n'.join(sql_lines)

with open('supabase/migrations/019_update_pegawai_nip_2026.sql', 'w', encoding='utf-8') as f:
    f.write(full_sql)

with open('supabase_sql/05_update_pegawai_nip_2026.sql', 'w', encoding='utf-8') as f:
    f.write(full_sql)

print('Successfully generated migration 019 and supabase_sql 05!')
