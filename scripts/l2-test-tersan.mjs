import { createClient } from '@supabase/supabase-js';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { parse as l2Parse } from '../lib/l2-parser.js';

const TERSAN_FORMAT_KODU = 'tersan_cadmatic_spool';
const TEST_PDFLERI = [
  { ad: 'S08', path: '00000000-0000-0000-0000-000000000001/8a56c1f7-8d9d-4f18-985e-b54d0c1a206c/g200-303-bs15-4-5-.s08.1-momo0h57-80.pdf' },
  { ad: 'S09', path: '00000000-0000-0000-0000-000000000001/8a56c1f7-8d9d-4f18-985e-b54d0c1a206c/g200-303-bs15-4-5-.s09.1-momo0h56-681.pdf' },
  { ad: 'S10', path: '00000000-0000-0000-0000-000000000001/8a56c1f7-8d9d-4f18-985e-b54d0c1a206c/g200-303-bs15-5-5-.s10.1-momo0h55-968.pdf' }
];

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY;
if (!URL || !KEY) { console.error('HATA: env gerekli.'); process.exit(1); }

const supabase = createClient(URL, KEY);

console.log('=== L2 PARSER LOKAL TEST — Tersan ===\n');
console.log('1) parser_kural cekiliyor...');
const { data: format, error: fErr } = await supabase
  .from('izometri_format_tanimlari')
  .select('id, ad, parser_kural')
  .eq('format_kodu', TERSAN_FORMAT_KODU).single();

if (fErr || !format) { console.error('Format yok:', fErr); process.exit(1); }
const parserKural = format.parser_kural;
if (!parserKural || Object.keys(parserKural).length === 0) {
  console.error('parser_kural bos. Migration 025 calistirildi mi?'); process.exit(1);
}
console.log('   OK Format:', format.ad);
console.log('   Schema v:', parserKural.schema_version);
console.log('   Alan sayisi:', Object.keys(parserKural.alanlar || {}).length);
console.log('   Malzeme tablosu aktif:', parserKural.malzeme_tablosu?.aktif === true ? 'EVET' : 'HAYIR');
console.log('');

const sonuclar = [];
for (const pdf of TEST_PDFLERI) {
  console.log('=== TEST:', pdf.ad, '===');
  const { data: blob, error: dlErr } = await supabase.storage.from('izometri-pdfs').download(pdf.path);
  if (dlErr) { console.error('Indirme:', dlErr); continue; }
  const buf = Buffer.from(await blob.arrayBuffer());
  const parsed = await pdfParse(buf);
  const text = parsed.text;
  console.log('Text uzunlugu:', text.length);
  const t0 = Date.now();
  const sonuc = l2Parse(text, parserKural);
  const dt = Date.now() - t0;
  console.log('Sonuc:', sonuc.ok ? 'BASARILI' : 'BASARISIZ', '(' + dt + 'ms)');
  console.log('Parser seviye:', sonuc.parser_seviye);
  if (sonuc.alan_match_orani != null) {
    console.log('Alan match:', sonuc.cikarilan_alan_sayisi + '/' + sonuc.toplam_alan_sayisi,
      '(' + (sonuc.alan_match_orani * 100).toFixed(0) + '%)');
  }
  if (sonuc.malzeme_satir_sayisi != null) console.log('Malzeme satir:', sonuc.malzeme_satir_sayisi);
  if (!sonuc.ok) console.log('Sebep:', sonuc.sebep);

  if (sonuc.parsed?.spoollar?.[0]) {
    const sp = sonuc.parsed.spoollar[0];
    console.log('   spool_no   :', sp.spool_no);
    console.log('   pipeline_no:', sp.pipeline_no);
    console.log('   dn         :', sp.dn);
    console.log('   cap_mm     :', sp.cap_mm);
    console.log('   et_mm      :', sp.et_mm);
    console.log('   kalite     :', sp.kalite);
    console.log('   agirlik_kg :', sp.agirlik_kg);
    console.log('   yuzey      :', sp.yuzey);
    if (sp._tersan_meta) {
      console.log('   tarih      :', sp._tersan_meta.tarih);
      console.log('   cizen      :', sp._tersan_meta.cizen);
      console.log('   proje_kodu :', sp._tersan_meta.proje_kodu);
      console.log('   sertifika  :', JSON.stringify(sp._tersan_meta.sertifika));
    }
    console.log('   malzeme_say:', sp.malzeme_listesi?.length || 0);
    if (sp.malzeme_listesi?.length) {
      sp.malzeme_listesi.forEach((m, i) => {
        console.log('     [' + (i+1) + ']', m.kategori, '|', (m.tanim || '?').slice(0, 50));
      });
    }
  } else if (sonuc.cikarilan) {
    console.log('   (Kabul kriterleri tutmadi, cikarilan alanlar:)');
    console.log('   ', JSON.stringify(sonuc.cikarilan, null, 2));
  }
  sonuclar.push({ ad: pdf.ad, sonuc });
  console.log('');
}

console.log('=== OZET ===');
const ok = sonuclar.filter(s => s.sonuc.ok).length;
console.log('L2 basari:', ok + '/' + sonuclar.length);
if (ok === sonuclar.length) console.log('TUM PDF BASARILI. 51\'de canliya baglanabilir.');
else console.log('Bazi PDF basarisiz. Regex iyilestirmesi gerekli.');
