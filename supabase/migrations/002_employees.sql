-- 002_employees.sql
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

-- Seed initial admin employee
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
