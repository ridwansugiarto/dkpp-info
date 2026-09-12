import fs from 'fs';
import path from 'path';

console.log('--- DKPP-INFO DOCUMENT INGESTION PIPELINE ---');
const folders = [
  'sensitif',
  'ketahanan-pangan',
  'pertanian',
  'perikanan',
  'peternakan',
  'program',
  'kepegawaian',
];

console.log('Ready to ingest into knowledge base folders:');
folders.forEach((f) => console.log(` - /knowledge-base/${f}/`));
