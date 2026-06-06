// ares-alan-cikar.js — alan çıkarma çekirdeği (163. oturum / W-3.12)
//
// TEK KAYNAK (MK-126.8 + ares-tablo-sentez deseni): aynı modül hem
//   lib/l2-parser.js'te (yan-etki import — server parse hattı) hem
//   format_tanit.html'de (script src — öğretim UI testi) koşar.
//
// NEDEN: 162/B7 — format_tanit'teki _alanCikar kopyası kanonikten SAPMIŞTI
//   (whitelist dalı eksikti; 163'te format_template dalının da eksik olduğu görüldü).
//   Kopya gövdeler silindi, çekirdek buraya taşındı. l2-parser'daki alanCikar/postProcess
//   artık ince delegedir; export imzaları DEĞİŞMEDİ (izometri-oku import'u kırılmaz).
//
// SÖZLEŞME — alanCikar(text, alanTanim) tek değer döner. alanTanim:
//   { regex, flag='i', grup=1, tip('int'|'float'|diğer=string),
//     fallback?, whitelist?(dizi), format_template?('{n}'), post_processing? }
//   Gövdeler l2-parser'ın 163-öncesi kanonik gövdeleriyle DAVRANIŞ-EŞTİR —
//   bu taşımada davranış değişikliği YOKTUR, yalnız konum değişti (kanıt:
//   test-alan-cikar senaryolarında eski gövde == yeni çekirdek çıktı eşitliği).
//
// B4 notu (163, bilinçli): eşleşmeme ile fallback-uydurma ayrımı çağırana hâlâ
//   gitmiyor. 163/F1 taraması kayıtlı 27 alan kuralının HİÇBİRİNDE fallback/whitelist/
//   format_template kullanılmadığını gösterdi — görünürlük ihtiyacı doğduğunda
//   artık TEK yerden eklenecek.
//
// Son güncelleme: 6 Haziran 2026 (163. oturum)

(function (g) {
  'use strict';

  function postProcess(deger, kural) {
    if (kural.tip === 'prefix_garanti') {
      const prefix = kural.prefix || '';
      if (typeof deger !== 'string') return deger;
      if (deger.startsWith(prefix)) return deger;
      return prefix + deger;
    }
    return deger;
  }

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

  g.ARES_ALAN_CIKAR = { alanCikar, postProcess };
})(typeof globalThis !== 'undefined' ? globalThis : this);
