import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

const AUTHORIZED_ADMIN_EMAIL = 'ridwansugiarto.mail@gmail.com';
const BUCKET_NAME = 'foto_pegawai';

function checkAdminAuth(userEmail?: string | null): boolean {
  if (!userEmail) return false;
  return userEmail.trim().toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase();
}

/**
 * GET: Ambil daftar foto pegawai di storage atau cek foto berdasarkan NIP
 * Query params:
 * - userEmail: string (admin verification)
 * - nip: string (optional, check single NIP)
 * - list: 'true' (list all photos in bucket)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userEmail = searchParams.get('userEmail');
  const nip = searchParams.get('nip');
  const isList = searchParams.get('list') === 'true';

  try {
    // 1. Cek foto untuk satu NIP spesifik (dapat diakses oleh admin & sistem internal)
    if (nip) {
      const cleanNip = nip.trim().replace(/\s+/g, '');
      const extensions = ['jpg', 'jpeg', 'png', 'webp', 'JPG', 'JPEG', 'PNG', 'WEBP'];
      
      const { data: files, error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .list('', { search: cleanNip });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const matchedFile = files?.find((f) => {
        const base = f.name.replace(/\.[^/.]+$/, '');
        return base === cleanNip;
      });

      if (matchedFile) {
        const { data } = supabaseAdmin.storage
          .from(BUCKET_NAME)
          .getPublicUrl(matchedFile.name);

        return NextResponse.json({
          found: true,
          nip: cleanNip,
          filename: matchedFile.name,
          publicUrl: data.publicUrl,
        });
      }

      return NextResponse.json({
        found: false,
        nip: cleanNip,
        message: `Foto pegawai dengan NIP ${cleanNip} belum diunggah di container ${BUCKET_NAME}.`,
      });
    }

    // 2. Ambil daftar seluruh foto di storage (khusus Superadmin)
    if (isList) {
      if (!checkAdminAuth(userEmail)) {
        return NextResponse.json(
          { error: 'Akses ditolak. Hanya Administrator Resmi yang berwenang melihat daftar berkas foto.' },
          { status: 403 }
        );
      }

      const { data: files, error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .list('', { limit: 1000, sortBy: { column: 'name', order: 'asc' } });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const photoMap: Record<string, { filename: string; publicUrl: string; size: number; updatedAt?: string | null }> = {};

      files?.forEach((file) => {
        // Abaikan placeholder atau folder
        if (!file.name || file.name.startsWith('.')) return;
        const baseNip = file.name.replace(/\.[^/.]+$/, '').trim();
        const { data } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(file.name);

        photoMap[baseNip] = {
          filename: file.name,
          publicUrl: data.publicUrl,
          size: file.metadata?.size || 0,
          updatedAt: file.updated_at,
        };
      });

      return NextResponse.json({
        success: true,
        count: Object.keys(photoMap).length,
        photos: photoMap,
      });
    }

    return NextResponse.json({ error: 'Parameter nip atau list=true diperlukan.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan server.' }, { status: 500 });
  }
}

/**
 * POST: Upload foto pegawai ke container storage `foto_pegawai`
 * Nama file otomatis disesuaikan dengan NIP pegawai (contoh: 198501012010011001.jpg)
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const userEmail = (formData.get('userEmail') as string) || '';
    const explicitNip = (formData.get('nip') as string) || '';

    if (!checkAdminAuth(userEmail)) {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya Administrator Resmi (ridwansugiarto.mail@gmail.com) yang berwenang mengunggah foto pegawai.' },
        { status: 403 }
      );
    }

    // Ambil semua file yang dikirim
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada berkas foto yang dikirim. Unggah minimal satu file gambar (.jpg / .png).' },
        { status: 400 }
      );
    }

    const uploadedResults: Array<{
      nip: string;
      originalName: string;
      storageFilename: string;
      publicUrl: string;
    }> = [];

    const errors: Array<{ filename: string; reason: string }> = [];

    for (const file of files) {
      // 1. Tentukan NIP dari explicitNip (jika single file upload) atau dari nama file
      let nipTarget = explicitNip.trim().replace(/\s+/g, '');

      if (!nipTarget) {
        // Ambil nama file tanpa ekstensi
        const baseName = file.name.replace(/\.[^/.]+$/, '').trim();
        // Bersihkan spasi atau karakter non-numerik jika ada
        const numericMatch = baseName.replace(/[^0-9]/g, '');
        if (numericMatch.length >= 9) {
          nipTarget = numericMatch;
        } else {
          nipTarget = baseName;
        }
      }

      if (!nipTarget || nipTarget.length < 8) {
        errors.push({
          filename: file.name,
          reason: `Nama file (${file.name}) tidak mengandung NIP pegawai yang valid (minimal 8-18 digit angka).`,
        });
        continue;
      }

      // 2. Ekstensi file
      const rawExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const ext = ['jpg', 'jpeg', 'png', 'webp'].includes(rawExt) ? rawExt : 'jpg';
      const storageFilename = `${nipTarget}.${ext}`;

      // 3. Konversi file ke buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 4. Upload ke Supabase Storage `foto_pegawai` dengan upsert: true
      const { error: uploadError } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(storageFilename, buffer, {
          contentType: file.type || `image/${ext === 'jpg' ? 'jpeg' : ext}`,
          upsert: true,
        });

      if (uploadError) {
        errors.push({
          filename: file.name,
          reason: `Gagal menyimpan ke storage: ${uploadError.message}`,
        });
        continue;
      }

      // 5. Dapatkan Public URL
      const { data: urlData } = supabaseAdmin.storage
        .from(BUCKET_NAME)
        .getPublicUrl(storageFilename);

      uploadedResults.push({
        nip: nipTarget,
        originalName: file.name,
        storageFilename,
        publicUrl: urlData.publicUrl,
      });
    }

    return NextResponse.json({
      success: uploadedResults.length > 0,
      uploadedCount: uploadedResults.length,
      uploaded: uploadedResults,
      errors: errors.length > 0 ? errors : undefined,
      message: `Berhasil mengunggah ${uploadedResults.length} foto pegawai ke container storage \`${BUCKET_NAME}\`.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan saat upload foto.' }, { status: 500 });
  }
}

/**
 * DELETE: Hapus foto pegawai dari storage `foto_pegawai`
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');
    const nip = searchParams.get('nip');
    const filename = searchParams.get('filename');

    if (!checkAdminAuth(userEmail)) {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya Administrator Resmi yang berwenang menghapus foto.' },
        { status: 403 }
      );
    }

    let targetFilename = filename;
    if (!targetFilename && nip) {
      const cleanNip = nip.trim().replace(/\s+/g, '');
      const { data: files } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .list('', { search: cleanNip });
      const matched = files?.find((f) => f.name.replace(/\.[^/.]+$/, '') === cleanNip);
      if (matched) targetFilename = matched.name;
    }

    if (!targetFilename) {
      return NextResponse.json({ error: 'Berkas foto tidak ditemukan untuk dihapus.' }, { status: 404 });
    }

    const { error } = await supabaseAdmin.storage.from(BUCKET_NAME).remove([targetFilename]);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Foto ${targetFilename} berhasil dihapus dari container storage ${BUCKET_NAME}.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan saat menghapus foto.' }, { status: 500 });
  }
}
