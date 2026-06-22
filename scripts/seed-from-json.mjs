#!/usr/bin/env node
// scripts/seed-from-json.mjs
// AresPipe — Parça kütüphanesi JSON → DB seed (idempotent upsert).
// Migration döngüsünü kırar: PDF→parse→JSON→bu script→DB. Eski veriye dokunmaz.
//
// Kullanım:
//   node scripts/seed-from-json.mjs <dosya.json>            # DRY-RUN (varsayılan, hiçbir şey yazmaz)
//   node scripts/seed-from-json.mjs <dosya.json> --yaz      # gerçek yazma
//   node scripts/seed-from-json.mjs <dosya.json> --tablo boru_olculer   # tablo zorla (JSON'da yoksa)
//
// Davranış:
//   - Sadece _db_aksiyonu IN (YENI, YENI_DN, YENI_SCH, YENI_SCH_KOMB) satırları yazılır.
//   - MEVCUT_TEYIT / FLAG_SUPHELI atlanır.
//   - Seed-gate lint (MK-191.1): grup/standart çelişen satır REDDEDİLİR (--yaz olsa bile yazılmaz).
//   - _ ile başlayan iç alanlar (_db_aksiyonu, _sanity_*, _nps) DB'ye gönderilmez.
//   - upsert + onConflict=UNIQUE_KEY → idempotent: var olan satır BOZULMAZ, eksik eklenir.
//   - flansh_olculer (partial UNIQUE index, migration 109) → upsert oturmaz: check-then-insert
//     (UNIQUE_KEY ile SELECT, varsa ATLA, yoksa INSERT). DRY-RUN'da SELECT yapılır ama INSERT edilmez.
//   - notlar gibi TEXT kolonlarda nested obje → JSON.stringify (tablo-bilinçli; boru_olculer JSONB'ye dokunma).
//   - uyari_satirlar: not amaçlı, varsayılan YAZILMAZ; --uyari-yaz verilirse YENI olanları da yazar.
//   - kapsam_disi_oneri_beta: HİÇ dokunulmaz.

import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// ── Tablo → UNIQUE KEY eşlemesi (onConflict için) ──────────────────
// DB'den teyit edilen gerçek unique constraint'ler. Yeni tablo eklenirse buraya yaz.
const UNIQUE_KEY = {
  boru_olculer:   ['standart', 'malzeme_grubu', 'dn', 'schedule_tipi', 'schedule_deger'],
  // fitting_olculer_dogal_uk (Oturum 178, NULLS NOT DISTINCT) — DB'den teyitli:
  fitting_olculer: ['standart', 'malzeme_grubu', 'parca_tipi', 'cap_buyuk_dn', 'cap_kucuk_dn', 'schedule_kod', 'class_no'],
  // flansh_olculer_dogal_uk (Oturum 197, migration 109 — PARTIAL UNIQUE, cunife-LJ-DIN WHERE ile dışlanmış).
  // partial index → supabase-js .upsert({onConflict}) hedefleyemez → check-then-insert dalı (CHECK_THEN_INSERT).
  // Buradaki anahtar = partial index'in MANTIKSAL anahtarı (paslanmaz/karbon satırlar bu tuple'la çakışır).
  flansh_olculer:  ['geometri_std', 'flansh_tipi', 'basinc_sinifi', 'cap_dn', 'malzeme_grubu', 'yuzey_tipi'],
};

// Partial UNIQUE index'li tablolar: upsert onConflict oturmaz → SELECT-önce-INSERT-sonra.
const CHECK_THEN_INSERT = new Set(['flansh_olculer']);

// TEXT kolon olup JSON içerebilen alanlar (nested obje → stringify).
// DİKKAT: boru_olculer.notlar JSONB → buraya EKLEME (supabase-js JSON gönderir, çift-encode olur).
const TEXT_JSON_KOLONLAR = {
  fitting_olculer: ['notlar'],
  flansh_olculer:  ['notlar'],
};

const YENI_AKSIYONLAR = new Set(['YENI', 'YENI_DN', 'YENI_SCH', 'YENI_SCH_KOMB']);

// ── Seed-gate lint (MK-191.1, Oturum 191) ──────────────────────────
// Matcher (spool_detay::boruEslestir) GRUP eksenine güveniyor: her satır doğru
// malzeme_grubu taşımalı + standartla çelişmemeli. Yanlış satır DB'ye GİRMEDEN yakalanır.
// (191'de bir 316L boru karbon B36.10M'e bağlanıyordu — kök: grup ekseni yok + etiket kayması.)
const GECERLI_GRUPLAR = new Set(['karbon', 'paslanmaz', 'cunife', 'aluminyum']);

// standart/geometri_std → İZİNLİ malzeme grupları (canlı DB gerçeği, 191).
// Geometri-paylaşan standartlar birden çok grup içerir (B36.10M karbon+paslanmaz vb.).
// Anahtar = KANONİK standart kodu; matcher (indexOf) + stdEtiket sözlüğü bu forma bağlı.
const STD_GRUP = {
  // boru
  'ASME-B36.10M': ['karbon', 'paslanmaz'],
  'ASME-B36.19M': ['paslanmaz'],
  'ASTM-B241':    ['aluminyum'],
  'DIN-2448':     ['karbon'],
  'EN-10216-1':   ['karbon'],
  'DIN-86019':    ['cunife'],
  'EEMUA-144':    ['cunife'],
  // fitting
  'ASME-B16.9':   ['karbon', 'paslanmaz'],
  'ASME-B16.11':  ['karbon'],
  'DIN-86088':    ['cunife'],
  'DIN-86089':    ['cunife'],
  'DIN-86090':    ['cunife'],
  // flanş (geometri_std — bazı satırlarda standart kolonu 'ASME-B16.5' formatında dolu)
  'B16.5':        ['karbon', 'paslanmaz'],
  'ASME-B16.5':   ['karbon', 'paslanmaz'],
  'DIN-86037-2':  ['cunife'],
  'EN-1092-1':    ['karbon', 'paslanmaz'],
  'EN-1092-3':    ['cunife'],
};

// Bir satırı denetle → { ok, sebep?, uyari? }
//   ok:false → satır YAZILMAZ (FLAG_SUPHELI gibi), sebep raporlanır.
//   uyari    → satır yazılır ama not düşülür (bilinmeyen standart vb.).
function lintSatir(row) {
  const grup = String(row.malzeme_grubu ?? '').trim();
  // Guard A — malzeme_grubu zorunlu + enum
  if (!grup) return { ok: false, sebep: 'malzeme_grubu boş (matcher grup ekseni buna bağlı)' };
  if (!GECERLI_GRUPLAR.has(grup)) {
    return { ok: false, sebep: `malzeme_grubu geçersiz: "${grup}" (geçerli: ${[...GECERLI_GRUPLAR].join('|')})` };
  }
  // Guard B — standart ↔ grup tutarlılığı (boru/fitting: standart, flanş: geometri_std)
  const std = String(row.standart ?? row.geometri_std ?? '').trim();
  if (!std) return { ok: true, uyari: 'standart/geometri_std boş → grup-tutarlılık denetlenemedi' };
  const izin = STD_GRUP[std];
  if (!izin) return { ok: true, uyari: `bilinmeyen standart "${std}" → STD_GRUP haritasına bilinçli ekle` };
  if (!izin.includes(grup)) {
    return { ok: false, sebep: `standart "${std}" ile grup "${grup}" çelişiyor (izinli: ${izin.join('|')})` };
  }
  return { ok: true };
}

// Bir satır dizisini lint'ten geçir → { gecen, reddedilen, uyarili }
function lintUygula(satirlar) {
  const gecen = [], reddedilen = [], uyarili = [];
  for (const r of satirlar) {
    const L = lintSatir(r);
    if (!L.ok) { reddedilen.push({ row: r, sebep: L.sebep }); continue; }
    if (L.uyari) uyarili.push({ row: r, uyari: L.uyari });
    gecen.push(r);
  }
  return { gecen, reddedilen, uyarili };
}

// ── Argümanlar ─────────────────────────────────────────────────────
const args = process.argv.slice(2);
const dosya = args.find(a => !a.startsWith('--'));
const YAZ = args.includes('--yaz');
const UYARI_YAZ = args.includes('--uyari-yaz');
const tabloOverride = (() => {
  const i = args.indexOf('--tablo');
  return i >= 0 ? args[i + 1] : null;
})();

if (!dosya) {
  console.error('Kullanım: node scripts/seed-from-json.mjs <dosya.json> [--yaz] [--tablo <ad>] [--uyari-yaz]');
  process.exit(1);
}
if (!fs.existsSync(dosya)) {
  console.error(`✗ Dosya bulunamadı: ${dosya}`);
  process.exit(1);
}

// ── ENV: URL + service key ─────────────────────────────────────────
// .env.local Vercel formatında; basit parse (dotenv bağımlılığı yok).
function envYukle() {
  const yollar = ['.env.local', '.env'];
  for (const y of yollar) {
    if (!fs.existsSync(y)) continue;
    for (const satir of fs.readFileSync(y, 'utf8').split('\n')) {
      const m = satir.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !(m[1] in process.env)) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    }
  }
}
envYukle();

const SUPA_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  || process.env.SUPABASE_SERVICE_KEY
  || process.env.SUPABASE_SECRET;

if (!SUPA_URL) { console.error('✗ SUPABASE_URL bulunamadı (.env.local).'); process.exit(1); }
if (!SERVICE_KEY) {
  console.error('✗ Service key bulunamadı. .env.local içinde şunlardan biri olmalı:');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=  (veya SUPABASE_SERVICE_KEY / SUPABASE_SECRET)');
  process.exit(1);
}

// ── JSON oku ───────────────────────────────────────────────────────
let doc;
try {
  doc = JSON.parse(fs.readFileSync(dosya, 'utf8'));
} catch (e) {
  console.error(`✗ JSON parse hatası: ${e.message}`);
  process.exit(1);
}

const meta = doc.meta || {};
const satirlar = Array.isArray(doc.satirlar) ? doc.satirlar : [];
const uyariSatirlar = Array.isArray(doc.uyari_satirlar) ? doc.uyari_satirlar : [];

// Tablo: --tablo > meta.tablo > tahmin (boru_olculer)
const tablo = tabloOverride || meta.tablo || 'boru_olculer';
const uniqueKey = UNIQUE_KEY[tablo];

if (!uniqueKey) {
  console.error(`✗ '${tablo}' için UNIQUE KEY tanımlı değil (script üstündeki UNIQUE_KEY haritasına ekle).`);
  console.error(`  Tanımlı tablolar: ${Object.keys(UNIQUE_KEY).filter(k => UNIQUE_KEY[k]).join(', ')}`);
  process.exit(1);
}

// ── Satırları hazırla: _ alanlarını at, TEXT-JSON kolonları stringify ──
const stringifyKolonlar = new Set(TEXT_JSON_KOLONLAR[tablo] || []);
function temizle(row) {
  const o = {};
  for (const k of Object.keys(row)) {
    if (k.startsWith('_')) continue;           // iç alanlar (_db_aksiyonu, _sanity_*, _nps) DB'ye gitmez
    let v = row[k];
    if (stringifyKolonlar.has(k) && v !== null && typeof v === 'object') {
      v = JSON.stringify(v);                    // TEXT kolon: nested obje → string
    }
    o[k] = v;
  }
  return o;
}

const yeniSatirlar = satirlar.filter(r => YENI_AKSIYONLAR.has(r._db_aksiyonu || ''));
const atlanan = satirlar.length - yeniSatirlar.length;

// ── Seed-gate lint (MK-191.1): grup/standart denetimi — reddedilen DB'ye GİRMEZ ──
const lintAna = lintUygula(yeniSatirlar);
let yazilacak = lintAna.gecen.map(temizle);

// Uyarı satırları: varsayılan dahil edilmez; --uyari-yaz ile YENI olanlar eklenir (lint dahil)
let uyariYazilan = 0;
let lintUyariEk = { reddedilen: [], uyarili: [] };
if (UYARI_YAZ) {
  const uyYeni = uyariSatirlar.filter(r => YENI_AKSIYONLAR.has(r._db_aksiyonu || ''));
  lintUyariEk = lintUygula(uyYeni);
  uyariYazilan = lintUyariEk.gecen.length;
  yazilacak = yazilacak.concat(lintUyariEk.gecen.map(temizle));
}

// Lint raporu (ana + uyarı birleşik)
const lintReddedilen = lintAna.reddedilen.concat(lintUyariEk.reddedilen);
const lintUyarili = lintAna.uyarili.concat(lintUyariEk.uyarili);

// ── Rapor başlığı ──────────────────────────────────────────────────
const host = (() => { try { return new URL(SUPA_URL).host; } catch { return SUPA_URL; } })();
console.log('────────────────────────────────────────────');
console.log(`Dosya       : ${dosya}`);
console.log(`Bağlantı    : ${host}`);
console.log(`Tablo       : ${tablo}`);
console.log(`UNIQUE KEY  : (${uniqueKey.join(', ')})`);
console.log(`Kaynak      : ${meta.kaynak || meta.kaynak_birincil || '—'}`);
console.log('────────────────────────────────────────────');
console.log(`JSON satır       : ${satirlar.length}`);
console.log(`  YENI            : ${yeniSatirlar.length}`);
console.log(`  Lint geçen      : ${lintAna.gecen.length}${UYARI_YAZ ? ` (+${lintUyariEk.gecen.length} uyarı-satır)` : ''}`);
console.log(`  Lint reddedilen : ${lintReddedilen.length} (grup/standart çelişkisi — YAZILMAZ)`);
console.log(`  Atlanan         : ${atlanan} (MEVCUT_TEYIT / FLAG_SUPHELI vb.)`);
console.log(`Uyarı satır      : ${uyariSatirlar.length}${UYARI_YAZ ? ` (${uyariYazilan} YENI dahil edildi)` : ' (dahil edilmedi — --uyari-yaz ile eklenir)'}`);
console.log(`Beta/kapsam-dışı : ${doc.kapsam_disi_oneri_beta ? 'var (dokunulmaz)' : 'yok'}`);
console.log('────────────────────────────────────────────');

// ── Lint detay raporu ──────────────────────────────────────────────
if (lintReddedilen.length || lintUyarili.length) {
  console.log('──── Seed-gate lint (MK-191.1) ────');
  if (lintReddedilen.length) {
    console.log(`  ⛔ Reddedilen (YAZILMAYACAK): ${lintReddedilen.length}`);
    lintReddedilen.slice(0, 10).forEach((x, i) => {
      const kim = uniqueKey.map(k => `${k}=${x.row[k]}`).join(', ');
      console.log(`     ${i + 1}. ${kim}  → ${x.sebep}`);
    });
    if (lintReddedilen.length > 10) console.log(`     … +${lintReddedilen.length - 10} satır daha`);
  }
  if (lintUyarili.length) {
    console.log(`  ⚠  Uyarı (yazılır): ${lintUyarili.length}`);
    [...new Set(lintUyarili.map(x => x.uyari))].slice(0, 8).forEach(u => console.log(`     • ${u}`));
  }
  console.log('───────────────────────────────────');
}

if (yazilacak.length === 0) {
  console.log('Yazılacak (lint geçen) YENI satır yok. Çıkılıyor.');
  process.exit(lintReddedilen.length ? 1 : 0);
}

// ── Check-then-insert dalı (partial UNIQUE index'li tablolar) ───────
// flansh_olculer: SELECT ile var mı bak → yoksa INSERT, varsa ATLA.
// DRY-RUN'da SELECT GERÇEKTEN yapılır (var/yok doğru raporlanır), INSERT edilmez.
if (CHECK_THEN_INSERT.has(tablo)) {
  const supa = createClient(SUPA_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const GEN_RE2 = /non-DEFAULT value into column "([^"]+)"/;
  const dusurulen2 = new Set();

  // Flanş etiketi (rapor için — DB alanı değil, anahtar alanlardan türetilir)
  function flanshEtiket(r) {
    if (r.geometri_std === 'B16.5') return `B16.5 WN Cl${r.basinc_sinifi}`;
    const t = r.flansh_tipi === 'EN-T11' ? 'EN WN PN'
            : r.flansh_tipi === 'EN-T12' ? 'EN SO PN'
            : `${r.flansh_tipi} PN`;
    return t + r.basinc_sinifi;
  }
  // UNIQUE_KEY alanlarıyla tenant-NULL SELECT (null alan → .is, dolu → .eq)
  async function varMi(r) {
    let q = supa.from(tablo).select('id').is('tenant_id', null);
    for (const k of uniqueKey) {
      const v = r[k];
      q = (v === null || v === undefined) ? q.is(k, null) : q.eq(k, v);
    }
    const { data, error } = await q.limit(1);
    if (error) throw error;
    return (data && data.length > 0);
  }

  const sonuc = [];   // { etiket, dn, aksiyon }
  let nEkle = 0, nAtla = 0, nHata = 0;

  for (const r of yazilacak) {
    const etiket = flanshEtiket(r), dn = r.cap_dn;
    let aksiyon;
    try {
      if (await varMi(r)) {
        aksiyon = YAZ ? 'ATLANDI' : 'ATLANACAK';
        nAtla++;
      } else if (!YAZ) {
        aksiyon = 'EKLENECEK';
        nEkle++;
      } else {
        // gerçek INSERT (generated-kolon hatasında kolonu düşür, tekrar dene)
        let payload = { ...r };
        let deneme = 6, ok = false, sonHata = null;
        while (deneme-- > 0) {
          const { error } = await supa.from(tablo).insert(payload);
          if (!error) { ok = true; break; }
          const m = error.message.match(GEN_RE2);
          if (m) {
            const kol = m[1];
            if (!dusurulen2.has(kol)) {
              dusurulen2.add(kol);
              console.log(`  ℹ  '${kol}' generated kolon — düşürülüp tekrar deneniyor.`);
            }
            delete payload[kol];
            continue;
          }
          sonHata = error; break;
        }
        if (ok) { aksiyon = 'EKLENDI'; nEkle++; }
        else { aksiyon = `HATA(${sonHata ? sonHata.message : 'bilinmeyen'})`; nHata++; }
      }
    } catch (e) {
      aksiyon = `HATA(${e.message})`; nHata++;
    }
    sonuc.push({ etiket, dn, aksiyon });
  }

  // Satır başına rapor tablosu
  console.log(`\n${YAZ ? '✍  YAZMA' : '🔍 DRY-RUN (INSERT yok, SELECT gerçek)'} — ${tablo}\n`);
  console.log('  etiket'.padEnd(18) + 'DN'.padStart(5) + '   aksiyon');
  console.log('  ' + '-'.repeat(48));
  for (const s of sonuc) {
    console.log('  ' + s.etiket.padEnd(16) + String(s.dn).padStart(5) + '   ' + s.aksiyon);
  }
  console.log('  ' + '-'.repeat(48));
  const ekleEt = YAZ ? 'EKLENDI' : 'EKLENECEK';
  const atlaEt = YAZ ? 'ATLANDI' : 'ATLANACAK';
  console.log(`\nSonuç: ${nEkle} ${ekleEt}, ${nAtla} ${atlaEt}(zaten var), ${nHata} HATA, ${lintReddedilen.length} lint-reddi.`);
  if (!YAZ) console.log(`\nGerçek yazmak için: node ${process.argv[1].split('/').pop()} ${dosya} --yaz`);
  console.log('────────────────────────────────────────────');
  process.exit(nHata > 0 ? 1 : 0);
}

// ── DRY-RUN ────────────────────────────────────────────────────────
if (!YAZ) {
  console.log('🔍 DRY-RUN (hiçbir şey yazılmadı). İlk 5 satır önizleme:\n');
  yazilacak.slice(0, 5).forEach((r, i) => {
    const kimlik = uniqueKey.map(k => `${k}=${r[k]}`).join(', ');
    const agr = (r.agirlik_kg ?? r.agirlik_kg_m ?? '—');
    console.log(`  ${i + 1}. ${kimlik}  | kg=${agr}`);
  });
  if (yazilacak.length > 5) console.log(`  … +${yazilacak.length - 5} satır daha`);
  console.log(`\nGerçek yazmak için: node ${process.argv[1].split('/').pop()} ${dosya} --yaz`);
  process.exit(0);
}

// ── GERÇEK YAZMA (upsert) ──────────────────────────────────────────
const supa = createClient(SUPA_URL, SERVICE_KEY, { auth: { persistSession: false } });

// GENERATED kolonlara (et_min_mm, et_max_mm, ic_cap_mm gibi) değer yazılamaz.
// Hardcode etmek yerine: upsert hata verirse hatadaki kolonu okuyup düşür, tekrar dene.
// "cannot insert a non-DEFAULT value into column \"X\"" → X'i yakala.
const GEN_RE = /non-DEFAULT value into column "([^"]+)"/;
const dusurulen = new Set();

function kolonDusur(satirlar, kolon) {
  return satirlar.map(r => { const o = { ...r }; delete o[kolon]; return o; });
}

const BATCH = 50;
let eklenenToplam = 0, hata = 0;

console.log(`✍  Yazılıyor (${yazilacak.length} satır, batch=${BATCH}, upsert onConflict=${uniqueKey.join(',')})…\n`);

for (let i = 0; i < yazilacak.length; i += BATCH) {
  let dilim = yazilacak.slice(i, i + BATCH);
  let denemeKaldi = 6;  // en fazla 6 generated kolon düşürme denemesi
  while (denemeKaldi-- > 0) {
    const { data, error } = await supa
      .from(tablo)
      .upsert(dilim, { onConflict: uniqueKey.join(','), ignoreDuplicates: false })
      .select();
    if (!error) {
      eklenenToplam += (data ? data.length : dilim.length);
      console.log(`  ✓ Batch ${i + 1}-${i + dilim.length} yazıldı (${data ? data.length : dilim.length})`);
      break;
    }
    // Generated kolon hatası mı? Kolonu düşürüp tekrar dene.
    const m = error.message.match(GEN_RE);
    if (m) {
      const kolon = m[1];
      if (!dusurulen.has(kolon)) {
        dusurulen.add(kolon);
        console.log(`  ℹ  '${kolon}' generated kolon — düşürülüp tekrar deneniyor (DB hesaplayacak).`);
      }
      dilim = kolonDusur(dilim, kolon);
      // sonraki batch'ler de aynı kolonu içermesin diye kalan veriyi de temizle
      for (let j = i + BATCH; j < yazilacak.length; j++) delete yazilacak[j][kolon];
      continue;
    }
    // Başka bir hata: pes et, raporla.
    hata += dilim.length;
    console.error(`  ✗ Batch ${i}-${i + dilim.length}: ${error.message}`);
    break;
  }
}

console.log('────────────────────────────────────────────');
console.log(`Sonuç: ${eklenenToplam} satır yazıldı/güncellendi, ${hata} hata, ${lintReddedilen.length} lint-reddi.`);
console.log('────────────────────────────────────────────');
process.exit(hata > 0 ? 1 : 0);
