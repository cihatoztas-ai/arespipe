'use strict';

// ============================================================================
// glyph-onar.js — Katman 0 (EVRENSEL) glyph ön-işleme (oturum 121)
// ----------------------------------------------------------------------------
// Kılavuz Bölüm 4: Katman 0 = "halüsinasyon korumaları / ön-işleme". Bu modül
// metin ÇIKARIM SINIRINDA (fingerprint skorlama + L2 parse ÖNÜNDE) çalışır,
// aile-bağımsızdır. Saf fonksiyon: yan etki yok, DB yok, AI yok.
//
// SORUN (oturum 120 bulgusu, MK-120.3): Bazı Cadmatic export'ları (NB1137) gömülü
// fontta her ASCII karakteri -29 KAYDIRIYOR (deterministik Sezar). pdf-parse v1.1.1
// kaymalı metin döndürür → çapalar görünmez → L2 fail → L3. Onarım L2'yi açar.
//
// BANT AYRIMI (oturum 121 ölçümü — ÖNEMLİ):
//   • BANT A (büyük harf + rakam + noktalama): glyph = gerçek + 29, printable→
//     printable. -29 geri kaydırma TAM çözer. (SPOOL NAME, pipe_no E100-817-005,
//     tarih 12-02-26, -S01, B1137 → hepsi temiz.)
//   • BANT B (küçük harf + Türkçe): pdf-parse glyph kodlarını (0x80-0x97) font
//     cmap'i üzerinden Latin-1'e (0xC0+) çevirmiş; aritmetik DEĞİL, ters tablo
//     gerektirir, font-kapsamlı. Bu modül BANT B'ye DOKUNMAZ (kg/Türkçe terimler
//     onarılmadan kalır). → NB1137 montaj L2'ye geçer; NB1137 spool malzeme tablosu
//     (küçük-harf tetikleyiciler) HÂLÂ L3'te kalır. Bant B kendi oturumunu bekliyor
//     (tam harita + MK-96 çapraz doğrulama). "Tam onarıldı" diye VARSAYMA.
//
// GÜVENLİK — onarım KAPILIDIR: yalnızca ham metinde çapa YOK ama -29-onarılmış
// metinde çapa VARSA uygulanır. (Ölçüm kanıtı: kapısız -29 tüm TEMİZ PDF'leri bozdu.)
// Bu yüzden çapa kümesi BANT A'da kurtarılabilen TÜMÜ-BÜYÜK token'lardan seçilir
// (Cadmatic iskeleti, kılavuz Bölüm 5.1 — 15/15 sabit). "Drawing symbols" /
// "Malzeme Listesi" / "Continue:" küçük harf taşıdığı için çapa DEĞİLDİR.
// ============================================================================

// Bant-A kurtarılabilir çapalar: tümü-büyük harf/rakam/noktalama. -29 sonrası
// görünür. Cadmatic-Tersan iskeleti (Bölüm 5.1). Çapraz-aile genişletilebilir
// (ZONE: / PART NUMBER A2'de de büyük) ama doğrulanmış veriden seçildi.
const CAPA_TOKENLAR = [
  'SPOOL NAME',
  'PART NUMBER',
  'WELDING NUMBER',
  'CUT NUMBER',
];

// Her karakteri -29 geri kaydır; SADECE sonuç printable ASCII'ye (0x20-0x7e)
// düşerse. Aksi halde karakter OLDUĞU GİBİ bırakılır (bant B'ye dokunma).
function onar29(text) {
  if (typeof text !== 'string' || text.length === 0) return text;
  let out = '';
  for (const ch of text) {
    const c = ch.codePointAt(0);
    const r = c - 29;
    out += (r >= 0x20 && r <= 0x7e) ? String.fromCharCode(r) : ch;
  }
  return out;
}

// Metinde bant-A çapalarından en az biri geçiyor mu?
function capaVar(text) {
  if (typeof text !== 'string' || !text) return false;
  return CAPA_TOKENLAR.some(t => text.includes(t));
}

// KAPILI normalizasyon. Döner: { metin, glyph_band_a, durum }.
//   'temiz'                 — ham metinde çapa var → DOKUNULMADI (regresyonsuz).
//   'glyph_band_a_onarildi' — ham'da çapa yok ama -29-onarılmışta var → onarıldı.
//   'capa_yok'              — ikisinde de yok (bilinmeyen/raster) → DOKUNULMADI,
//                             doğal L3 akışı (MK-119.3: glyph != format).
//   'bos'                   — metin boş/yok.
function metinNormalle(text) {
  if (typeof text !== 'string' || text.length === 0) {
    return { metin: text, glyph_band_a: false, durum: 'bos' };
  }
  // Ham metinde çapa varsa zaten temiz — ASLA onarma (kapı).
  if (capaVar(text)) {
    return { metin: text, glyph_band_a: false, durum: 'temiz' };
  }
  // Ham'da yok: -29 dene. Çapayı AÇIYORSA bant-A glyph kaymasıdır.
  const onarilmis = onar29(text);
  if (capaVar(onarilmis)) {
    return { metin: onarilmis, glyph_band_a: true, durum: 'glyph_band_a_onarildi' };
  }
  // Onarım çapa AÇMADI → metni bozma; olduğu gibi bırak (doğal L3).
  return { metin: text, glyph_band_a: false, durum: 'capa_yok' };
}

export { onar29, capaVar, metinNormalle, CAPA_TOKENLAR };
export default { onar29, capaVar, metinNormalle, CAPA_TOKENLAR };
