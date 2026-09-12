-- 003_roles.sql
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    granted_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.admin_users (email, granted_by)
VALUES ('ridwansugiarto.mail@gmail.com', 'SYSTEM_INITIAL')
ON CONFLICT (email) DO NOTHING;
