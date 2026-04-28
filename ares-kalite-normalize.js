// =====================================================================
// ares-kalite-normalize.js
// =====================================================================
// 42. oturum -- AI Standart Çıkarımı altyapısı
//
// AMAC: Kalite kodu yazim varyasyonlarini tek forma indirger.
//   "A106 Gr.B"        -> "A106GRB"
//   "A 106 Grade B"    -> "A106GRB"
//   "ASTM A106 Gr.B"   -> "A106GRB"
//   "ST-37" / "St37"   -> "ST37"
//   "TP 316L"          -> "TP316L"
//
// KULLANIM:
//   - Backend (Vercel Node, izometri-oku.js):
//       import '../ares-kalite-normalize.js';
//       const K = globalThis.ARES_KALITE;
//       const norm = K.normalize('A106 Gr.B');  // "A106GRB"
//       const ok   = K.eslesir('A106B', 'A106', 'baslar');  // true
//
//   - Frontend (HTML sayfalar):
//       <script src="ares-kalite-normalize.js"></script>
//       ARES_KALITE.normalize('316L')  // "316L"
//
// PATTERN: ARES_NORM, ARES_BORU ile ayni IIFE + globalThis assignment.
// =====================================================================

(function () {
  'use strict';

  /**
   * Kalite kodunu normalize eder.
   * Tum yazim varyasyonlarini tek forma indirir.
   *
   * @param {string|null|undefined} raw - Ham kalite kodu (PDF'ten gelen veya DB pattern'i)
   * @returns {string|null} - Normalize edilmis kod, ya da null (bos/gecersiz girdi)
   */
  function normalize(raw) {
    if (raw == null) return null;
    let s = String(raw).toUpperCase().trim();
    if (!s) return null;

    // 1. Spec prefix'leri temizle (ASTM A106 -> A106, ASME B16.5 -> B16.5)
    //    Sadece basta + bosluk olanlari (ENG-AW gibi yapisik kelimeleri bozmasin)
    s = s.replace(/^ASTM\s+/, '');
    s = s.replace(/^ASME\s+/, '');

    // 2. "Grade" / "Gr." / "Gr " -> "GR" (tek forma)
    s = s.replace(/\bGRADE\b/g, 'GR');
    s = s.replace(/\bGR\.\s*/g, 'GR');

    // 3. Ayraclari sil: bosluk, tire, alt-tire, nokta, slash, virgul
    s = s.replace(/[\s\-_./,]/g, '');

    return s || null;
  }

  /**
   * Pattern eslesmesi yapar (DB lookup icin).
   *
   * @param {string} kaliteRaw - PDF'ten gelen ham kalite (or. "A106 Gr.B")
   * @param {string} pattern   - DB'deki pattern (or. "A106")
   * @param {string} tipi      - 'tam' | 'baslar' | 'icerir'
   * @returns {boolean}
   *
   * Ornek:
   *   eslesir('A106 Gr.B', 'A106', 'baslar')  // true  (A106GRB starts with A106)
   *   eslesir('A105',      'A106', 'baslar')  // false
   *   eslesir('TP316L',    '316L', 'icerir')  // true  (TP316L contains 316L)
   *   eslesir('ST37',      'ST37', 'tam')     // true
   */
  function eslesir(kaliteRaw, pattern, tipi) {
    const k = normalize(kaliteRaw);
    const p = normalize(pattern);
    if (!k || !p) return false;

    if (tipi === 'tam')    return k === p;
    if (tipi === 'baslar') return k.startsWith(p);
    if (tipi === 'icerir') return k.includes(p);

    return false;
  }

  /**
   * Birden fazla pattern arasinda en iyi eslesmeyi bulur.
   * Oncelik: tam > baslar > icerir, ayni tip icinde uzun pattern > kisa.
   *
   * @param {string} kaliteRaw
   * @param {Array<{kalite_kodu_pattern: string, pattern_tipi: string, ...}>} kayitlar
   * @returns {Object|null} - En iyi eslesen kayit (kayitlar[i] objesi), yoksa null
   */
  function enIyiEslesme(kaliteRaw, kayitlar) {
    if (!Array.isArray(kayitlar) || kayitlar.length === 0) return null;

    const oncelik = { tam: 3, baslar: 2, icerir: 1 };
    let enIyi = null;
    let enIyiSkor = -1;

    for (const k of kayitlar) {
      if (!eslesir(kaliteRaw, k.kalite_kodu_pattern, k.pattern_tipi)) continue;

      // Skor: tip onceligi * 1000 + pattern uzunlugu (tie-breaker)
      const skor = (oncelik[k.pattern_tipi] || 0) * 1000
                 + (normalize(k.kalite_kodu_pattern)?.length || 0);

      if (skor > enIyiSkor) {
        enIyiSkor = skor;
        enIyi = k;
      }
    }

    return enIyi;
  }

  // Public API
  const api = {
    normalize,
    eslesir,
    enIyiEslesme,
  };

  // Global assignment (browser + Node globalThis)
  if (typeof globalThis !== 'undefined') {
    globalThis.ARES_KALITE = api;
  }
})();
