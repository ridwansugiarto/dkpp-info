import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, resolveUserAuth } from '@/lib/supabaseServer';
import { checkCoopOfficerAuth, checkCoopBendaharaAuth, createCoopAuditLog } from '@/lib/koperasi/serverHelpers';

// GET /api/koperasi/transactions
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get('userEmail') || '';
    const userId = searchParams.get('userId') || '';
    const userNip = searchParams.get('userNip') || '';
    const jenis = searchParams.get('jenis') || '';
    const kategori = searchParams.get('kategori') || '';
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const officerCheck = await checkCoopOfficerAuth(userEmail, userId, userNip);
    if (!officerCheck.authorized) {
      return NextResponse.json({ error: officerCheck.error }, { status: officerCheck.status });
    }

    let query = supabaseAdmin
      .from('cooperative_transactions')
      .select('*')
      .order('tanggal', { ascending: false })
      .limit(limit);

    if (jenis) query = query.eq('jenis', jenis);
    if (kategori) query = query.eq('kategori', kategori);

    const { data: transactions, error } = await query;
    if (error) throw error;

    // Aggregations
    let totalPemasukan = 0;
    let totalPengeluaran = 0;

    (transactions || []).forEach((t) => {
      const nom = Number(t.nominal) || 0;
      if (t.jenis === 'pemasukan') totalPemasukan += nom;
      if (t.jenis === 'pengeluaran') totalPengeluaran += nom;
    });

    return NextResponse.json({
      transactions: transactions || [],
      summary: {
        total_pemasukan: totalPemasukan,
        total_pengeluaran: totalPengeluaran,
        saldo_kas: totalPemasukan - totalPengeluaran,
      },
    });
  } catch (err: any) {
    console.error('Transactions GET error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST /api/koperasi/transactions
// Record manual transaction (Bendahara / Admin)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userEmail,
      userId,
      userNip,
      tanggal,
      jenis,
      kategori,
      nominal,
      sumber,
      keterangan,
      periode_bulan,
      periode_tahun,
    } = body;

    if (!jenis || !kategori || !nominal) {
      return NextResponse.json({ error: 'Jenis, kategori, dan nominal wajib diisi' }, { status: 400 });
    }

    const bendaharaCheck = await checkCoopBendaharaAuth(userEmail, userId, userNip);
    if (!bendaharaCheck.authorized) {
      return NextResponse.json({ error: bendaharaCheck.error }, { status: bendaharaCheck.status });
    }

    const effectiveDate = tanggal || new Date().toISOString().split('T')[0];
    const d = new Date(effectiveDate);

    const { data: tx, error } = await supabaseAdmin
      .from('cooperative_transactions')
      .insert({
        tanggal: effectiveDate,
        jenis,
        kategori,
        nominal: Number(nominal),
        sumber: sumber || 'Kas Koperasi',
        keterangan: keterangan || '',
        periode_bulan: periode_bulan || d.getMonth() + 1,
        periode_tahun: periode_tahun || d.getFullYear(),
        created_by: bendaharaCheck.profile?.id || null,
      })
      .select()
      .single();

    if (error) throw error;

    await createCoopAuditLog({
      userId: bendaharaCheck.profile?.id,
      userName: bendaharaCheck.profile?.full_name,
      userRole: bendaharaCheck.role,
      action: 'RECORD_TRANSACTION',
      resourceType: 'cooperative_transactions',
      resourceId: tx.id,
      description: `Pencatatan transaksi manual ${jenis.toUpperCase()} ${kategori} Rp ${nominal}`,
      dataAfter: tx,
    });

    return NextResponse.json({ success: true, transaction: tx });
  } catch (err: any) {
    console.error('Transactions POST error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan server saat mencatat transaksi' }, { status: 500 });
  }
}
