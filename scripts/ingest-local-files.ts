import fs from 'fs';
import path from 'path';

const TARGET_DIR = path.resolve(process.cwd());

interface FileInventory {
  filename: string;
  extension: string;
  size: number;
  category: 'GIS' | 'DATASET' | 'DOCUMENT' | 'CONFIG' | 'OTHER';
  detectedType: string;
}

function scanFiles(dir: string): FileInventory[] {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  const results: FileInventory[] = [];

  for (const item of items) {
    if (item.isDirectory()) {
      if (['node_modules', '.next', '.git'].includes(item.name)) continue;
      // Recurse public or src
      if (['public', 'src'].includes(item.name)) {
        results.push(...scanFiles(path.join(dir, item.name)));
      }
    } else {
      const ext = path.extname(item.name).toLowerCase();
      const stats = fs.statSync(path.join(dir, item.name));
      let category: FileInventory['category'] = 'OTHER';
      let detectedType = ext;

      if (['.kmz', '.kml', '.geojson'].includes(ext)) {
        category = 'GIS';
        detectedType = 'GIS Spatial Asset';
      } else if (['.xlsx', '.csv', '.json'].includes(ext)) {
        category = 'DATASET';
        detectedType = 'Tabular Dataset';
      } else if (['.pdf', '.docx', '.txt', '.md'].includes(ext)) {
        category = 'DOCUMENT';
        detectedType = 'Textual Document Knowledge';
      } else if (['.ts', '.tsx', '.mjs', '.sql'].includes(ext)) {
        category = 'CONFIG';
      }

      results.push({
        filename: item.name,
        extension: ext,
        size: stats.size,
        category,
        detectedType,
      });
    }
  }

  return results;
}

console.log('--- DKPP-INFO LOCAL ASSET INVENTORY ---');
const inventory = scanFiles(TARGET_DIR);
console.table(
  inventory.filter((f) => ['GIS', 'DATASET', 'DOCUMENT'].includes(f.category))
);
console.log(`Total scanned relevant assets: ${inventory.length}`);
