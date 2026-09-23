import { NextResponse } from 'next/server';
import { getActivePollThemes } from '@/lib/polling/store';

export async function GET() {
  try {
    const themes = await getActivePollThemes();
    return NextResponse.json({
      success: true,
      themes,
    });
  } catch (err: any) {
    console.error('Fetch polling themes error:', err);
    const { OFFICIAL_POLL_THEMES } = await import('@/lib/polling/constants');
    return NextResponse.json({
      success: true,
      themes: OFFICIAL_POLL_THEMES,
    });
  }
}

