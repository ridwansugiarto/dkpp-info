-- 007_documents.sql
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
