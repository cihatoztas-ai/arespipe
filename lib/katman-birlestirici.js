'use strict';

// ============================================================================
// katman-birlestirici.js — Aşama 1 (oturum 119)
// ----------------------------------------------------------------------------
// Kılavuz Bölüm 8 (MK-118.3): motor YENİDEN YAZILMAZ. l2-parser.js'in
// parse(text, parser_kural) imzası KORUNUR. Bu modül parse'ın ÖNÜNE girer:
//
//     const etkin = aileBirlestir(format_kodu, text);   // katalog-yönetimli mi?
//     parse(text, etkin || formatBilgisi.parser_kural);  // değilse DB kuralı aynen
//
// Çakışmada ÜST katman ezer (override-only). satir_tipleri specificity'ye göre
// sıralanır (Bölüm 6). Saf fonksiyon: yan etki yok, DB yok, AI yok.
// Token kaynağı = paketlerin kendi seselici'si (kopya/drift yok).
// ============================================================================

import { AILE_KAYIT, MALZEME_KARBON, MALZEME_PASLANMAZ } from './format-paketleri.js';

// Alanları sığ-birleştir: üst katman aynı anahtarı EZER (override-only).
function _alanlariBirlestir(hedef, kaynak) {
  return { ...hedef, ...kaynak };
}

// Seçili paketleri tek etkin parser_kural'a indirger.
// paketler: [{ katman, parser_kural_parcasi }, ...] (sırasız verilebilir).
function birlestir(paketler) {
  if (!Array.isArray(paketler)) return null;

  // Katman artan sırada uygula → büyük katman no en sonda yazar = ezer.
  const sirali = [...paketler].sort((a, b) => (a.katman ?? 0) - (b.katman ?? 0));

  const etkin = {
    ekstraktor_tipi: 'regex_text',
    alanlar: {},
    malzeme_tablosu: { aktif: false, satir_tipleri: [] }
  };
  const satirHavuzu = []; // { spesifiklik, ...satirTipi }

  for (const p of sirali) {
    const k = (p && p.parser_kural_parcasi) || {};

    if (k.ekstraktor_tipi) etkin.ekstraktor_tipi = k.ekstraktor_tipi;
    if (k.min_metin_uzunlugu != null) etkin.min_metin_uzunlugu = k.min_metin_uzunlugu;
    if (k.kabul_kriterleri) {
      etkin.kabul_kriterleri = { ...(etkin.kabul_kriterleri || {}), ...k.kabul_kriterleri };
    }
    if (k.alanlar) etkin.alanlar = _alanlariBirlestir(etkin.alanlar, k.alanlar);

    // Montaj formatları için ileride (e1fb879d imalat olduğu için pilotta yok):
    if (k.montaj_modu != null) etkin.montaj_modu = k.montaj_modu;
    if (k.liste_alanlar) etkin.liste_alanlar = { ...(etkin.liste_alanlar || {}), ...k.liste_alanlar };
    if (k.montaj_alistirma_kurali) etkin.montaj_alistirma_kurali = k.montaj_alistirma_kurali;
    if (k.alistirma_ipucu_kurali) etkin.alistirma_ipucu_kurali = k.alistirma_ipucu_kurali;

    if (k.malzeme_tablosu) {
      const mt = k.malzeme_tablosu;
      if (mt.aktif != null) etkin.malzeme_tablosu.aktif = mt.aktif;
      if (mt.baslik_tetikleyici) etkin.malzeme_tablosu.baslik_tetikleyici = mt.baslik_tetikleyici;
      const ekle = mt.satir_tipleri_ekle || mt.satir_tipleri || [];
      for (const rt of ekle) satirHavuzu.push(rt);
    }
  }

  // satir_tipleri'ni specificity AZALAN sırada diz: en özel tetikleyici önce denenir.
  // malzemeTablosuCikar ilk-eşleşen-break ile çalışır; bu sıralama paketlerin
  // VERİLİŞ SIRASINDAN BAĞIMSIZ olarak emperyal(boru_sch)'i metrik(boru_mm)'den
  // önce dener. (Eski monolitte bu dizi sırasına gömülüydü; artık açık kural.)
  satirHavuzu.sort((a, b) => (b.spesifiklik ?? 5) - (a.spesifiklik ?? 5));

  // spesifiklik motor tarafından okunmaz; çıktıdan temizle (parse() ile uyum).
  etkin.malzeme_tablosu.satir_tipleri = satirHavuzu.map(({ spesifiklik, ...rt }) => rt);

  return etkin;
}

// Bir paketin seselici'si metinde eşleşiyor mu? (Katman 0/1 her zaman dahil;
// Katman 2+ için seselici.kalite_token_regex metinde geçmeli.)
function _seseliciEslesir(p, text) {
  if (p.katman === 0 || p.katman === 1) return true;
  const tok = p.seselici && p.seselici.kalite_token_regex;
  if (!tok) return true; // seselici yoksa dahil et
  try { return new RegExp(tok, 'i').test(text); } catch (e) { return false; }
}

// Facet + paket havuzu → seçili paketler. Token kaynağı paketin KENDİ seselici'si.
// Per-satır (karar A): NB1137 tek PDF'te hem karbon hem paslanmaz token taşırsa
// ikisi de dahil; satır seçimini malzemeTablosuCikar tetikleyiciyle yapar.
function paketSec(text, paketler) {
  const t = String(text || '');
  const secili = [];
  const facetler = { malzeme_gruplari: [] };
  for (const p of paketler) {
    if (!_seseliciEslesir(p, t)) continue;
    secili.push(p);
    if (p.katman === 2) {
      const g = p.id === 'malzeme_karbon' ? 'karbon'
              : p.id === 'malzeme_paslanmaz' ? 'paslanmaz' : p.id;
      facetler.malzeme_gruplari.push(g);
    }
  }
  return { secili, facetler };
}

// Sadece malzeme grubu facet'lerini döndüren kısayol (gözlem/test için).
function facetAlgila(text) {
  return paketSec(text, [MALZEME_KARBON, MALZEME_PASLANMAZ]).facetler;
}

// --- Üst seviye giriş: format_kodu katalog-yönetimli mi? --------------------
// Evetse facet paketlerinden ETKİN KURAL üretir; hayırsa null (→ çağıran DB
// kuralını kullanır). izometri-oku.js parserKuralIle bunu çağırır.
function aileBirlestir(format_kodu, text) {
  const paketler = AILE_KAYIT[format_kodu];
  if (!Array.isArray(paketler) || paketler.length === 0) return null;
  const { secili } = paketSec(text, paketler);
  return birlestir(secili);
}

export { birlestir, facetAlgila, paketSec, aileBirlestir };
export default { birlestir, facetAlgila, paketSec, aileBirlestir };
