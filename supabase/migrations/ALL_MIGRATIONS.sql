-- ============================================================
-- DKPP-INFO KOTA CILEGON - ALL CONSOLIDATED MIGRATIONS
-- Copy dan Paste seluruh script ini ke SQL Editor di Dashboard Supabase,
-- lalu klik "RUN".
-- ============================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. HELPER FUNCTION (updated_at trigger)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'GUEST' CHECK (role IN ('GUEST', 'EMPLOYEE', 'ADMIN')),
    is_verified_employee BOOLEAN NOT NULL DEFAULT FALSE,
    can_access_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. EMPLOYEES TABLE
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nip VARCHAR(30) UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    department TEXT NOT NULL DEFAULT 'DKPP Kota Cilegon',
    position TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    access_level TEXT NOT NULL DEFAULT 'STANDARD' CHECK (access_level IN ('STANDARD', 'SENSITIVE', 'ADMIN')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_employees_updated_at ON public.employees;
CREATE TRIGGER trg_employees_updated_at
    BEFORE UPDATE ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Initial Admin Seed in Employees
INSERT INTO public.employees (nip, full_name, email, department, position, is_active, access_level)
VALUES (
    '197610182002121002',
    'Ridwan Sugiarto',
    'ridwansugiarto.mail@gmail.com',
    'Dinas Ketahanan Pangan dan Pertanian Kota Cilegon',
    'Administrator Sistem & Analis Ketahanan Pangan',
    TRUE,
    'ADMIN'
)
ON CONFLICT (email) DO UPDATE 
SET nip = EXCLUDED.nip, access_level = 'ADMIN', is_active = TRUE;

-- 5. ADMIN USERS TABLE
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    granted_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.admin_users (email, granted_by)
VALUES ('ridwansugiarto.mail@gmail.com', 'SYSTEM_INITIAL')
ON CONFLICT (email) DO NOTHING;

-- 6. CHAT SESSIONS TABLE (Max 10 per user managed via app)
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT 'Chat Baru',
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id, updated_at DESC);

DROP TRIGGER IF EXISTS trg_chat_sessions_updated_at ON public.chat_sessions;
CREATE TRIGGER trg_chat_sessions_updated_at
    BEFORE UPDATE ON public.chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
    content TEXT NOT NULL,
    sources JSONB DEFAULT '[]'::jsonb,
    tool_calls JSONB DEFAULT '[]'::jsonb,
    map_actions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON public.chat_messages(session_id, created_at ASC);

-- 8. USER MEMORIES TABLE (Per-user strictly isolated)
CREATE TABLE IF NOT EXISTS public.user_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    memory_key TEXT NOT NULL,
    memory_value TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, memory_key)
);

DROP TRIGGER IF EXISTS trg_user_memories_updated_at ON public.user_memories;
CREATE TRIGGER trg_user_memories_updated_at
    BEFORE UPDATE ON public.user_memories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    folder TEXT NOT NULL DEFAULT 'ketahanan-pangan' CHECK (folder IN (
        'sensitif', 
        'ketahanan-pangan', 
        'pertanian', 
        'perikanan', 
        'peternakan', 
        'program', 
        'kepegawaian'
    )),
    category TEXT NOT NULL DEFAULT 'UMUM',
    is_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
    visibility TEXT NOT NULL DEFAULT 'INTERNAL' CHECK (visibility IN ('PUBLIC', 'INTERNAL', 'RESTRICTED', 'ADMIN')),
    uploaded_by TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INT NOT NULL DEFAULT 1,
    checksum TEXT,
    mime_type TEXT,
    file_size BIGINT,
    storage_path TEXT,
    indexed_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'UPLOADED' CHECK (status IN ('UPLOADED', 'PROCESSING', 'INDEXED', 'FAILED')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_documents_updated_at ON public.documents;
CREATE TRIGGER trg_documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 10. DOCUMENT CHUNKS TABLE & PGVECTOR INDEX
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(768),
    chunk_index INT NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_chunks_doc_id ON public.document_chunks(document_id);

-- 11. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    access_result TEXT NOT NULL DEFAULT 'SUCCESS',
    ip_hash TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- 12. VECTOR SEARCH RPC (Pre-authorization Role Filter)
CREATE OR REPLACE FUNCTION match_document_chunks (
  query_embedding vector(768),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5,
  user_role text DEFAULT 'GUEST',
  user_is_verified boolean DEFAULT false
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  similarity FLOAT,
  filename TEXT,
  folder TEXT,
  category TEXT,
  is_sensitive BOOLEAN,
  visibility TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) AS similarity,
    d.filename,
    d.folder,
    d.category,
    d.is_sensitive,
    d.visibility
  FROM public.document_chunks dc
  JOIN public.documents d ON dc.document_id = d.id
  WHERE 
    (
      user_role = 'ADMIN'
      OR
      (
        user_role = 'EMPLOYEE' 
        AND (
          d.is_sensitive = FALSE 
          OR (user_is_verified = TRUE AND d.visibility IN ('PUBLIC', 'INTERNAL', 'RESTRICTED'))
        )
      )
      OR
      (
        d.visibility = 'PUBLIC' 
        AND d.is_sensitive = FALSE 
        AND d.folder NOT IN ('sensitif', 'kepegawaian')
      )
    )
    AND (1 - (dc.embedding <=> query_embedding)) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 13. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 14. RLS POLICIES
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Employees can view own record" ON public.employees;
CREATE POLICY "Employees can view own record" ON public.employees
FOR SELECT USING (auth.jwt() ->> 'email' = email);

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

DROP POLICY IF EXISTS "Users manage own sessions" ON public.chat_sessions;
CREATE POLICY "Users manage own sessions" ON public.chat_sessions
FOR ALL USING (user_id = auth.uid()::text OR user_id = 'guest');

DROP POLICY IF EXISTS "Users manage messages via session" ON public.chat_messages;
CREATE POLICY "Users manage messages via session" ON public.chat_messages
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.chat_sessions cs 
        WHERE cs.id = chat_messages.session_id 
        AND (cs.user_id = auth.uid()::text OR cs.user_id = 'guest')
    )
);

DROP POLICY IF EXISTS "Public can read public documents" ON public.documents;
CREATE POLICY "Public can read public documents" ON public.documents
FOR SELECT USING (
    visibility = 'PUBLIC' AND is_sensitive = FALSE AND folder NOT IN ('sensitif', 'kepegawaian')
);

DROP POLICY IF EXISTS "Admin view audit logs" ON public.audit_logs;
CREATE POLICY "Admin view audit logs" ON public.audit_logs
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
    )
);
