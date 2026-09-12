import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';
import toGeoJSON from '@mapbox/togeojson';

async function convertKmz(kmzPath: string, outPath: string) {
  const data = fs.readFileSync(kmzPath);
  const zip = await JSZip.loadAsync(data);
  const kmlFile = Object.keys(zip.files).find((name) => name.endsWith('.kml'));

  if (!kmlFile) {
    console.error('No KML file found inside KMZ');
    return;
  }

  const kmlText = await zip.files[kmlFile].async('text');
  const dom = new DOMParser().parseFromString(kmlText, 'text/xml');
  const geojson = toGeoJSON.kml(dom);

  fs.writeFileSync(outPath, JSON.stringify(geojson, null, 2));
  console.log(`Converted ${kmzPath} -> ${outPath} (${geojson.features?.length || 0} features)`);
}

const kmzSource = path.join(process.cwd(), 'public', 'my-places-apr-2026-v250426.kmz');
const geojsonOut = path.join(process.cwd(), 'public', 'cilegon_kmz_converted.geojson');

if (fs.existsSync(kmzSource)) {
  convertKmz(kmzSource, geojsonOut).catch(console.error);
} else {
  console.log('No KMZ file found at', kmzSource);
}
