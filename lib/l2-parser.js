'use strict';

function alanCikar(text, alanTanim) {
  if (!alanTanim || !alanTanim.regex) return null;
  let regex;
  try { regex = new RegExp(alanTanim.regex, alanTanim.flag || 'i'); }
  catch (e) { return null; }
  const match = text.match(regex);
  if (!match) return alanTanim.fallback || null;
  let deger = match[alanTanim.grup || 1];
  if (deger === undefined) return alanTanim.fallback || null;

  if (alanTanim.tip === 'int') {
    const n = parseInt(deger, 10);
    deger = isNaN(n) ? null : n;
  } else if (alanTanim.tip === 'float') {
    const n = parseFloat(deger);
    deger = isNaN(n) ? null : n;
  } else {
    deger = String(deger).trim();
  }

  if (alanTanim.whitelist && Array.isArray(alanTanim.whitelist)) {
    const norm = (s) => String(s).replace(/\s+/g, '').toUpperCase();
    const found = alanTanim.whitelist.find(w => norm(w) === norm(deger));
    if (found) deger = found;
    else if (alanTanim.fallback) deger = alanTanim.fallback;
  }

  if (alanTanim.format_template && deger != null) {
    deger = alanTanim.format_template.replace('{n}', String(deger));
  }

  if (alanTanim.post_processing && deger != null) {
    deger = postProcess(deger, alanTanim.post_processing);
  }

  return deger;
}

function postProcess(deger, kural) {
  if (kural.tip === 'prefix_garanti') {
    const prefix = kural.prefix || '';
    if (typeof deger !== 'string') return deger;
    if (deger.startsWith(prefix)) return deger;
    return prefix + deger;
  }
  return deger;
}

function alanGruplariCikar(text, alanTanim) {
  if (!alanTanim || !alanTanim.regex || !alanTanim.gruplar) return null;
  let regex;
  try { regex = new RegExp(alanTanim.regex, alanTanim.flag || 'i'); }
  catch (e) { return null; }
  const match = text.match(regex);
  if (!match) return null;
  const sonuc = {};
  for (const [ad, idx] of Object.entries(alanTanim.gruplar)) {
    sonuc[ad] = match[idx] || null;
  }
  return sonuc;
}

function _tipCevir(ad, value) {
  if (value == null || value === '') return null;
  if (ad === 'agirlik_kg' || ad === 'cap_mm' || ad === 'et_mm' || ad === 'dis_cap_mm') {
    const n = parseFloat(value);
    return isNaN(n) ? null : n;
  }
  if (ad === 'dn' || ad === 'adet' || ad === 'boy_mm') {
    const n = parseInt(value, 10);
    return isNaN(n) ? null : n;
  }
  if (ad === 'kalite') return String(value).replace(/\s+/g, '');
  return String(value).trim();
}

function malzemeTablosuCikar(text, malzemeKural) {
  if (!malzemeKural || !malzemeKural.aktif) return [];
  if (!Array.isArray(malzemeKural.satir_tipleri)) return [];

  const malzemeler = [];
  const satirlar = text.split('\n').map(s => s.trim()).filter(s => s.length > 0);

  let basla = 0;
  if (malzemeKural.baslik_tetikleyici && typeof malzemeKural.baslik_tetikleyici === 'string') {
    const idx = satirlar.findIndex(s => s.includes(malzemeKural.baslik_tetikleyici));
    if (idx > -1) basla = idx + 1;
  }

  for (let i = basla; i < satirlar.length; i++) {
    const satir = satirlar[i];
    if (satir.length < 5) continue;

    let tipBulundu = null;
    for (const tip of malzemeKural.satir_tipleri) {
      try {
        if (new RegExp(tip.tetikleyici_regex, 'i').test(satir)) {
          tipBulundu = tip;
          break;
        }
      } catch (e) {}
    }
    if (!tipBulundu) continue;

    let match = null;
    try { match = satir.match(new RegExp(tipBulundu.pattern, 'i')); }
    catch (e) { continue; }

    if (!match) {
      malzemeler.push({
        kategori: tipBulundu.kategori,
        tanim: satir,
        ham_satir: true,
        uyari: 'pattern_tutmadi'
      });
      continue;
    }

    const malzeme = {
      kategori: tipBulundu.kategori,
      malzeme: tipBulundu.malzeme_default || null,
      ham_satir: false
    };

    if (tipBulundu.grup_haritasi && typeof tipBulundu.grup_haritasi === 'object') {
      for (const [ad, idx] of Object.entries(tipBulundu.grup_haritasi)) {
        const ham = match[idx];
        if (ham !== undefined) {
          malzeme[ad] = _tipCevir(ad, ham);
        }
      }
      if (malzeme.adet === undefined) malzeme.adet = 1;
    } else {
      if (tipBulundu.ad === 'boru') {
        malzeme.kod = match[1];
        malzeme.tanim = (match[2] || '').trim();
        malzeme.dis_cap_mm = parseFloat(match[3]) || null;
        malzeme.et_mm = parseFloat(match[4]) || null;
        malzeme.boy_mm = parseFloat(match[5]) || null;
        malzeme.kalite = (match[6] || '').replace(/\s+/g, '');
        malzeme.agirlik_kg = parseFloat(match[7]) || null;
        malzeme.adet = 1;
      } else if (tipBulundu.ad === 'fitting') {
        malzeme.kod = match[1];
        malzeme.adet = parseInt(match[2], 10) || 1;
        malzeme.tanim = (match[3] || '').trim();
        malzeme.dn = parseInt(match[4], 10) || null;
        malzeme.boy_mm = parseFloat(match[5]) || null;
        malzeme.kalite = (match[6] || '').replace(/\s+/g, '');
        malzeme.agirlik_kg = parseFloat(match[7]) || null;
      } else if (tipBulundu.ad === 'islem') {
        malzeme.kod = match[1];
        malzeme.adet = parseInt(match[2], 10) || 1;
        malzeme.tanim = (match[3] || '').trim();
        malzeme.agirlik_kg = parseFloat(match[4]) || null;
      }
    }

    malzemeler.push(malzeme);
  }

  return malzemeler;
}

function parse(text, parserKural) {
  if (!parserKural || typeof parserKural !== 'object') {
    return { ok: false, sebep: 'parser_kural_yok', parser_seviye: 'l3' };
  }
  if (parserKural.ekstraktor_tipi !== 'regex_text') {
    return { ok: false, sebep: 'desteklenmeyen_ekstraktor', parser_seviye: 'l3' };
  }
  if (!text || typeof text !== 'string') {
    return { ok: false, sebep: 'metin_yok', parser_seviye: 'l3' };
  }

  const minLen = parserKural.min_metin_uzunlugu || 100;
  if (text.length < minLen) {
    return { ok: false, sebep: 'metin_cok_kisa: ' + text.length, parser_seviye: 'l3' };
  }

  const alanlar = parserKural.alanlar || {};
  const cikarilan = {};
  const eksik_zorunlu = [];
  let toplam = 0, basarili = 0;

  for (const [ad, tanim] of Object.entries(alanlar)) {
    toplam++;
    if (tanim.gruplar) {
      const sonuc = alanGruplariCikar(text, tanim);
      if (sonuc && Object.values(sonuc).some(v => v !== null)) {
        cikarilan[ad] = sonuc;
        basarili++;
      } else if (tanim.zorunlu) {
        eksik_zorunlu.push(ad);
      }
      continue;
    }
    const deger = alanCikar(text, tanim);
    if (deger !== null && deger !== undefined && deger !== '') {
      cikarilan[ad] = deger;
      basarili++;
    } else if (tanim.zorunlu) {
      eksik_zorunlu.push(ad);
    }
  }

  const malzemeler = malzemeTablosuCikar(text, parserKural.malzeme_tablosu);
  const kabul = parserKural.kabul_kriterleri || {};
  const matchOrani = toplam > 0 ? basarili / toplam : 0;
  const minOran = kabul.min_overall_match_orani || 0.7;
  const minMalzeme = kabul.min_malzeme_satir || 0;

  let kabulHata = null;
  if (eksik_zorunlu.length > 0) kabulHata = 'zorunlu_eksik: ' + eksik_zorunlu.join(',');
  else if (matchOrani < minOran) kabulHata = 'match_orani_dusuk: ' + matchOrani.toFixed(2);
  else if (malzemeler.length < minMalzeme) kabulHata = 'malzeme_satir_az: ' + malzemeler.length;

  if (kabulHata) {
    return {
      ok: false, sebep: kabulHata,
      parser_seviye: kabul.l3_fallback_yapilir ? 'l3' : 'l2',
      cikarilan, malzemeler, alan_match_orani: matchOrani,
      cikarilan_alan_sayisi: basarili, toplam_alan_sayisi: toplam,
      malzeme_satir_sayisi: malzemeler.length
    };
  }

  const spool = {
    spool_no: cikarilan.spool_no || null,
    pipeline_no: cikarilan.pipeline_no || null,
    dn: cikarilan.dn || null,
    cap_mm: cikarilan.cap_mm || null,
    et_mm: cikarilan.et_mm || null,
    et_kaynagi: cikarilan.et_mm ? 'l2_regex' : 'pdf_yok',
    kalite: cikarilan.kalite || null,
    agirlik_kg: cikarilan.agirlik_kg || null,
    yuzey: cikarilan.yuzey || null,
    rev: null,
    boy_mm: cikarilan.boy_mm || null,
    notlar: 'L2 deterministik parse',
    guven_skoru: 1.0,
    uyari_dosya_adi: false,
    malzeme_listesi: malzemeler,
    malzeme_en_kodu: null,
    malzeme_astm_kodu: null,
    _tersan_meta: {
      tarih: cikarilan.tarih || null,
      cizen: cikarilan.cizen || null,
      proje_kodu: cikarilan.proje_kodu || null,
      sertifika: cikarilan.sertifika || null
    }
  };

  return {
    ok: true,
    parsed: { spoollar: [spool] },
    parser_seviye: 'l2',
    alan_match_orani: matchOrani,
    cikarilan_alan_sayisi: basarili,
    toplam_alan_sayisi: toplam,
    malzeme_satir_sayisi: malzemeler.length
  };
}

export { parse, alanCikar, malzemeTablosuCikar, postProcess };
export default { parse, alanCikar, malzemeTablosuCikar, postProcess };
