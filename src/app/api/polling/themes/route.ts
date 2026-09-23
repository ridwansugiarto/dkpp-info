import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { OFFICIAL_POLL_THEMES } from '@/lib/polling/constants';

export async function GET() {
  try {
    const { data: dbPolls, error } = await supabase
      .from('polls')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && dbPolls && dbPolls.length > 0) {
      return NextResponse.json({
        success: true,
        themes: dbPolls,
      });
    }

    // Fallback ke tema resmi jika belum ada di database
    return NextResponse.json({
      success: true,
      themes: OFFICIAL_POLL_THEMES,
    });
  } catch (err: any) {
    console.error('Fetch polling themes error:', err);
    return NextResponse.json({
      success: true,
      themes: OFFICIAL_POLL_THEMES,
    });
  }
}
