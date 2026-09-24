"""
Geocoding script untuk 84 KWT DKPP Kota Cilegon
Menggunakan Nominatim (OpenStreetMap) - gratis, tanpa API key
Output: kwt_geocoded.json
"""
import openpyxl
import json
import time
import urllib.request
import urllib.parse

EXCEL_PATH = r'C:\Users\THINKPAD\.gemini\antigravity\scratch\dkpp-info\public\tabel kwt\Data KWT Update 2026.xlsx'
OUTPUT_PATH = r'C:\Users\THINKPAD\.gemini\antigravity\scratch\dkpp-info\public\tabel kwt\kwt_geocoded.json'

def nominatim_geocode(address, city="Cilegon", province="Banten", country="Indonesia"):
    """Query Nominatim for lat/lng."""
    full_query = f"{address}, {city}, {province}, {country}"
    params = urllib.parse.urlencode({
        'q': full_query,
        'format': 'json',
        'limit': 1,
        'countrycodes': 'id',
    })
    url = f"https://nominatim.openstreetmap.org/search?{params}"
    headers = {
        'User-Agent': 'DKPP-KWT-Geocoder/1.0 (dkpp-cilegon-chatbot)'
    }
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            if data:
                lat = float(data[0]['lat'])
                lon = float(data[0]['lon'])
                display = data[0].get('display_name', '')
                return lat, lon, display
    except Exception as e:
        print(f"  ERROR: {e}")
    return None, None, None

def make_maps_link(lat, lon, name):
    if lat and lon:
        return f"https://www.google.com/maps?q={lat},{lon}"
    return None

def load_kwt_data():
    wb = openpyxl.load_workbook(EXCEL_PATH)
    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))
    # Header at row index 4 (0-based), data starts index 6
    data_rows = rows[6:]
    kwt_list = []
    for r in data_rows:
        no = r[0]
        if no is None or not str(no).strip().isdigit():
            # skip rows tanpa nomor urut
            try:
                int(str(no).strip())
            except:
                continue
        kecamatan   = str(r[1] or '').strip().title()
        kelurahan   = str(r[2] or '').strip().title()
        nama_kwt    = str(r[3] or '').strip().upper()
        nama_ketua  = str(r[4] or '').strip() or None
        no_hp       = str(r[5] or '').strip() or None
        alamat      = str(r[6] or '').strip() if r[6] and str(r[6]).strip() not in ['0', '-', ''] else None
        luas_lahan  = str(r[7] or '').strip() or None
        keterangan  = str(r[8] or '').strip() or None
        bantuan     = str(r[9] or '').strip() or None
        jenis_usaha = str(r[10] or '').strip() or None

        if not nama_kwt:
            continue

        kwt_list.append({
            'no_urut': int(str(no).strip()),
            'kecamatan': kecamatan,
            'kelurahan': kelurahan,
            'nama_kwt': nama_kwt,
            'nama_ketua': nama_ketua,
            'no_hp': no_hp,
            'no_wa_ketua': None,  # placeholder
            'alamat_sekretariat': alamat,
            'luas_lahan': luas_lahan,
            'keterangan': keterangan,
            'bantuan': bantuan,
            'jenis_usaha': jenis_usaha,
            'latitude': None,
            'longitude': None,
            'maps_link': None,
            'geocode_display': None,
        })
    return kwt_list

def main():
    print("Loading KWT data from Excel...")
    kwt_list = load_kwt_data()
    print(f"Loaded {len(kwt_list)} KWT records.")

    print("\nStarting geocoding via Nominatim (1 req/sec)...")
    for i, kwt in enumerate(kwt_list):
        alamat = kwt['alamat_sekretariat']
        kelurahan = kwt['kelurahan']
        kecamatan = kwt['kecamatan']

        # Build contextual query
        if alamat:
            query = f"{alamat}, Kelurahan {kelurahan}, Kecamatan {kecamatan}"
        else:
            query = f"Kelurahan {kelurahan}, Kecamatan {kecamatan}"

        print(f"[{i+1:02d}/{len(kwt_list)}] {kwt['nama_kwt']} | Query: {query}")
        lat, lon, display = nominatim_geocode(query)

        if lat is None:
            # Fallback: geocode by kelurahan only
            print(f"  → Retry with kelurahan only: {kelurahan}, {kecamatan}, Cilegon")
            lat, lon, display = nominatim_geocode(f"Kelurahan {kelurahan}, {kecamatan}", city="Cilegon")

        kwt['latitude'] = lat
        kwt['longitude'] = lon
        kwt['geocode_display'] = display
        kwt['maps_link'] = make_maps_link(lat, lon, kwt['nama_kwt'])

        if lat:
            print(f"  ✅ {lat:.6f}, {lon:.6f}")
        else:
            print(f"  ❌ Not found, will use kelurahan centroid fallback in SQL")

        time.sleep(1.1)  # Nominatim rate limit: max 1 req/sec

    # Save result
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(kwt_list, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Done! Saved to: {OUTPUT_PATH}")
    success = sum(1 for k in kwt_list if k['latitude'])
    print(f"Geocoded: {success}/{len(kwt_list)} ({success/len(kwt_list)*100:.0f}%)")

if __name__ == '__main__':
    main()
