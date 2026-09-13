-- Migration 018: Tabel Pangkalan Nelayan Tangkap Kota Cilegon
-- Membuat tabel nelayan_tangkap di Supabase dkpp-info beserta data 9 pangkalan dan RLS policy

CREATE TABLE IF NOT EXISTS public.nelayan_tangkap (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  nama_nelayan VARCHAR(255) NOT NULL,
  alat_tangkap TEXT,
  jenis_ikan TEXT DEFAULT '',
  perahu TEXT,
  no_hp VARCHAR(100),
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index koordinat spasial
CREATE INDEX IF NOT EXISTS idx_nelayan_tangkap_coords ON public.nelayan_tangkap(lat, lng);

-- Aktifkan RLS
ALTER TABLE public.nelayan_tangkap ENABLE ROW LEVEL SECURITY;

-- Policy read publik (anon & authenticated)
DROP POLICY IF EXISTS "public_read_nelayan_tangkap" ON public.nelayan_tangkap;
CREATE POLICY "public_read_nelayan_tangkap" ON public.nelayan_tangkap
  FOR SELECT
  TO public
  USING (true);

-- Insert / Upsert 9 Pangkalan Nelayan Tangkap Resmi Kota Cilegon
INSERT INTO public.nelayan_tangkap (id, user_id, lat, lng, nama_nelayan, alat_tangkap, jenis_ikan, perahu, no_hp, catatan, created_at)
VALUES 
  ('1bd82a1c-1eb5-4e07-bf14-3032cf481415', null, -5.97535724461646, 105.995321273804, 'Nelayan Lelean', 'Jaring:110,Pancing:110', '', '{"Perahu motor tempel":"54"}', '110', null, '2026-05-25 03:18:29.815867+00'),
  ('7fb1a2a8-2a61-4da4-a78b-97b29d2dd01d', null, -6.00265181392773, 106.087916493416, 'Nelayan Terate', 'Pancing:18,Jaring:18', '', '{"Perahu motor tempel":"5"}', '18', null, '2026-05-25 03:42:20.635974+00'),
  ('85d77ade-1c38-42ee-9e25-e901a90bca8d', null, -6.02121198068546, 105.951858758926, 'Nelayan Tanjung Leneng', 'Pancing:72,Jaring:72', '', '{"Perahu motor tempel":"64"}', '72', null, '2026-05-25 02:59:14.425932+00'),
  ('923b5772-f5ca-4e5e-b02e-6393a80c0186', null, -5.98419238348569, 105.990793704987, 'Nelayan Tanjung Peni', 'Pancing:191,Jaring:191', '', '{"Perahu motor tempel":"102"}', '191', null, '2026-05-25 03:15:42.658644+00'),
  ('c75383d9-4cb1-475c-af99-92a393fb5869', null, -5.89685912164417, 106.01773917675, 'Nelayan Suralaya', 'Jaring:67,Pancing:144', '', '{"Perahu motor tempel":"67"}', '144', null, '2026-05-25 03:40:22.400118+00'),
  ('dac7fa42-9d7a-40e1-b8a7-a9da635a6d2e', null, -5.93747550643535, 106.000567674637, 'Nelayan Mabak', 'Jaring:10,Pancing:10', '', '{"Perahu motor tempel":"10"}', '40', null, '2026-05-25 03:34:44.51582+00'),
  ('e27ea0eb-b58e-470f-8ca8-1c524ef83e12', null, -5.91880578636254, 106.004628539085, 'Nelayan Lebak Gede', 'Pancing:24', '', '{"Perahu motor tempel":"16"}', '24', null, '2026-05-25 03:38:48.848005+00'),
  ('f15a7f08-c8cd-4b11-90a3-7cc2ed745fcf', null, -5.94000459394947, 105.999956130981, 'Nelayan Medaksa', 'Jaring:52,Pancing:52', '', '{"Perahu motor tempel":"52"}', '76', null, '2026-05-25 03:37:27.984494+00'),
  ('ffba02f5-afcd-456a-a0d5-a459460d963b', null, -5.93655777560547, 106.000481843948, 'Nelayan Kaltex', 'Jaring:40,Pancing:40', '', '{"Perahu motor tempel":"40"}', '40', null, '2026-05-25 03:32:37.010795+00')
ON CONFLICT (id) DO UPDATE SET
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  nama_nelayan = EXCLUDED.nama_nelayan,
  alat_tangkap = EXCLUDED.alat_tangkap,
  perahu = EXCLUDED.perahu,
  no_hp = EXCLUDED.no_hp;
