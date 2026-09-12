import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveUserAuth, logAudit, supabaseAdmin } from '@/lib/supabaseServer';
import { generateChatResponse } from '@/lib/gemini';

const chatRequestSchema = z.object({
  sessionId: z.string().optional(),
  message: z.string().min(1, 'Pesan tidak boleh kosong'),
  userEmail: z.string().optional(),
  userId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = chatRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Format permintaan tidak valid', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { sessionId, message, userEmail, userId } = parseResult.data;

    // 1. Resolve User Authorization server-side
    const authProfile = await resolveUserAuth(userEmail, userId);

    // 2. Fetch User Memories (per-user isolation)
    let memoryContext = '';
    if (authProfile.id && authProfile.id !== 'guest') {
      try {
        const { data: memories } = await supabaseAdmin
          .from('user_memories')
          .select('memory_key, memory_value')
          .eq('user_id', authProfile.id);

        if (memories && memories.length > 0) {
          memoryContext = memories
            .map((m) => `${m.memory_key}: ${m.memory_value}`)
            .join('\n');
        }
      } catch (memErr) {
        console.warn('Could not load user memories:', memErr);
      }
    }

    // 3. Prepare Chat History if sessionId is provided
    let conversationHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];
    if (sessionId) {
      try {
        const { data: history } = await supabaseAdmin
          .from('chat_messages')
          .select('role, content')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true })
          .limit(10);

        if (history && history.length > 0) {
          conversationHistory = history.map((h) => ({
            role: h.role as 'user' | 'assistant',
            content: h.content,
          }));
        }
      } catch (histErr) {
        console.warn('Could not load history:', histErr);
      }
    }

    conversationHistory.push({ role: 'user', content: message });

    // 4. Generate AI Response via Gemini with Tool Execution
    const aiResult = await generateChatResponse({
      messages: conversationHistory,
      userRole: authProfile.role,
      isVerified: authProfile.is_verified_employee,
      userMemoryContext: memoryContext,
    });

    // 5. Persist to DB if sessionId exists
    let userMsgId = 'msg-user-' + Date.now();
    let assistantMsgId = 'msg-ai-' + Date.now();

    if (sessionId) {
      try {
        const { data: insertedUserMsg } = await supabaseAdmin
          .from('chat_messages')
          .insert({
            session_id: sessionId,
            role: 'user',
            content: message,
          })
          .select('id')
          .single();

        if (insertedUserMsg) userMsgId = insertedUserMsg.id;

        const { data: insertedAiMsg } = await supabaseAdmin
          .from('chat_messages')
          .insert({
            session_id: sessionId,
            role: 'assistant',
            content: aiResult.content,
            sources: aiResult.sources,
            tool_calls: aiResult.tool_calls,
            map_actions: aiResult.map_actions,
          })
          .select('id')
          .single();

        if (insertedAiMsg) assistantMsgId = insertedAiMsg.id;

        // Update session's updated_at
        await supabaseAdmin
          .from('chat_sessions')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', sessionId);
      } catch (dbErr) {
        console.error('Error saving messages to Supabase:', dbErr);
      }
    }

    // 6. Log Audit Trail
    await logAudit({
      userId: authProfile.id,
      action: 'AI_QUERY',
      resourceType: 'CHAT_ASSISTANT',
      resourceId: sessionId,
      accessResult: 'SUCCESS',
      metadata: {
        role: authProfile.role,
        messageLength: message.length,
        toolsUsed: (aiResult.tool_calls || []).map((t: { name: string }) => t.name),
      },
    });

    return NextResponse.json({
      sessionId,
      userMessageId: userMsgId,
      assistantMessageId: assistantMsgId,
      content: aiResult.content,
      sources: aiResult.sources,
      tool_calls: aiResult.tool_calls,
      map_actions: aiResult.map_actions,
      userRole: authProfile.role,
    });
  } catch (error: unknown) {
    console.error('Chat endpoint error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server saat memproses chat.' },
      { status: 500 }
    );
  }
}
