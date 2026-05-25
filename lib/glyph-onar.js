'use strict';

// ============================================================================
// glyph-onar.js — Katman 0 (EVRENSEL) glyph ön-işleme (oturum 121 + 122)
// ----------------------------------------------------------------------------
// Kılavuz Bölüm 4: Katman 0 = "halüsinasyon korumaları / ön-işleme". Bu modül
// metin ÇIKARIM SINIRINDA (fingerprint skorlama + L2 parse ÖNÜNDE) çalışır,
// aile-bağımsızdır. Saf fonksiyon: yan etki yok, DB yok, AI yok.
//
// SORUN (oturum 120 bulgusu, MK-120.3): Bazı Cadmatic export'ları (NB1137) gömülü
// fontta her ASCII karakteri -29 KAYDIRIYOR (deterministik Sezar). pdf-parse v1.1.1
// kaymalı metin döndürür → çapalar görünmez → L2 fail → L3. Onarım L2'yi açar.
//
// İKİ BANT (oturum 121 ölçümü + oturum 122 çözümü):
//   • BANT A (büyük harf + rakam + noktalama): glyph = gerçek + 29, printable→
//     printable. -29 geri kaydırma TAM çözer. (SPOOL NAME, pipe_no E100-817-005,
//     tarih 12-02-26, -S01, B1137 → hepsi temiz.) → onar29().
//   • BANT B (küçük harf + Türkçe): pdf-parse glyph kodlarını font cmap'i üzerinden
//     Latin-1/Türkçe'ye (0xC0+) çevirmiş; aritmetik DEĞİL, ters tablo gerektirir.
//     OTURUM 122'de 8 glyph spool PDF'inden (M130/M110/E100/Y200) sıkı satır
//     hizalama + bootstrap ile 28 karakterlik ters tablo çıkarıldı, MK-96 çapraz
//     doğrulandı (her kod ≥2 bağımsız PDF'te tutarlı). → bandBOnar().
//
// GLYPH != DİL (MK-122 ilkesi): Bu katman bir font/encoding düzeltmesidir, çeviri
// DEĞİLDİR. Ters tablo kaynak metni hangi dilde yazıldıysa o dilde geri verir.
// Tablodaki harfler (b,c,d... ä,ç,ş) Türkçe'ye özgü değil, fontun glyph'leridir.
// Dil ayrımı L2 PARSE katmanında olur (tetikleyici sözlüğü), burada DEĞİL.
//
// GÜVENLİK — onarım KAPILIDIR: yalnızca ham metinde çapa YOK ama -29-onarılmış
// metinde çapa VARSA uygulanır (MK-121.1). Band-B SADECE band-A açıldıysa çalışır;
// böylece TEMİZ PDF'lerdeki gerçek Türkçe karakterler (ç, ş...) ASLA remap edilmez.
// (Ölçüm kanıtı: kapısız onarım tüm TEMİZ PDF'leri bozdu.)
// ============================================================================

// Bant-A kurtarılabilir çapalar: tümü-büyük harf/rakam/noktalama. -29 sonrası
// görünür. Cadmatic-Tersan iskeleti (Bölüm 5.1).
const CAPA_TOKENLAR = [
  'SPOOL NAME',
  'PART NUMBER',
  'WELDING NUMBER',
  'CUT NUMBER',
];

// ----------------------------------------------------------------------------
// BANT-B ters tablosu (oturum 122, MK-96 çapraz doğrulandı — 8 PDF, ≥2 tutarlı).
// Anahtar = glyph karakteri (pdf-parse v1.1.1 çıktısı), değer = gerçek karakter.
// Şifre yapısı: gerçek harf +29 → font cmap → Latin-1/Türkçe glyph.
// ----------------------------------------------------------------------------
const BANT_B_TABLO = {
  // büyük Latin-1 bandı → küçük harf
  'Ä': 'b', 'Å': 'c', /* 'Ç' çakışmalı, aşağıda özel */ 'É': 'e',
  'Ñ': 'f', 'Ö': 'g', 'Ü': 'h',
  // küçük Latin-1 bandı → küçük harf
  'á': 'i', 'â': 'k', 'ã': 'm', 'ä': 'l', 'å': 'n', /* 'ç' çakışmalı, özel */
  'é': 'p', 'ê': 'r', 'ë': 's', 'ì': 'u', 'í': 't', 'î': 'v', 'ï': 'w',
  'ò': 'z', 'ó': 'y',
  // özel eşlemeler
  'ñ': 'x',   // BOYUT AYIRACI: "139.7x4.5" (gerçek 'x' → ñ)
  'ć': 'ü',   // "Düz", "Redüksiyon"
  // Türkçe identity (font karakteri kendine render ediyor) + sigma
  'ğ': 'ğ', 'ş': 'ş', 'ı': 'ı',
  'σ': 'ı',   // U+03C3 sigma → ı ("Ağırlık" → Ağσrlık)
  '°': '°',   // U+00B0 derece — identity ("45°" açı), MK-96 teyitli, false-flag önler
};

// ÇAKIŞMA KODLARI (MK-122): bir küçük harfin glyph'i, gerçek bir Türkçe
// karakterin identity-render değeriyle AYNI kodpoint. Çoğunluk yönüne çözülür,
// band_b_meta'da işaretlenir (MK-96 — sessiz bozma yok).
//   • 'Ç' (U+00C7): çoğunluk 'd' (Adet/Düz/Detay) — gerçek 'Ç' (Çelik) az.
//       KURTARMA (B): kelime-başı + ardı küçük harf ise → 'Ç' (Türkçe imla:
//       büyük harf yalnız kelime başında; "delik" diye terim yok). Aksi → 'd'.
//   • 'ç' (U+00E7): çoğunluk 'o' (Boru/Boyut/No) — gerçek 'ç' yalnız "Açıklama"
//       başlığında (veri değil, kozmetik). Kelime-içi konum 'o'/'ç' ayırt
//       edilemediğinden DAİMA 'o'.
const CAKISMA = { 'Ç': 'd', 'ç': 'o' };

// Harf mi? (kelime-sınırı tespiti için: ASCII harf veya band-B/Türkçe = harf;
// rakam/boşluk/noktalama/satırsonu = sınır.)
function harfMi(ch) {
  if (!ch) return false;
  const c = ch.codePointAt(0);
  if ((c >= 0x41 && c <= 0x5a) || (c >= 0x61 && c <= 0x7a)) return true; // ASCII harf
  if (c >= 0x80) return true; // band-B / Türkçe glyph hep harf
  return false;
}

// Bu karakter (band-B onarımı sonrası) küçük harfe mi düşer?
// Tablodaki TÜM band-B değerleri küçük harftir; ASCII a-z de küçük.
function kucukHarfeMi(ch) {
  if (!ch) return false;
  if (BANT_B_TABLO[ch] !== undefined) return true;       // band-B → daima küçük
  if (CAKISMA[ch] !== undefined) return true;            // 'ç'→o, 'Ç'→d/Ç (küçük say)
  const c = ch.codePointAt(0);
  return c >= 0x61 && c <= 0x7a;                          // ASCII küçük
}

// Her karakteri -29 geri kaydır; SADECE sonuç printable ASCII'ye (0x20-0x7e)
// düşerse. Aksi halde karakter OLDUĞU GİBİ bırakılır (band B'ye dokunma).
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

// Band-B onarımı. GİRDİ band-A-onarılmış metin OLMALI (band-A kapısı açıldıysa).
// Döner: { metin, cakisma, ce_kurtarma, eslenmeyen }.
//   cakisma     — çakışmalı kod (Ç/ç) görüldü mü (belirsizlik çözüldü).
//   ce_kurtarma — kaç kez kelime-başı 'Ç' kurtarıldı.
//   eslenmeyen  — tabloda OLMAYAN band-B karakterleri (örn. ö); MK-96 flag'i,
//                 sessizce bozulmaz, olduğu gibi bırakılır + raporlanır.
function bandBOnar(text) {
  if (typeof text !== 'string' || text.length === 0) {
    return { metin: text, cakisma: false, ce_kurtarma: 0, eslenmeyen: [] };
  }
  const chars = [...text];
  const eslenmeyenSet = new Set();
  let cakisma = false;
  let ceKurtarma = 0;
  let out = '';

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];

    // 1) Düz tablo
    if (BANT_B_TABLO[ch] !== undefined) { out += BANT_B_TABLO[ch]; continue; }

    // 2) Çakışmalı 'Ç' (U+00C7): kelime-başı + ardı küçük harf → 'Ç', aksi → 'd'
    if (ch === 'Ç') {
      cakisma = true;
      const prev = i > 0 ? chars[i - 1] : '';
      const next = i + 1 < chars.length ? chars[i + 1] : '';
      const kelimeBasi = (i === 0) || !harfMi(prev);
      if (kelimeBasi && kucukHarfeMi(next)) { out += 'Ç'; ceKurtarma++; }
      else { out += 'd'; }
      continue;
    }

    // 3) Çakışmalı 'ç' (U+00E7): daima 'o'
    if (ch === 'ç') { cakisma = true; out += 'o'; continue; }

    // 4) Band-B aralığında AMA tabloda yok (örn. ö, °): dokunma + işaretle
    const c = ch.codePointAt(0);
    if (c >= 0x80) { eslenmeyenSet.add(ch); out += ch; continue; }

    // 5) ASCII / band-A zaten onarılmış: olduğu gibi
    out += ch;
  }

  return {
    metin: out,
    cakisma,
    ce_kurtarma: ceKurtarma,
    eslenmeyen: [...eslenmeyenSet],
  };
}

// Metinde bant-A çapalarından en az biri geçiyor mu?
function capaVar(text) {
  if (typeof text !== 'string' || !text) return false;
  return CAPA_TOKENLAR.some(t => text.includes(t));
}

// KAPILI normalizasyon. Döner: { metin, glyph_band_a, glyph_band_b, durum, band_b_meta }.
//   'temiz'                 — ham metinde çapa var → DOKUNULMADI (regresyonsuz).
//                             Band-B ÇALIŞMAZ (gerçek Türkçe karakterler korunur).
//   'glyph_band_a_onarildi' — ham'da çapa yok ama -29-onarılmışta var → band-A
//                             ONARILDI, ardından band-B uygulandı (glyph_band_b=true).
//   'capa_yok'              — ikisinde de yok (bilinmeyen/raster) → DOKUNULMADI,
//                             doğal L3 akışı (MK-119.3: glyph != format).
//   'bos'                   — metin boş/yok.
// band_b_meta yalnızca glyph_band_b=true iken anlamlı: { cakisma, ce_kurtarma,
//   eslenmeyen } — MK-96 belirsizlik izi; çağıran _l2_meta'ya katabilir.
function metinNormalle(text) {
  if (typeof text !== 'string' || text.length === 0) {
    return { metin: text, glyph_band_a: false, glyph_band_b: false, durum: 'bos', band_b_meta: null };
  }
  // Ham metinde çapa varsa zaten temiz — ASLA onarma (kapı). Band-B de ÇALIŞMAZ.
  if (capaVar(text)) {
    return { metin: text, glyph_band_a: false, glyph_band_b: false, durum: 'temiz', band_b_meta: null };
  }
  // Ham'da yok: -29 dene. Çapayı AÇIYORSA glyph kaymasıdır → band-A + band-B.
  const bandA = onar29(text);
  if (capaVar(bandA)) {
    const b = bandBOnar(bandA);
    return {
      metin: b.metin,
      glyph_band_a: true,
      glyph_band_b: true,
      durum: 'glyph_band_a_onarildi',  // GERİYE UYUM: band-A tetikleyici/onarım (oturum 121
                                       // T8.3 + bağımlı kod bunu bekler). Band-B ek katman
                                       // glyph_band_b + band_b_meta ile sinyallenir (additive).
      band_b_meta: { cakisma: b.cakisma, ce_kurtarma: b.ce_kurtarma, eslenmeyen: b.eslenmeyen },
    };
  }
  // Onarım çapa AÇMADI → metni bozma; olduğu gibi bırak (doğal L3).
  return { metin: text, glyph_band_a: false, glyph_band_b: false, durum: 'capa_yok', band_b_meta: null };
}

export { onar29, capaVar, bandBOnar, metinNormalle, CAPA_TOKENLAR, BANT_B_TABLO, CAKISMA };
export default { onar29, capaVar, bandBOnar, metinNormalle, CAPA_TOKENLAR, BANT_B_TABLO, CAKISMA };
