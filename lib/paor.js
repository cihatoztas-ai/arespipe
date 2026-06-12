'use strict';

// ============================================================================
// lib/paor.js — PAOR / AVEVA aile paketi (oturum 180)
// ----------------------------------------------------------------------------
// "BOM Excel'de yaşar" ailesi. PDF parse YOK, AI YOK, $0.
// Kaynak katmanlar:  Isometric_View.pdf (kimlik, metin)  +  *.xlsx (BOM)
// Ana vektör -A.pdf parse EDİLMEZ → görsel belge olarak iliştirilir (L3'e GİTMEZ).
// Hedef tablo: pipeline_malzemeleri (mevcut; şema değişmez; tür/tip kolonu YOK →
//   boru/fitting hangi alan dolu olduğuyla kodlanır: boru→boy_mm, fitting→adet).
//
// KANIT: 7 gerçek PAOR çizimi → 74 satır, 0 tanınmayan bileşen, 0 eksik çekirdek.
//   DN→OD lookup çizimdeki SLEEVE Ø değerleriyle doğrulandı (Ø60.3=DN50 vb.).
// MK-119.x ailesiyle uyumlu: izometri-oku.js'e dokunmaz, recognition-only kayıt.
// Faz 2 (Pro/OCR sonrası): title-block SPOOL[1][2] + CUT-LENGTHS → spool bölme.
// Faz 1.5: agirlik_kg → K2 kütüphane türetimi (DN+et+standart anahtarı hazır).
// ============================================================================

// DIN 2448 / EN 10220 — DN → dış çap (mm)
export const DN_OD = {
  15: 21.3, 20: 26.9, 25: 33.7, 32: 42.4, 40: 48.3, 50: 60.3, 65: 76.1,
  80: 88.9, 100: 114.3, 125: 139.7, 150: 168.3, 200: 219.1, 250: 273.0, 300: 323.9
};

// PAOR tanıma parmak izi (MK-152.1 içerik-öncelikli). Recognition-only.
//   xlsx başlık tokenları (ERP imzası) + iso-view metin tokenları + dosya adı öneki.
export const PAOR_SESELICI = {
  xlsx_baslik_token: ['DPN', 'Part Name', 'Make/Buy', 'Type of Certificate'],
  iso_metin_token:   ['MODEL REFERENCE PIPE NO', 'DESIGN DRAWING NO'],
  dosya_oneki:       /^11D-PAOR-/i,
  kanal:             'excel_bom'   // L3 DEĞİL
};

// malzeme stringi → [ARES_NORM kodu, kalite]
function malzemeKod(s) {
  s = (s || '').toUpperCase();
  if (/\b3\d{2}L?\b/.test(s))          return ['paslanmaz', (s.match(/\b3\d{2}L?\b/) || [null])[0]];
  if (/GGG\s?40(\.\d)?/.test(s))       return ['diger',     (s.match(/GGG\s?40(?:\.\d)?/) || [null])[0]]; // sfero döküm
  if (/KLINGRIT|NBR|ARAMID/.test(s))   return ['diger',     'NBR/Aramid'];                                 // conta
  if (/\bST\s?37\b|\bSTEEL\b/.test(s)) return ['karbon',    (s.match(/ST\s?37(?:\.\d)?/) || ['ST37'])[0].replace(/\s/, '')];
  if (/GALVANIZED|GALVANIZ/.test(s))   return ['karbon',    null];                                          // galvaniz çelik (galvaniz=yüzey)
  return ['diger', null];
}

// Part Name → alanlar.  ÖRN: "PIPE SEAMLESS ST37 DIN 2448 DN125 T:4.5 MM"
export function partNameParse(partName) {
  const U = (partName || '').trim().toUpperCase();
  const o = {
    tanim: (partName || '').trim(), bilesen: null, tur: null,
    malzeme: null, kalite: null, standart: null,
    dn: null, dn2: null, dis_cap_mm: null, et_mm: null, et2_mm: null,
    pn: null, sertifikali: false, bayrak: []
  };

  const COMP = [
    [/^PIPE\b/, 'PIPE', 'boru'], [/^ELBOW\b/, 'ELBOW', 'fitting'],
    [/^FLANGE\b/, 'FLANGE', 'fitting'], [/^REDUCER\b/, 'REDUCER', 'fitting'],
    [/^SLEEVE\b/, 'SLEEVE', 'fitting'], [/^DOUBLER\b/, 'DOUBLER', 'fitting'],
    [/^STRAINER\b/, 'STRAINER', 'fitting'], [/^GASKET\b/, 'GASKET', 'fitting'],
    [/^VALVE\b/, 'VALVE', 'fitting'], [/^U-?BOLT\b/, 'U-BOLT', 'fitting'],
    [/^BOLT\b/, 'BOLT', 'fitting'], [/^NUT\b/, 'NUT', 'fitting'], [/^WASHER\b/, 'WASHER', 'fitting']
  ];
  for (const [re, b, t] of COMP) { if (re.test(U)) { o.bilesen = b; o.tur = t; break; } }
  if (!o.bilesen) o.bayrak.push('BILESEN_TANINMADI'); // B-6: sessizce düşürme, işaretle

  if (/CERTIFICATED/.test(U)) o.sertifikali = true;

  const [mk, kal] = malzemeKod(U); o.malzeme = mk; o.kalite = kal;

  const std = U.match(/\b(DIN|EN)\s?\d{2,4}(?:-\d)?(?:-[A-Z])?\b/);
  if (std) o.standart = std[0].replace(/(DIN|EN)\s?/, '$1 ');

  const dnP = U.match(/DN(\d+)\s*X\s*DN(\d+)/);                 // redüktör DNxxXDNyy
  if (dnP) { o.dn = +dnP[1]; o.dn2 = +dnP[2]; }
  else { const dn = U.match(/\bDN(\d+)\b/); if (dn) o.dn = +dn[1]; }

  const odEx = U.match(/Ø\s?(\d+(?:\.\d+)?)/);
  const odStr = U.match(/\b(\d+\.\d+)\s?X\s?(\d+(?:\.\d+)?)\s?MM/); // STRAINER "114.3X8"
  if (odEx) o.dis_cap_mm = +odEx[1];
  else if (o.bilesen === 'STRAINER' && odStr) { o.dis_cap_mm = +odStr[1]; o.et_mm = +odStr[2]; }
  else if (o.dn != null && DN_OD[o.dn] != null) o.dis_cap_mm = DN_OD[o.dn];

  if (o.et_mm == null) {
    const tP = U.match(/T:\s?(\d+(?:\.\d+)?)\s?X\s?(\d+(?:\.\d+)?)/);
    const t = U.match(/T:\s?(\d+(?:\.\d+)?)/);
    if (tP) { o.et_mm = +tP[1]; o.et2_mm = +tP[2]; }
    else if (t) o.et_mm = +t[1];
  }

  const pnM = U.match(/\bPN\s?(\d+(?:-\d+)?)/); if (pnM) o.pn = pnM[1];
  return o;
}

// Isometric_View metninden kimlik. pipeline_no = MODEL REFERENCE PIPE NO
// (hattın kimliği; kabuk/SPOOLS.pipeline ile AYNI yazımı kullanmalı — eşleşme anahtarı).
export function kimlikCoz(isoMetin) {
  const t = isoMetin || '';
  const pipe = (t.match(/MODEL REFERENCE PIPE NO:\s*(.+)/i) || [])[1];
  const draw = (t.match(/DESIGN DRAWING NO:\s*(.+)/i) || [])[1];
  return { pipeline_no: pipe ? pipe.trim() : null, drawing_no: draw ? draw.trim() : null };
}

// Tek BOM satırı + kimlik → pipeline_malzemeleri satırı (GERÇEK kolonlar; 'tur' YAZILMAZ).
// bomSatir: { partName, dpn, unit, qty, cert }
export function bomSatirToMalzeme(bomSatir, kimlik, ortak) {
  ortak = ortak || {};
  const p = partNameParse(bomSatir.partName);
  const isPipe = p.tur === 'boru' || String(bomSatir.unit || '').toUpperCase() === 'M';
  let q = parseFloat(String(bomSatir.qty == null ? '' : bomSatir.qty).replace(',', '.'));
  if (isNaN(q)) q = null;
  return {
    tenant_id: ortak.tenant_id || null,
    devre_id: ortak.devre_id || null,
    kaynak_dokuman_id: ortak.kaynak_dokuman_id || null, // provenans (PAOR Excel/çizim belgesi)
    pipeline_no: kimlik ? kimlik.pipeline_no : null,
    kod: bomSatir.dpn || null,
    tanim: p.tanim,
    malzeme: p.malzeme,
    kalite: p.kalite,
    dis_cap_mm: p.dis_cap_mm,
    et_mm: p.et_mm,
    boy_mm: (isPipe && q != null) ? Math.round(q * 1000) : null, // Unit=M → mm (pipeline toplamı)
    adet:   (!isPipe && q != null) ? q : null,                    // Unit=EA
    agirlik_kg: null,        // Faz 1.5: K2 kütüphane türetimi
    sertifikali: p.sertifikali,
    _bayrak: p.bayrak        // B-6 izlenebilirlik (DB'ye yazılmaz; onay UI gösterir)
  };
}

// Tüm BOM → pipeline_malzemeleri satır dizisi
export function convert(bomSatirlar, kimlik, ortak) {
  return (bomSatirlar || []).map(r => bomSatirToMalzeme(r, kimlik, ortak));
}

export default { DN_OD, PAOR_SESELICI, partNameParse, kimlikCoz, bomSatirToMalzeme, convert };
