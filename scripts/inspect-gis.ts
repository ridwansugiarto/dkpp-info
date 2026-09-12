import fs from 'fs';
import path from 'path';

console.log('--- DKPP-INFO GIS INSPECTOR ---');
const publicDir = path.join(process.cwd(), 'public');
const files = fs.readdirSync(publicDir);

const gisFiles = files.filter((f) => ['.kmz', '.kml', '.geojson'].some((ext) => f.endsWith(ext)));

console.log('GIS Spatial Files Found in public/:');
gisFiles.forEach((file) => {
  const stat = fs.statSync(path.join(publicDir, file));
  console.log(`- ${file} (${(stat.size / 1024).toFixed(1)} KB)`);
});
