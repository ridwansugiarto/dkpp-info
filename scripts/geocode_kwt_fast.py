"""
Geocode KWT Cilegon using Photon (Komoot / OpenStreetMap)
High precision geocoder with hamlet / Link. support in Cilegon
"""
import openpyxl
import json
import time
import urllib.request
import urllib.parse
import re

EXCEL_PATH = r'public/tabel kwt/Data KWT Update 2026.xlsx'
JSON_OUT = r'public/tabel kwt/kwt_geocoded.json'
SQL_OUT = r'supabase_sql/09_kwt_seed.sql'

# Cilegon bounding box roughly: lat [-6.15, -5.90], lon [105.90, 106.15]
def is_cilegon(lat, lon):
    return -6.20 <= lat <= -5.85 and 105.85 <= lon <= 106.20

def photon_geocode(query):
    params = urllib.parse.urlencode({
        'q': query,
        'limit': 1,
    })
    url = f"https://photon.komoot.io/api/?{params}"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) DKPP-Cilegon/1.0'}
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            features = data.get('features', [])
            if features:
                coords = features[0]['geometry']['coordinates']
                lon, lat = coords[0], coords[1]
                props = features[0].get('properties', {})
                name = props.get('name', '')
                city = props.get('city', props.get('state', ''))
                display = f"{name}, {city}"
                if is_cilegon(lat, lon):
                    return lat, lon, display
    except Exception as e:
        print(f"    Error querying '{query}': {e}")
    return None, None, None

def clean_address_for_search(alamat, kelurahan, kecamatan):
    if not alamat:
        return None
    # Hapus prefix umum seperti Link., Lingkungan, Kp., Kampung, Rt/Rw dll
    raw = alamat
    # Ekstrak nama lingkungan: e.g. "Link. Delingseng Rt.15/01 Kel. Kebonsari" -> "Delingseng"
    m = re.search(r'(?:Link\.?|Lingkungan|Kp\.?|Kampung|Komp\.?|Komplek)\s+([A-Za-z0-9\s]+?)(?:(?:\s+Rt|\s+Rw|\s+Kel|\s+Kec|\s+No|\(|\/|,|\.|$))', raw, re.IGNORECASE)
    if m:
        lingk = m.group(1).strip()
        if len(lingk) >= 3 and lingk.lower() not in ['baru', 'lama', 'kel', 'cilegon']:
            return f"{lingk} Cilegon"
    # Pola kedua: ambil kata pertama sebelum Rt
    m2 = re.search(r'([A-Za-z\s]+?)(?:(?:\s+Rt|\s+Rw|\s+Kel|\s+Kec|\(|\/|,|\.|$))', raw, re.IGNORECASE)
    if m2:
        cand = m2.group(1).replace('Link', '').replace('Lingkungan', '').strip()
        if len(cand) >= 3:
            return f"{cand} Cilegon"
    return None

def main():
    wb = openpyxl.load_workbook(EXCEL_PATH)
    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))[6:]
    
    kwt_list = []
    coord_counts = {}

    print(f"Reading Excel rows...")
    for r in rows:
        no = r[0]
        if no is None:
            continue
        try:
            no_int = int(str(no).strip())
        except:
            continue

        kecamatan = str(r[1] or '').strip().upper()
        kelurahan = str(r[2] or '').strip().upper()
        nama_kwt = str(r[3] or '').strip().upper()
        nama_ketua = str(r[4] or '').strip() if r[4] and str(r[4]).strip() not in ['-', '0', 'None'] else None
        no_hp = str(r[5] or '').strip() if r[5] and str(r[5]).strip() not in ['-', '0', 'None'] else None
        alamat = str(r[6] or '').strip() if r[6] and str(r[6]).strip() not in ['-', '0', 'None'] else None
        luas_lahan = str(r[7] or '').strip() if r[7] and str(r[7]).strip() not in ['-', '0', 'None'] else None
        keterangan = str(r[8] or '').strip() if r[8] and str(r[8]).strip() not in ['-', '0', 'None'] else 'Aktif'
        bantuan = str(r[9] or '').strip() if r[9] and str(r[9]).strip() not in ['-', '0', 'None'] else None
        jenis_usaha = str(r[10] or '').strip() if r[10] and str(r[10]).strip() not in ['-', '0', 'None'] else None

        kwt_list.append({
            'no_urut': no_int,
            'kecamatan': kecamatan,
            'kelurahan': kelurahan,
            'nama_kwt': nama_kwt,
            'nama_ketua': nama_ketua,
            'no_wa_ketua': None,
            'no_hp_ketua': no_hp,
            'alamat_sekretariat': alamat,
            'luas_lahan': luas_lahan,
            'keterangan': keterangan,
            'bantuan': bantuan,
            'jenis_usaha': jenis_usaha,
            'latitude': None,
            'longitude': None,
            'maps_link': None,
            'geocode_display': None
        })

    print(f"Found {len(kwt_list)} KWT records. Geocoding...")

    # Cache geocode per query string to prevent duplicate queries
    geo_cache = {}

    for i, kwt in enumerate(kwt_list):
        alamat = kwt['alamat_sekretariat']
        kel = kwt['kelurahan'].title()
        kec = kwt['kecamatan'].title()
        
        lat, lon, display = None, None, None
        
        # 1. Try cleaned hamlet query
        addr_q = clean_address_for_search(alamat, kwt['kelurahan'], kwt['kecamatan'])
        if addr_q:
            if addr_q in geo_cache:
                lat, lon, display = geo_cache[addr_q]
            else:
                lat, lon, display = photon_geocode(addr_q)
                geo_cache[addr_q] = (lat, lon, display)
                time.sleep(0.15)
        
        # 2. If not found, try kelurahan Cilegon
        if lat is None:
            kel_q = f"{kel} Cilegon"
            if kel_q in geo_cache:
                lat, lon, display = geo_cache[kel_q]
            else:
                lat, lon, display = photon_geocode(kel_q)
                geo_cache[kel_q] = (lat, lon, display)
                time.sleep(0.15)

        # 3. If still not found, try kecamatan Cilegon
        if lat is None:
            kec_q = f"Kecamatan {kec} Cilegon"
            if kec_q in geo_cache:
                lat, lon, display = geo_cache[kec_q]
            else:
                lat, lon, display = photon_geocode(kec_q)
                geo_cache[kec_q] = (lat, lon, display)
                time.sleep(0.15)

        # Fallback coordinates for known Cilegon kelurahans if photon misses any
        FALLBACK_KELURAHAN = {
            'KEBONSARI': (-6.0143, 106.0235),
            'CITANGKIL': (-6.0125, 106.0189),
            'WARNASARI': (-6.0280, 106.0090),
            'TAMAN BARU': (-6.0095, 106.0350),
            'LEBAK DENOK': (-6.0350, 106.0280),
            'SAMIRANGGON': (-6.0420, 106.0350),
            'SAMIRANGGANG': (-6.0420, 106.0350),
            'DリングSENG': (-6.0198, 106.0220),
            'TEGAL RATU': (-6.0150, 105.9750),
            'KUBANGSARI': (-6.0250, 105.9800),
            'GUNUNG SUGIH': (-6.0450, 105.9600),
            'RANDAKARI': (-6.0400, 105.9900),
            'BANJARSARI': (-6.0500, 106.0100),
            'KEPATIHAN': (-5.9850, 106.0250),
            'GEREM': (-5.9650, 106.0150),
            'TAMANSARI': (-5.9350, 106.0050),
            'LEBAKGEDE': (-5.9200, 106.0100),
            'MEKARSARI': (-5.9300, 106.0200),
            'SURALAYA': (-5.8900, 106.0300),
            'GROGOL': (-5.9800, 106.0400),
            'KOTASARI': (-5.9750, 106.0500),
            'RAWA ARUM': (-5.9900, 106.0350),
            'GEROGOL': (-5.9800, 106.0400),
            'JOMBANG WETAN': (-6.0100, 106.0500),
            'GEDONG DALEM': (-6.0180, 106.0550),
            'MASIGIT': (-6.0150, 106.0450),
            'SUKMAJAYA': (-6.0250, 106.0600),
            'PURWAKARTA': (-5.9950, 106.0650),
            'KEBONDALEM': (-6.0050, 106.0600),
            'RAMANUJU': (-6.0120, 106.0380),
            'TEGAL BUNDER': (-5.9850, 106.0800),
            'PURWAKARTA': (-5.9950, 106.0650),
            'KEDALEMAN': (-6.0280, 106.0800),
            'KALITIMBANG': (-6.0350, 106.0750),
            'CIBEBER': (-6.0300, 106.0700),
            'BENDUNGAN': (-6.0150, 106.0680),
            'CILEGON': (-6.0180, 106.0500),
            'CIWANDAN': (-6.0300, 105.9800),
            'CITANGKIL': (-6.0150, 106.0200),
            'PULOMERAK': (-5.9300, 106.0100),
        }

        if lat is None:
            kel_upper = kwt['kelurahan'].upper().strip()
            if kel_upper in FALLBACK_KELURAHAN:
                lat, lon = FALLBACK_KELURAHAN[kel_upper]
                display = f"Kelurahan {kel_upper}, Cilegon (Pusat Kelurahan)"

        if lat is None:
            # Default Cilegon center
            lat, lon = -6.002, 106.025
            display = f"Kota Cilegon"

        # Apply slight jitter if same coordinate exists to make all pins distinguishable on map
        coord_key = f"{lat:.4f},{lon:.4f}"
        coord_counts[coord_key] = coord_counts.get(coord_key, 0) + 1
        count = coord_counts[coord_key]
        if count > 1:
            # Shift slightly in spiral or offset
            offset_lat = ((count % 5) - 2) * 0.00035
            offset_lon = ((count // 5) - 2) * 0.00035
            lat += offset_lat
            lon += offset_lon

        kwt['latitude'] = round(lat, 7)
        kwt['longitude'] = round(lon, 7)
        kwt['geocode_display'] = display
        kwt['maps_link'] = f"https://www.google.com/maps?q={kwt['latitude']},{kwt['longitude']}"

        print(f"[{i+1:02d}/84] {kwt['nama_kwt']} ({kwt['kelurahan']}) -> {kwt['latitude']}, {kwt['longitude']} ({display})")

    # Save to JSON
    with open(JSON_OUT, 'w', encoding='utf-8') as f:
        json.dump(kwt_list, f, ensure_ascii=False, indent=2)
    print(f"\nSaved JSON: {JSON_OUT}")

    # Generate SQL Seed file
    sql_lines = [
        "-- ============================================================",
        "-- SEED DATA KWT (KELOMPOK WANITA TANI) - 84 RECORDS",
        "-- DKPP KOTA CILEGON UPDATE 2026",
        "-- ============================================================",
        "",
        "TRUNCATE TABLE public.kwt RESTART IDENTITY;",
        "",
        "INSERT INTO public.kwt (",
        "    no_urut, kecamatan, kelurahan, nama_kwt, nama_ketua, no_wa_ketua, no_hp_ketua,",
        "    alamat_sekretariat, luas_lahan, keterangan, bantuan, jenis_usaha,",
        "    latitude, longitude, maps_link, geocode_display, is_active",
        ") VALUES"
    ]

    val_lines = []
    for k in kwt_list:
        def esc(val):
            if val is None:
                return "NULL"
            s = str(val).replace("'", "''")
            return f"'{s}'"

        no_u = k['no_urut']
        kec = esc(k['kecamatan'])
        kel = esc(k['kelurahan'])
        nama = esc(k['nama_kwt'])
        ketua = esc(k['nama_ketua'])
        wa = esc(k['no_wa_ketua'])
        hp = esc(k['no_hp_ketua'])
        alm = esc(k['alamat_sekretariat'])
        luas = esc(k['luas_lahan'])
        ket = esc(k['keterangan'])
        bantu = esc(k['bantuan'])
        usaha = esc(k['jenis_usaha'])
        lat = k['latitude'] if k['latitude'] is not None else "NULL"
        lon = k['longitude'] if k['longitude'] is not None else "NULL"
        maps = esc(k['maps_link'])
        disp = esc(k['geocode_display'])

        val_lines.append(
            f"({no_u}, {kec}, {kel}, {nama}, {ketua}, {wa}, {hp}, {alm}, {luas}, {ket}, {bantu}, {usaha}, {lat}, {lon}, {maps}, {disp}, true)"
        )

    sql_lines.append(",\n".join(val_lines) + ";")
    sql_lines.append("")
    sql_lines.append("-- Verifikasi hasil insert")
    sql_lines.append("SELECT kecamatan, COUNT(*) as total_kwt FROM public.kwt GROUP BY kecamatan ORDER BY total_kwt DESC;")
    sql_lines.append("SELECT COUNT(*) as total, COUNT(latitude) as with_coords FROM public.kwt;")

    with open(SQL_OUT, 'w', encoding='utf-8') as f:
        f.write("\n".join(sql_lines))

    print(f"Saved SQL: {SQL_OUT}")
    print("Done generating 84 geocoded records!")

if __name__ == '__main__':
    main()
