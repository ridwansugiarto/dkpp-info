import { NextResponse } from 'next/server';
import { detectPollingIntent } from '@/lib/polling/intent';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const message = (body.message || '').trim();

    if (!message) {
      return NextResponse.json({ intent: 'GENERAL_CHAT', confidence: 0 });
    }

    const intent = detectPollingIntent(message);

    if (intent.intent === 'EMPLOYEE_POLL' && intent.category && intent.category !== 'all') {
      // Ambil poll aktif dari Supabase
      const { data: poll } = await supabase
        .from('polls')
        .select('*')
        .eq('code', intent.category)
        .eq('is_active', true)
        .maybeSingle();

      return NextResponse.json({
        ...intent,
        poll: poll || null
      });
    }

    return NextResponse.json(intent);
  } catch (err: any) {
    console.error('Intent error:', err);
    return NextResponse.json({ intent: 'GENERAL_CHAT', confidence: 0 });
  }
}
