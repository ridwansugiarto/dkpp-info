-- 010_storage_policies.sql
-- Create storage buckets if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('dkpp-public', 'dkpp-public', true),
    ('dkpp-private', 'dkpp-private', false),
    ('dkpp-sensitive', 'dkpp-sensitive', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Storage policies for dkpp-public (Anyone can read)
CREATE POLICY "Public Read dkpp-public"
ON storage.objects FOR SELECT
USING (bucket_id = 'dkpp-public');

-- Admin write access to all buckets
CREATE POLICY "Admin All dkpp buckets"
ON storage.objects FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
    )
);
