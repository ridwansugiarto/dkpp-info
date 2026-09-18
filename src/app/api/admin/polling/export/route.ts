import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
import { isAuthorizedAdmin } from '@/lib/polling/guards';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); }
        }
      }
    );

    const { data: { user } } = await authClient.auth.getUser();
    if (!user || !isAuthorizedAdmin(user.email)) {
      return NextResponse.json(
        { error: 'FORBIDDEN: Hanya Admin yang dapat mengekspor data polling.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const pollId = searchParams.get('pollId');

    if (!pollId) {
      return NextResponse.json({ error: 'pollId diperlukan.' }, { status: 400 });
    }

    // 1. Ambil data tema dan hasil
    const { data: poll } = await supabase.from('polls').select('*').eq('id', pollId).single();
    const { data: results } = await supabase
      .from('poll_results_public')
      .select('*')
      .eq('poll_id', pollId)
      .order('total_votes', { ascending: false });

    // 2. Catat audit log
    await supabase.from('audit_logs').insert([{
      actor_user_id: user.id,
      action: 'EXPORT_DATA',
      poll_id: pollId,
      payload: {
        admin_email: user.email,
        poll_code: poll?.code,
        format: 'CSV'
      }
    }]);

    // 3. Format ke CSV
    let csv = 'No,Peringkat,Nama Pegawai,Jabatan,Bidang/Unit,Jumlah Suara,Persentase\n';
    (results || []).forEach((r: any, idx: number) => {
      csv += `${idx + 1},${r.rank},"${(r.full_name || '').replace(/"/g, '""')}","${(r.position || '').replace(/"/g, '""')}","${(r.unit || '').replace(/"/g, '""')}",${r.total_votes},${r.percentage}%\n`;
    });

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="Hasil_Polling_${poll?.code || 'dkpp'}_${new Date().toISOString().slice(0, 10)}.csv"`
      }
    });
  } catch (err: any) {
    console.error('Export error:', err);
    return NextResponse.json({ error: 'Gagal mengekspor data polling.' }, { status: 500 });
  }
}
