// test-fingerprint-icerik.mjs — Faz 1 kanıtı (oturum 152)
// AMAÇ: format_tanit'in yeni ürettiği İÇERİK-ÖNCELİKLİ fingerprint'in (fn'siz)
//        GERÇEK routing fonksiyonu fingerprintSkor ile eşik (≥2) geçtiğini kanıtlamak.
// YÖNTEM: api/izometri-oku.js SALT-OKUNUR okunur (MK-49.1 — dosyaya dokunulmaz),
//        fingerprintSkor fonksiyonu kaynak metinden ayıklanıp değerlendirilir.
// KOŞMA: node test-tablo-motoru.mjs deseninde → repo kökünden: node test-fingerprint-icerik.mjs
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('./api/izometri-oku.js', import.meta.url), 'utf8');

// fonksiyonu kaynak metinden ayıkla (brace-match) — izometri-oku DEĞİŞTİRİLMEZ
function ayikla(ad){
  const i = src.indexOf('function '+ad+'(');
  if(i<0) throw new Error(ad+' kaynakta bulunamadı — izometri-oku yapısı değişmiş olabilir');
  let d=0, j=src.indexOf('{', i);
  for(let k=j;k<src.length;k++){ if(src[k]==='{')d++; else if(src[k]==='}'){d--; if(d===0)return src.slice(i,k+1);} }
  throw new Error(ad+' brace-match başarısız');
}
const fingerprintSkor = new Function('return ('+ayikla('fingerprintSkor')+')')();

// Gerçek-benzeri ipucu (Tersan Cadmatic PDF açılışı): dosya adı VAR ama fingerprint fn İSTEMEZ
// Alan adları gerçek koddan teyitli: producer/creator (pdf_uretici DEĞİL — 152 testinin ilk kırmızısı buydu)
const ipucu = {
  dosya_adi: 'Y100-817-012.S01.1.pdf',
  producer: 'Cadmatic Oy / PDF Writer',
  creator: '',
  ilk_sayfa_metni: 'IZOMETRI ... Spool S01 ... MALZEME LISTESI POS TANIM BOYUT ADET AGIRLIK ...'
};

let fail = 0;
function vaka(ad, fp, beklenen, op){
  const s = fingerprintSkor(fp, ipucu);
  const ok = op==='>=' ? s>=beklenen : s<beklenen;
  console.log((ok?'✓':'✗')+' '+ad+' → skor '+s+' (beklenen '+op+' '+beklenen+')');
  if(!ok) fail++;
}

// 1) YENİ TİP (format_tanit gate'inin garanti ettiği asgari): baslik + uretici, fn YOK → eşik ≥2 geçmeli
vaka('fn\'siz: baslik+uretici', {
  baslik_regex: 'MALZEME\\s+LISTESI',
  pdf_uretici_anahtar: ['Cadmatic']
}, 2, '>=');

// 2) YENİ TİP tam paket: baslik + uretici + tablo_baslik → skor 3 (marjlı)
vaka('fn\'siz: baslik+uretici+tablo', {
  baslik_regex: 'MALZEME\\s+LISTESI',
  pdf_uretici_anahtar: ['Cadmatic'],
  tablo_baslik_regex: 'POS\\s+TANIM\\s+BOYUT'
}, 3, '>=');

// 3) GATE GEREKÇESİ: tek içerik sinyali yetmez → eşik altında kalmalı (format_tanit bunu kayıtta engeller)
vaka('tek sinyal (yalnız baslik) eşik ALTINDA', {
  baslik_regex: 'MALZEME\\s+LISTESI'
}, 2, '<');

// 4) REGRESYON: eski-tip fn'li fingerprint davranışı DEĞİŞMEDİ (+5 hâlâ çalışır)
vaka('eski tip: fn tutuyor (+5)', {
  dosya_adi_regex: '^Y\\d+-\\d+-\\d+\\.S\\d+\\.\\d+\\.pdf$'
}, 5, '>=');

// 5) YANLIŞ FORMAT: hiçbir sinyal tutmaz → 0
vaka('alakasız format → 0', {
  baslik_regex: 'BOYAMA\\s+RAPORU',
  pdf_uretici_anahtar: ['AutoCAD'],
  dosya_adi_regex: '^NB\\d+_imalat\\.pdf$'
}, 1, '<');

console.log(fail ? ('\n✗ '+fail+' vaka KIRMIZI') : '\n✓ TÜM VAKALAR YEŞİL — fn\'siz içerik-fingerprint routing eşiğini geçiyor (MK-151.5)');
process.exit(fail ? 1 : 0);
