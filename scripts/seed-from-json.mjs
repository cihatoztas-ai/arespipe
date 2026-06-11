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
//   - Sadece _db_aksiyonu IN (YENI_DN, YENI_SCH, YENI_SCH_KOMB) satırları yazılır.
//   - MEVCUT_TEYIT atlanır (zaten DB'de).
//   - _ ile başlayan iç alanlar (_db_aksiyonu, _sanity_*) DB'ye gönderilmez.
//   - upsert + onConflict=UNIQUE_KEY → idempotent: var olan satır BOZULMAZ, eksik eklenir.
//   - uyari_satirlar: not amaçlı, varsayılan YAZILMAZ (zaten MEVCUT_TEYIT olabilir);
//     --uyari-yaz verilirse YENI olanları da yazar.
//   - kapsam_disi_oneri_beta: HİÇ dokunulmaz.

import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// ── Tablo → UNIQUE KEY eşlemesi (onConflict için) ──────────────────
// DB'den teyit edilen gerçek unique constraint'ler. Yeni tablo eklenirse buraya yaz.
const UNIQUE_KEY = {
  boru_olculer:   ['standart', 'malzeme_grubu', 'dn', 'schedule_tipi', 'schedule_deger'],
  // fitting/flansh için constraint'ler eklenince doldurulacak (şimdilik boru kanıtlı):
  fitting_olculer: null,
  flansh_olculer:  null,
};

const YENI_AKSIYONLAR = new Set(['YENI_DN', 'YENI_SCH', 'YENI_SCH_KOMB']);

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

// ── Satırları hazırla: _ alanlarını at, YENI olanları seç ──────────
function temizle(row) {
  const o = {};
  for (const k of Object.keys(row)) {
    if (k.startsWith('_')) continue;           // iç alanlar (_db_aksiyonu, _sanity_*) DB'ye gitmez
    o[k] = row[k];
  }
  return o;
}

const yeniSatirlar = satirlar.filter(r => YENI_AKSIYONLAR.has(r._db_aksiyonu || ''));
const atlanan = satirlar.length - yeniSatirlar.length;

let yazilacak = yeniSatirlar.map(temizle);

// Uyarı satırları: varsayılan dahil edilmez; --uyari-yaz ile YENI olanlar eklenir
let uyariYazilan = 0;
if (UYARI_YAZ) {
  const uy = uyariSatirlar.filter(r => YENI_AKSIYONLAR.has(r._db_aksiyonu || '')).map(temizle);
  uyariYazilan = uy.length;
  yazilacak = yazilacak.concat(uy);
}

// ── Rapor başlığı ──────────────────────────────────────────────────
const host = (() => { try { return new URL(SUPA_URL).host; } catch { return SUPA_URL; } })();
console.log('────────────────────────────────────────────');
console.log(`Dosya       : ${dosya}`);
console.log(`Bağlantı    : ${host}`);
console.log(`Tablo       : ${tablo}`);
console.log(`UNIQUE KEY  : (${uniqueKey.join(', ')})`);
console.log(`Kaynak      : ${meta.kaynak || '—'}`);
console.log('────────────────────────────────────────────');
console.log(`JSON satır       : ${satirlar.length}`);
console.log(`  YENI (yazılacak): ${yeniSatirlar.length}`);
console.log(`  MEVCUT (atlandı): ${atlanan}`);
console.log(`Uyarı satır      : ${uyariSatirlar.length}${UYARI_YAZ ? ` (${uyariYazilan} YENI dahil edildi)` : ' (dahil edilmedi — --uyari-yaz ile eklenir)'}`);
console.log(`Beta/kapsam-dışı : ${doc.kapsam_disi_oneri_beta ? 'var (dokunulmaz)' : 'yok'}`);
console.log('────────────────────────────────────────────');

if (yazilacak.length === 0) {
  console.log('Yazılacak YENI satır yok. Çıkılıyor.');
  process.exit(0);
}

// ── DRY-RUN ────────────────────────────────────────────────────────
if (!YAZ) {
  console.log('🔍 DRY-RUN (hiçbir şey yazılmadı). İlk 5 satır önizleme:\n');
  yazilacak.slice(0, 5).forEach((r, i) => {
    const kimlik = uniqueKey.map(k => `${k}=${r[k]}`).join(', ');
    console.log(`  ${i + 1}. ${kimlik}  | OD=${r.dis_cap_mm} et=${r.et_mm} kg/m=${r.agirlik_kg_m}`);
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
console.log(`Sonuç: ${eklenenToplam} satır yazıldı/güncellendi, ${hata} hata.`);
console.log('────────────────────────────────────────────');
process.exit(hata > 0 ? 1 : 0);
