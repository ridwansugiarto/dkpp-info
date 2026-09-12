-- 006_user_memories.sql
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
