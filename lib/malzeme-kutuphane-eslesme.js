// lib/malzeme-kutuphane-eslesme.js — SAF ÇEKİRDEK (I/O yok), izo-eslesme.js deseni.
// Kanonik boyut = mm (MK-140: ares-olcu her girdiyi mm'e normalize eder; dn değil).
// Girdi: spool_malzemeleri satırı + ARES_OLCU. Malzeme kolonu zaten normalize kod
//   (karbon/paslanmaz/diger) → ARES_NORM gerekmez; bakir→cunife (kütüphane convention).
// Çıktı: { hedef_kolon, lookup } | null. Lookup mm-toleranslı (cap_mm/cap_buyuk_mm).
// MK-126.8: ares-olcu KOPYALANMAZ, çağrılır.
//
// 142 — FITTING KOD HİZALAMA (BUG-A). Kanıt: fitting_olculer parca_tipi iki kodlama
//   ailesi kullanıyor (KANIT: 142 oturum SQL distinct):
//     cunife (DIN)  : semantik  → elbow_90lr, reducer_conc, tee_eq, tee_red
//     karbon (ASME) : ASME-native → 90LR/45LR (B16.9), reducer_conc/ecc (semantik), tee_eq
//   Çekirdek eskiden HER zaman semantik (elbow_90lr) + tee_reducing üretiyordu →
//   karbon elbow (72) ve tüm tee (21) 0 bağlandı. Düzeltme: malzeme grubuna göre
//   elbow dili; tee tanımdan Eq/Reducing ayrımı.
//   Açı: karbon elbow tanımlarında açı yok (76/76 'aci_yok') → 90 varsayımı korunur.
//   Radius: 1.5D→LR (72 satır, kütüphanede var), 1D→SR (4 satır, karbon SR kütüphanede
//   YOK → lookup boş → temiz NULL; ihtiyaç olunca süper-admin yükler).

function _grup(malzemeKod){
  var g = String(malzemeKod||'').toLowerCase();
  if (g === 'bakir') return 'cunife';      // kütüphane convention
  if (['karbon','paslanmaz','alum','cunife','diger'].indexOf(g) !== -1) return g;
  return g || null;
}

// 142: elbow parca_tipi'ni malzeme grubuna göre kütüphane diline çevir.
//   cunife/DIN  : semantik  → 'elbow_'+aci+lr   (elbow_90lr, elbow_45sr)
//   karbon/ASME : B16.9-native → aci+LR/SR büyük harf (90LR, 45SR... )
//   Not: karbon SR kütüphanede yok; SR üretilirse lookup boş döner (doğru NULL).
function _elbowParcaTipi(mg, aci, lrsr){
  if (mg === 'karbon' || mg === 'paslanmaz'){
    return aci + lrsr.toUpperCase();          // '90' + 'LR' → '90LR'
  }
  return 'elbow_' + aci + lrsr;               // cunife/diğer: 'elbow_90lr'
}

function eslesmeAnahtari(m, ARES_OLCU){
  if (!m) return null;
  var mg = _grup(m.malzeme);
  if (!mg || mg === 'diger') return null;  // 'diger' standart-dışı (Weld-O-let, Victaulic vb.)

  // boyut → kanonik mm (4 format ares-olcu'dan; ARES_BORU runtime'da yüklü olmalı)
  var o = ARES_OLCU.olcuParse(m.boyut || '', m.malzeme || '');
  var mm = (o.dis_cap != null) ? Math.round(o.dis_cap * 10) / 10 : null;
  if (mm == null) return null;             // mm türetilemedi → eşleşme yok

  var tl = String(m.tanim||'').toLowerCase();

  // FLANŞ → flansh_olculer.cap_mm
  if (/flange|flans/.test(tl)) {
    var ftip = /welding neck|weld neck|\bwn\b/.test(tl) ? 'EN-T11'
             : (/slip[\s\-]?on/.test(tl) ? 'EN-T01' : null);
    var pn = (tl.match(/pn\s*0*(\d+)/) || [])[1] || null;   // 'PN 16'→'16'
    if (!ftip || !pn) return null;
    return { hedef_kolon:'flansh_olculer_id', cap_alani:'cap_mm', cap_mm:mm,
      lookup:{ geometri_std:'EN-1092-1', flansh_tipi:ftip, basinc_sinifi:pn, malzeme_grubu:mg } };
  }

  // FITTING → fitting_olculer.cap_buyuk_mm
  if (/elbow|dirsek|bend/.test(tl)) {
    // 142 ARA-AÇI GUARD (3D motoru için kritik, MK-49.A): standart fitting yalnız 45°/90°.
    //   Tanımda açıkça başka açı yazıyorsa (27/22.5/11.25/30/60...) bu standart fitting
    //   DEĞİL (kesilmiş dirsek/miter/bend). 90LR'a bağlamak ölçü tablosunda zararsız
    //   görünür AMA 3D'de yanlış geometri üretir. → standart-dışı NULL (süper-admin/manuel).
    //   Açı YAZILMAMIŞSA 90 varsayılır (gemi std; veri 76/76 böyle).
    var aciM = tl.match(/(\d{1,3}(?:\.\d+)?)\s*(?:°|derece|deg\b)/);  // "27°", "22.5 derece"
    if (aciM){
      var a = parseFloat(aciM[1]);
      if (a !== 45 && a !== 90) return null;   // ara açı → standart fitting değil → NULL
    }
    // radius: 1.5D|long → LR ; 1D|short → SR ; varsayılan LR (gemi std)
    var lrsr = /1\.?5\s?d|long/.test(tl) ? 'lr'
             : (/\b1\s?d\b|\bsr\b|short/.test(tl) ? 'sr' : 'lr');
    var aci = (aciM && parseFloat(aciM[1]) === 45) || /\b45\b/.test(tl) ? '45' : '90';
    return { hedef_kolon:'fitting_olculer_id', cap_alani:'cap_buyuk_mm', cap_mm:mm,
      lookup:{ parca_tipi:_elbowParcaTipi(mg, aci, lrsr), malzeme_grubu:mg } };
  }
  if (/reducer/.test(tl)) {
    var ecc = /eccentric/.test(tl) ? 'ecc' : 'conc';
    return { hedef_kolon:'fitting_olculer_id', cap_alani:'cap_buyuk_mm', cap_mm:mm,
      lookup:{ parca_tipi:'reducer_'+ecc, malzeme_grubu:mg } };
  }
  if (/\btee\b/.test(tl)) {
    // 142: tanımdan Eq/Reducing ayrımı. 'tee_reducing' ölü koddu (kütüphanede yok).
    //   kütüphane: tee_eq (eşit) | tee_red (redüksiyonlu) — cunife+karbon ortak.
    var ttip = /reducing|red\b/.test(tl) ? 'tee_red' : 'tee_eq';
    return { hedef_kolon:'fitting_olculer_id', cap_alani:'cap_buyuk_mm', cap_mm:mm,
      lookup:{ parca_tipi:ttip, malzeme_grubu:mg } };
  }

  return null; // standart-dışı → NULL → süper-admin
}

if (typeof module !== 'undefined' && module.exports) module.exports = { eslesmeAnahtari: eslesmeAnahtari };
if (typeof window !== 'undefined') window.MALZEME_ESLESME = { eslesmeAnahtari: eslesmeAnahtari };
if (typeof globalThis !== 'undefined') globalThis.MALZEME_ESLESME = { eslesmeAnahtari: eslesmeAnahtari };
