'use strict';

// Türetilmiş ölçü zinciri (151, Increment 2 — FORMAT-TANITMA-TABLO-TASARIM.md §4.2):
// boyut metni HAM yakalanır, çevirme TEK merkezde (ARES_OLCU.olcuParse → ARES_BORU).
// Yan-etki importlar globalThis'e yazar; sıra: ares-asme ÖNCE (ARES_BORU), sonra ares-olcu.
import '../ares-asme.js';
import '../ares-olcu.js';

// W-3.12 (163): alan çıkarma çekirdeği TEK kaynakta — ares-alan-cikar.js
//   (format_tanit.html de aynı dosyayı script src ile yükler; 162/B7 kopya sapması bitti).
import '../ares-alan-cikar.js';

function _olcuMotor() {
  return (typeof globalThis !== 'undefined' && globalThis.ARES_OLCU) || null;
}

// kalite metni → ARES_BORU malzeme anahtarı ('AISI 316L' hamı _malzemeNorm'da tanınmaz — köprü)
function _kaliteMalzeme(kalite) {
  const s = String(kalite || '').toUpperCase();
  if (/CUNI|CU-NI|90\/10|70\/30/.test(s)) return 'cunife';
  if (/316|304|AISI|PASLANMAZ|ST\.?\s?ST|\bSS\b|14571/.test(s)) return 'paslanmaz';
  if (/AL[UÜ]M|6061|6063/.test(s)) return 'aluminyum';
  return 'karbon';
}

// Satır zenginleştirme: 'boyut' (ham string) → olcuParse → BOŞ alanları doldur (MK-111.2: dolu EZİLMEZ).
// _et_kaynak: 'metin' (ODxet açık yazılı) | 'asme' (schedule lookup'tan türetildi).
function olcuZenginlestir(malzemeler) {
  const O = _olcuMotor();
  if (!O || !Array.isArray(malzemeler)) return malzemeler;
  for (const m of malzemeler) {
    if (!m || m.ham_satir) continue;
    // 165 (42.2/3.56 vakasi, M130-817-008.S01): emperyal satir tipleri (boru_sch/
    // dirsek_sch) 'boyut' alani TASIMAZ — nps_inc + schedule_kod ayrik gelir.
    // Boyut yoksa NPS'ten yerel sentez ('2' + '10S' -> '2" Sch 10S'); olcuParse
    // NPS yolu DN/OD/et'i ARES_BORU'dan cozer. m.boyut'a YAZILMAZ (ham yakalama
    // ilkesi) — yalniz yerel degisken. Sentezsiz halde boru satiri dominant
    // adayi olamiyordu -> spool basi alan-regex dn'ine (kaynak satiri DN32)
    // kaliyordu -> asmeFallbackDoldur 42.2/SCH40-3.56 uyduruyordu.
    let boyutStr = (typeof m.boyut === 'string' && m.boyut.trim()) ? m.boyut : null;
    if (!boyutStr && m.nps_inc != null && String(m.nps_inc).trim()) {
      boyutStr = String(m.nps_inc).trim() + '"' + (m.schedule_kod ? ' Sch ' + String(m.schedule_kod).trim() : '');
    }
    if (!boyutStr) continue;
    let p;
    try { p = O.olcuParse(boyutStr, _kaliteMalzeme(m.kalite)); } catch (e) { continue; }
    if (!p) continue;
    if (m.dis_cap_mm == null && p.dis_cap != null) m.dis_cap_mm = p.dis_cap;
    if (m.et_mm == null && p.et != null) {
      m.et_mm = p.et;
      m._et_kaynak = /[xX]/.test(boyutStr) ? 'metin' : 'asme';
    }
    if (m.dn == null && p.dn != null) m.dn = p.dn;
    if (m.sch == null && p.sch) m.sch = p.sch;
  }
  return malzemeler;
}

// Dominant Boru satırı → spool baş ölçüleri (kenar §5: dn HEP dominant borudan, İç Bilezik/kaynak ASLA).
// Boşsa doldurur (MK-111.2). et: yalnız metin-kaynaklıysa (asme-lookup değilse) → et_kaynagi='tablo';
// schedule-türetilmiş et spool'a YAZILMAZ — null+pdf_yok kalır, asmeFallbackDoldur schedule-bilinçli doldurur (zincir).
function spoolOlcuTuret(spool, malzemeler) {
  if (!spool || !Array.isArray(malzemeler)) return;
  const borular = malzemeler.filter(x => x && !x.ham_satir && x.kategori === 'boru' && x.dis_cap_mm != null);
  if (!borular.length) return;
  const dom = borular.reduce((a, b) => (b.dis_cap_mm > a.dis_cap_mm ? b : a));
  if (spool.cap_mm == null) spool.cap_mm = dom.dis_cap_mm;
  // 165/A karari (42.2/3.56 vakasi): dn HEP dominant borudan — kenar §5'in birebir
  // kodlanmasi. Alan-regex dn'i kaynak/bilezik satirina capa atabilir (M130-817-008.S01:
  // tek DN kaynak satirindaydi -> dn=32, dogrusu dominant borudan 50). Dominant boru
  // zaten temiz satirdan gelir (non-ham + dis_cap dolu); tablo bozuksa dominant yok =
  // ezme yok. MK-111.2 'dolu ezilmez' ogretim-patch baglamidir, kenar §5 burada ustun.
  if (dom.dn != null) spool.dn = dom.dn;
  if (spool.schedule == null && dom.sch) spool.schedule = dom.sch;
  if (spool.et_mm == null && dom.et_mm != null && dom._et_kaynak !== 'asme') {
    spool.et_mm = dom.et_mm;
    spool.et_kaynagi = 'tablo';
  }
}

// Alıştırma ipucu merkezi varsayılan (M1, oturum 117) — tüm formatlarda ortak.
// NOT metninden alıştırma türetir. Bir format kendi alistirma_ipucu_kurali'yla
// override edebilir (override varsa bu varsayılan kullanılmaz). NOT *çekme* ise
// format-özeldir (her formatın kendi 'not_metni' alan regex'i). Kademeler sıralı:
// ilk eşleşen kazanır → VAR (komple) önce listelenir, KISMI sonra (VAR baskın).
const ALISTIRMA_IPUCU_VARSAYILAN = {
  kaynak_alan: 'not_metni',
  kademeler: [
    { deger: 'VAR',   anahtar_kelimeler: ['al.{2}t.rma +par[çc]as'] },
    { deger: 'KISMI', anahtar_kelimeler: [
        'kaynat.lmayacak', 'kaynamayacak', 'sahada',
        'gemide +montaj', 'a[çc].k +kalacak', 'ba[ğg]lanmayacak'] }
  ]
};

// W-3.12 (163): gövde ares-alan-cikar.js çekirdeğine taşındı — burası ince delege.
//   Export imzası DEĞİŞMEDİ (izometri-oku dinamik import'u aynen çalışır).
function alanCikar(text, alanTanim) {
  return globalThis.ARES_ALAN_CIKAR.alanCikar(text, alanTanim);
}

// W-3.12 (163): gövde ares-alan-cikar.js çekirdeğinde — ince delege.
function postProcess(deger, kural) {
  return globalThis.ARES_ALAN_CIKAR.postProcess(deger, kural);
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

// Liste alanlari cikarici — montaj icin (coklu eslesme, matchAll).
// alanCikar tek-deger doner; bu cokludeger (spool_listesi, continue_baglanti) doner.
// Her liste alani: { regex, grup, flag, tekil(bool), strip_suffix(regex) }
function listeAlanCikar(text, tanim) {
  if (!tanim || !tanim.regex) return [];
  let regex;
  try { regex = new RegExp(tanim.regex, (tanim.flag || 'i') + 'g'); }
  catch (e) { return []; }
  const grup = tanim.grup || 1;
  let degerler = [...text.matchAll(regex)].map(m => (m[grup] || '').trim()).filter(Boolean);
  if (tanim.strip_suffix) {
    let sre;
    try { sre = new RegExp(tanim.strip_suffix); } catch (e) { sre = null; }
    if (sre) degerler = degerler.map(d => d.replace(sre, '').trim());
  }
  if (tanim.tekil !== false) degerler = [...new Set(degerler)];
  return degerler;
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

  // --- MONTAJ MODU (geri uyumlu: montaj_modu yoksa bu blok atlanir) ---
  // Montaj cizimi boru-seviyesi topoloji tasir (coklu spool + continue), malzeme listesi YOK.
  // liste_alanlar ile coklu toplar, spoollar:[] yerine montaj:{} doner.
  if (parserKural.montaj_modu === true) {
    const listeTanim = parserKural.liste_alanlar || {};
    const listeler = {};
    for (const [ad, tanim] of Object.entries(listeTanim)) {
      listeler[ad] = listeAlanCikar(text, tanim);
    }
    // Alistirma: 3 sinyal (dosya adi -ALS / continue -ALS / not metni). Config-driven.
    const mik = parserKural.montaj_alistirma_kurali || {};
    const pipeNo = String(cikarilan.pipe_no || cikarilan.pipeline_no || '');
    const contList = listeler[mik.continue_alan || 'continue_baglanti'] || [];
    const alsKel = Array.isArray(mik.parca_kelimeler) ? mik.parca_kelimeler : ['-ALS'];
    const sinyalPipe = alsKel.some(k => { try { return new RegExp(k, 'i').test(pipeNo); } catch { return false; } });
    const sinyalNot = mik.not_regex ? (() => { try { return new RegExp(mik.not_regex, 'i').test(text); } catch { return false; } })() : false;
    const sinyalCont = contList.some(c => alsKel.some(k => { try { return new RegExp(k, 'i').test(c); } catch { return false; } }));
    let alistirma = null;
    if (sinyalPipe || sinyalNot) alistirma = mik.parca_deger || 'PARCA';
    else if (sinyalCont) alistirma = mik.bagli_deger || 'BAGLI';

    const spoolListesi = listeler[parserKural.spool_listesi_alan || 'spool_listesi'] || [];
    const kabulM = parserKural.kabul_kriterleri || {};
    const minSpool = kabulM.min_spool || 1;
    if (spoolListesi.length < minSpool) {
      return {
        ok: false, sebep: 'montaj_spool_az: ' + spoolListesi.length,
        parser_seviye: kabulM.l3_fallback_yapilir ? 'l3' : 'l2',
        cikarilan, listeler
      };
    }
    return {
      ok: true,
      parser_seviye: 'l2',
      montaj: {
        pipe_no: cikarilan.pipe_no || null,
        spool_listesi: spoolListesi,
        continue_baglanti: listeler[mik.continue_alan || 'continue_baglanti'] || [],
        alistirma: alistirma,
        toplam_agirlik_kg: cikarilan.agirlik_kg || null,
        yuzey: cikarilan.yuzey || null,
        blok: cikarilan.blok || null,
        tarih: cikarilan.tarih || null,
        sistem: cikarilan.sistem || null,
        guverte: listeler.guverte || [],   // ham yakala (savruk format)
        ham_listeler: listeler
      },
      cikarilan_alan_sayisi: basarili,
      toplam_alan_sayisi: toplam
    };
  }
  // --- /MONTAJ MODU ---

  const malzemeler = olcuZenginlestir(malzemeTablosuCikar(text, parserKural.malzeme_tablosu));
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

  // Alıştırma ipucu — NOT metninden türet. Merkezi varsayılan motorda (M1, oturum 117);
  // format kendi alistirma_ipucu_kurali'yla override edebilir. Kademeli (VAR baskın) +
  // eski tek-değer formatına geriye uyumlu.
  let alistirmaIpucu = null;
  const aik = parserKural.alistirma_ipucu_kurali || ALISTIRMA_IPUCU_VARSAYILAN;
  if (aik && aik.kaynak_alan && cikarilan[aik.kaynak_alan]) {
    const kaynak = String(cikarilan[aik.kaynak_alan]);
    const _eslesirMi = (kels) => Array.isArray(kels) && kels.some(k => {
      try { return new RegExp(k, 'i').test(kaynak); } catch (e) { return false; }
    });
    if (Array.isArray(aik.kademeler)) {
      // Yeni kademeli yol: ilk eşleşen kademe kazanır (VAR önce → baskın)
      for (const kad of aik.kademeler) {
        if (_eslesirMi(kad.anahtar_kelimeler)) { alistirmaIpucu = kad.deger || null; break; }
      }
    } else if (_eslesirMi(aik.anahtar_kelimeler)) {
      // Eski tek-değer yolu (geriye uyumlu)
      alistirmaIpucu = aik.deger || 'KISMI';
    }
  }

  const spool = {
    spool_no: cikarilan.spool_no || null,
    pipeline_no: cikarilan.pipeline_no || null,
    dn: cikarilan.dn || null,
    cap_mm: cikarilan.cap_mm || null,
    et_mm: cikarilan.et_mm || null,
    et_kaynagi: cikarilan.et_mm ? 'l2_regex' : 'pdf_yok',
    schedule: cikarilan.schedule || null,
    kalite: cikarilan.kalite || null,
    agirlik_kg: cikarilan.agirlik_kg || null,
    yuzey: cikarilan.yuzey || null,
    rev: null,
    boy_mm: cikarilan.boy_mm || null,
    notlar: 'L2 deterministik parse',
    not_metni: cikarilan.not_metni || null,
    alistirma_ipucu: alistirmaIpucu,
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

  // Türetilmiş spool ölçüleri (151): dominant Boru satırından cap/dn/schedule; et yalnız metin-kaynaklıysa.
  spoolOlcuTuret(spool, malzemeler);

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

export { parse, alanCikar, malzemeTablosuCikar, postProcess, olcuZenginlestir, spoolOlcuTuret };
export default { parse, alanCikar, malzemeTablosuCikar, postProcess, olcuZenginlestir, spoolOlcuTuret };
