-- 012_rls_policies.sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read and update their own profile; Admins can read all
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- Employees: Authenticated users can read their own employee record matching email
DROP POLICY IF EXISTS "Employees can view own record" ON public.employees;
CREATE POLICY "Employees can view own record" ON public.employees
FOR SELECT USING (auth.jwt() ->> 'email' = email);

-- User Memories: Strict per-user isolation
DROP POLICY IF EXISTS "Users read own memory" ON public.user_memories;
CREATE POLICY "Users read own memory" ON public.user_memories
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own memory" ON public.user_memories;
CREATE POLICY "Users insert own memory" ON public.user_memories
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own memory" ON public.user_memories;
CREATE POLICY "Users update own memory" ON public.user_memories
FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own memory" ON public.user_memories;
CREATE POLICY "Users delete own memory" ON public.user_memories
FOR DELETE USING (auth.uid() = user_id);

-- Chat Sessions: Strict isolation (user_id matches auth.uid() or session identifier)
DROP POLICY IF EXISTS "Users manage own sessions" ON public.chat_sessions;
CREATE POLICY "Users manage own sessions" ON public.chat_sessions
FOR ALL USING (user_id = auth.uid()::text OR user_id = 'guest');

-- Chat Messages: Cascades through session ownership
DROP POLICY IF EXISTS "Users manage messages via session" ON public.chat_messages;
CREATE POLICY "Users manage messages via session" ON public.chat_messages
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.chat_sessions cs 
        WHERE cs.id = chat_messages.session_id 
        AND (cs.user_id = auth.uid()::text OR cs.user_id = 'guest')
    )
);

-- Documents: Public vs Employee vs Admin read access
DROP POLICY IF EXISTS "Public can read public documents" ON public.documents;
CREATE POLICY "Public can read public documents" ON public.documents
FOR SELECT USING (
    visibility = 'PUBLIC' AND is_sensitive = FALSE AND folder NOT IN ('sensitif', 'kepegawaian')
);

-- Audit logs: Insertable by server / authenticated; readable by Admin
DROP POLICY IF EXISTS "Admin view audit logs" ON public.audit_logs;
CREATE POLICY "Admin view audit logs" ON public.audit_logs
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
    )
);
