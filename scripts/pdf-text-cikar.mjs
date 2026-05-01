import { createClient } from '@supabase/supabase-js';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

const PDF_LISTESI = [
  { ad: 'S08', path: '00000000-0000-0000-0000-000000000001/8a56c1f7-8d9d-4f18-985e-b54d0c1a206c/g200-303-bs15-4-5-.s08.1-momo0h57-80.pdf' },
  { ad: 'S09', path: '00000000-0000-0000-0000-000000000001/8a56c1f7-8d9d-4f18-985e-b54d0c1a206c/g200-303-bs15-4-5-.s09.1-momo0h56-681.pdf' },
  { ad: 'S10', path: '00000000-0000-0000-0000-000000000001/8a56c1f7-8d9d-4f18-985e-b54d0c1a206c/g200-303-bs15-5-5-.s10.1-momo0h55-968.pdf' },
];

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('HATA: SUPABASE_URL ve SUPABASE_SERVICE_KEY env gerekli.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

for (const pdf of PDF_LISTESI) {
  console.log('\n#####################################');
  console.log('### PDF:', pdf.ad);
  console.log('#####################################');

  const { data: blob, error } = await supabase.storage.from('izometri-pdfs').download(pdf.path);
  if (error) { console.error('Indirme hatasi:', error); continue; }

  const buf = Buffer.from(await blob.arrayBuffer());
  console.log('Boyut:', (buf.length / 1024).toFixed(1), 'KB');

  const parsed = await pdfParse(buf);
  console.log('Sayfa:', parsed.numpages, '| Metin uzunlugu:', parsed.text.length);
  console.log('--- METIN ---');
  console.log(parsed.text);
  console.log('--- METIN SONU ---');
}
