// test-tablo-motoru.mjs — Increment 2 mekanik test (tasarım §4.2.3, commit ÖNCESİ zorunlu)
//
// Kipler:
//   node test-tablo-motoru.mjs --dump <pdf>            → metin satırlarını dök (keşif)
//   node test-tablo-motoru.mjs <pdf> <ai.json>         → AI satırlarından sentez + l2 parse + kıyas
//     ai.json: izometri-oku cevabındaki spoollar[0] (format_tanit konsolundan ya da ai_api_log'dan)
//
// Beklenenler (dosya adına göre otomatik — tasarım §4.2.3):
//   *M230*        → cap_mm 60.3, et_mm 4.5 (et_kaynagi 'tablo')
//   *817-013*     → dn 50, cap_mm 60.3, schedule '10S', et_mm null (et_kaynagi 'pdf_yok' — asme zinciri)
//   *817-018*     → dn 40, cap_mm 48.3, schedule '10S' (redüksiyon 2-1/8 null = zararsız)
//
// pdf-parse path import (MK-119.4) + glyph-onar esnek import (temiz PDF'te no-op).

import fs from 'fs';
import './ares-tablo-sentez.js';
import l2 from './lib/l2-parser.js';

const argv = process.argv.slice(2);
const dump = argv[0] === '--dump';
const pdfYol = dump ? argv[1] : argv[0];
const aiYol = dump ? null : argv[1];
if (!pdfYol){ console.log('kullanım: node test-tablo-motoru.mjs [--dump] <pdf> [ai.json]'); process.exit(2); }

// pdf-parse — path import (MK-119.4: doğrudan import debug moduna düşer)
const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js');
const ham = (await pdfParse(fs.readFileSync(pdfYol))).text || '';

// glyph onarımı — lib/glyph-onar.js varsa uygula (temizse no-op), API esnek çözülür
let metin = ham;
try {
  const g = await import('./lib/glyph-onar.js');
  const f = g.metinNormalle || g.default?.metinNormalle || g.onar || g.default?.onar || null;
  if (f){ const r = f(ham); metin = (r && typeof r === 'object' && r.metin) ? r.metin : (typeof r === 'string' ? r : ham);
          if (r && r.durum) console.log('glyph:', r.durum); }
} catch (e) { console.log('glyph-onar atlandı:', e.message.split('\n')[0]); }

if (dump){
  metin.split('\n').map(s=>s.trim()).filter(Boolean).forEach((s,i)=>console.log(String(i).padStart(3)+'│'+s));
  process.exit(0);
}

if (!aiYol){ console.log('ai.json gerekli (spoollar[0])'); process.exit(2); }
const aiSpool = JSON.parse(fs.readFileSync(aiYol, 'utf8'));
const rows = Array.isArray(aiSpool.malzeme_listesi) ? aiSpool.malzeme_listesi : (Array.isArray(aiSpool) ? aiSpool : []);
if (!rows.length){ console.log('✗ AI malzeme_listesi boş'); process.exit(1); }

// 1) SENTEZ (format_tanit ile AYNI çekirdek — ares-tablo-sentez.js)
const S = globalThis.ARES_TABLO_SENTEZ;
const sz = S.sentezle(metin, rows);
console.log('— SENTEZ —');
sz.satir_tipleri.forEach(t=>console.log('['+t.ad+'] tetik=/'+t.tetikleyici_regex+'/\n  pattern='+t.pattern+'\n  gh='+JSON.stringify(t.grup_haritasi)));
console.log('rapor: yeşil='+sz.rapor.yesil+' kırmızı='+sz.rapor.kirmizi);
sz.rapor.satirlar.filter(s=>s.durum==='kirmizi').forEach(s=>console.log('  ✗ '+(s.tanim||'?')+' — '+s.sebep+(s.satir?('\n    satır: '+s.satir):'')));
console.log('başlık:', JSON.stringify(sz.baslik_tetikleyici), '· dominant:', JSON.stringify(sz.dominant));

// 2) L2 PARSE — sentezlenen tablo + minimal kabuk alanı (kabul geçişi için spool_no)
const kural = { ekstraktor_tipi:'regex_text', min_metin_uzunlugu:100,
  alanlar:{ spool_no:{ tip:'string', grup:1, regex:'-?(S\\d+(?:_\\d+)?)\\b' } },
  kabul_kriterleri:{ min_overall_match_orani:0.5, min_malzeme_satir:1, l3_fallback_yapilir:true },
  malzeme_tablosu:{ aktif:true, ...(sz.baslik_tetikleyici?{baslik_tetikleyici:sz.baslik_tetikleyici}:{}), satir_tipleri:sz.satir_tipleri } };
const r = l2.parse(metin, kural);
if (!r.ok){ console.log('✗ l2 parse FAIL:', r.sebep); process.exit(1); }
const sp = r.parsed.spoollar[0];
console.log('\n— SPOOL —');
console.log(JSON.stringify({ spool_no:sp.spool_no, dn:sp.dn, cap_mm:sp.cap_mm, et_mm:sp.et_mm, et_kaynagi:sp.et_kaynagi, schedule:sp.schedule }, null, 1));
console.log('— SATIRLAR —');
sp.malzeme_listesi.forEach(m=>console.log(' ', JSON.stringify({ kat:m.kategori, tanim:m.tanim, boyut:m.boyut, cap:m.dis_cap_mm, et:m.et_mm, dn:m.dn, sch:m.sch, etk:m._et_kaynak, boy:m.boy_mm, adet:m.adet, kalite:m.kalite, kg:m.agirlik_kg })));

// 3) BEKLENEN KIYAS (dosya adından)
const ad = pdfYol.toUpperCase();
let bekle = null;
if (ad.includes('M230')) bekle = { cap_mm:60.3, et_mm:4.5, et_kaynagi:'tablo' };
else if (ad.includes('817-013')) bekle = { dn:50, cap_mm:60.3, et_mm:null, et_kaynagi:'pdf_yok', schedule:'10S' };
else if (ad.includes('817-018')) bekle = { dn:40, cap_mm:48.3, schedule:'10S' };
else if (ad.includes('817-015')) bekle = { dn:40, cap_mm:48.3, et_mm:null, et_kaynagi:'pdf_yok', schedule:'10S' };

let ok = sz.rapor.kirmizi === 0;
if (!ok) console.log('\n✗ sentez raporunda kırmızı satır var');
if (bekle){
  console.log('\n— KIYAS —');
  for (const [k,v] of Object.entries(bekle)){
    const g2 = sp[k];
    const e = (v==null) ? (g2==null) : (typeof v==='number' ? Math.abs(g2-v)<=0.05 : g2===v);
    console.log((e?'✓':'✗')+' spool.'+k+' beklenen='+v+' gerçek='+g2);
    ok = ok && e;
  }
} else console.log('\n(bilinen beklenen yok — manuel değerlendir)');

// 4) AI satır kıyası (kural çıktısı == AI değeri — ground truth)
let aiOk = 0, aiFark = 0;
rows.forEach(rr=>{
  if (rr.agirlik_kg == null) return;
  const c = sp.malzeme_listesi.find(m=>!m.ham_satir && m.agirlik_kg!=null && Math.abs(m.agirlik_kg-rr.agirlik_kg)<=0.05);
  if (!c){ aiFark++; console.log('✗ AI satırı kuralda yok: '+(rr.tanim||'?')+' ('+rr.agirlik_kg+' kg)'); return; }
  const f=[];
  if (rr.dis_cap_mm!=null && c.dis_cap_mm!=null && Math.abs(rr.dis_cap_mm-c.dis_cap_mm)>0.05) f.push('cap');
  if (rr.et_mm!=null && c.et_mm!=null && Math.abs(rr.et_mm-c.et_mm)>0.05) f.push('et');
  if (f.length){ aiFark++; console.log('✗ '+(rr.tanim||'?')+' fark: '+f.join(',')); } else aiOk++;
});
console.log('AI kıyas: '+aiOk+' ✓ · '+aiFark+' ✗');
ok = ok && aiFark === 0;

console.log(ok ? '\n████ YEŞİL ████' : '\n✗✗ KIRMIZI ✗✗');
process.exit(ok ? 0 : 1);
