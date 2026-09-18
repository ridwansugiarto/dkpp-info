import json, re

with open('scratch/all_active_pegawai.json', 'r', encoding='utf-8') as f:
    active = json.load(f)

# Map name & NIP to tempat_lahir
ttl_map = {}
for p in active:
    if p.get('nama'):
        ttl_map[p['nama'].strip().lower()] = p.get('tempat_lahir')
        # name without titles
        clean_name = re.sub(r',.*', '', p['nama']).strip().lower()
        clean_name = re.sub(r'^(drh|ir|dr|h|hj|drs|apt)\.?\s*', '', clean_name).strip()
        ttl_map[clean_name] = p.get('tempat_lahir')
    if p.get('nip'):
        ttl_map[p['nip']] = p.get('tempat_lahir')

# Update src/data/pegawai_humor.ts
with open('src/data/pegawai_humor.ts', 'r', encoding='utf-8') as f:
    humor_content = f.read()

# Update Interface
if 'tempat_lahir?:' not in humor_content:
    humor_content = humor_content.replace(
        '  nama: string;\n',
        '  nama: string;\n  tempat_lahir?: string | null;\n'
    )

# Update each item in OFFICIAL_DKPP_HUMOR_DATA
def update_item_ttl(match):
    block = match.group(0)
    # Extract nama
    m_nama = re.search(r'"nama":\s*"([^"]+)"', block)
    m_nip = re.search(r'"nip":\s*"([^"]+)"', block)
    
    nama = m_nama.group(1) if m_nama else ''
    nip = m_nip.group(1) if m_nip else ''
    
    clean_name = re.sub(r',.*', '', nama).strip().lower()
    clean_name = re.sub(r'^(drh|ir|dr|h|hj|drs|apt)\.?\s*', '', clean_name).strip()
    
    t_lahir = ttl_map.get(nip) or ttl_map.get(nama.lower()) or ttl_map.get(clean_name)
    
    if t_lahir and '"tempat_lahir":' not in block:
        block = re.sub(r'("nama":\s*"[^"]+",)', r'\1\n    "tempat_lahir": "' + t_lahir + '",', block)
    return block

# Replace items in array
humor_content = re.sub(r'\{\s*"nomor":\s*\d+,.*?\n  \}', update_item_ttl, humor_content, flags=re.DOTALL)

with open('src/data/pegawai_humor.ts', 'w', encoding='utf-8') as f:
    f.write(humor_content)

print('Updated src/data/pegawai_humor.ts with tempat_lahir!')
