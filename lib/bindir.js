// bindir-cekirdek.cjs — PARÇA 2a saf bindirme mantığı (111. oturum, test/geliştirme kopyası)
// Nihai hali api/kuyruk-isle-izometri.js içine gömülecek (eslestir parse-sonrası, MK-109.1).
//
// Girdi:
//   pdfSpool  — parse_sonuc.spoollar[] elemanı (gerçek şema: et_mm, cap_mm, agirlik_kg, yuzey, ...)
//   kabukSpool— spooller satırı (et_kalinligi_mm, dis_cap_mm, agirlik_kg, yuzey, ...)
// Çıktı:
//   { degisiklik:{...}, bindirme:[{alan, kabuk, pdf, secilen, flag, sebep}...], flagVar:bool }
//   degisiklik = spooller UPDATE'i için alanlar (boş ise UPDATE yok)
//
// Kurallar (111, Cihat onaylı):
//   et/cap : boşsa doldur; doluysa eşitse geç, FARKLIYSA flag (et kritik, sessiz ezme yok)
//   agirlik: |fark|/kabuk <= %3 → sessiz geç (kabuk kalır); > %3 → flag + ikisini sakla
//   yuzey  : kabuk boş + PDF dolu → doldur; ikisi dolu+farklı → flag
//   yon    : KAYNAK YOK (parse'ta yon alanı yok) → bindirme dışı (backlog/3D, MK-49.A)



var AGIRLIK_TOLERANS = 0.03;   // %3 — Cihat kararı (111)

function _num(v){ var n = parseFloat(v); return isFinite(n) ? n : null; }
function _str(v){ if(v==null) return null; var s=String(v).trim(); return s ? s : null; }

// Sayısal alan bindirme (et, cap): boş→doldur, eşit→geç, farklı→flag
function _sayiBindir(alan, kabukRaw, pdfRaw, deg, bindirme, tolEsit){
  var kabuk = _num(kabukRaw), pdf = _num(pdfRaw);
  if (pdf == null) return;                                  // PDF'te yok → dokunma
  if (kabuk == null){                                       // kabuk boş → doldur
    deg[alan === 'et' ? 'et_kalinligi_mm' : 'dis_cap_mm'] = pdf;
    bindirme.push({alan:alan, kabuk:null, pdf:pdf, secilen:pdf, flag:false, sebep:'kabuk_bos_dolduruldu'});
    return;
  }
  // ikisi de dolu → eşit mi? (küçük yuvarlama toleransı)
  if (Math.abs(kabuk - pdf) <= (tolEsit || 0.01)){
    bindirme.push({alan:alan, kabuk:kabuk, pdf:pdf, secilen:kabuk, flag:false, sebep:'esit'});
    return;
  }
  // farklı → FLAG, kabuk değeri korunur (ezme yok), çelişki saklanır
  bindirme.push({alan:alan, kabuk:kabuk, pdf:pdf, secilen:kabuk, flag:true, sebep:'celiski_et_cap_farkli'});
}

function bindir(pdfSpool, kabukSpool){
  pdfSpool = pdfSpool || {};
  kabukSpool = kabukSpool || {};
  var deg = {};
  var bindirme = [];

  // 1) ET — spooller.et_kalinligi_mm
  _sayiBindir('et', kabukSpool.et_kalinligi_mm, pdfSpool.et_mm, deg, bindirme, 0.05);

  // 2) ÇAP — spooller.dis_cap_mm
  _sayiBindir('cap', kabukSpool.dis_cap_mm, pdfSpool.cap_mm, deg, bindirme, 0.05);

  // 3) AĞIRLIK — %3 tolerans
  var kAg = _num(kabukSpool.agirlik_kg != null ? kabukSpool.agirlik_kg : kabukSpool.agirlik);
  var pAg = _num(pdfSpool.agirlik_kg);
  if (pAg != null){
    if (kAg == null || kAg === 0){
      // kabuk ağırlık yok → PDF'i yaz (ikiz kolon: agirlik + agirlik_kg, MK-108.2)
      deg.agirlik_kg = pAg; deg.agirlik = pAg;
      bindirme.push({alan:'agirlik', kabuk:kAg, pdf:pAg, secilen:pAg, flag:false, sebep:'kabuk_bos_dolduruldu'});
    } else {
      var sapma = Math.abs(kAg - pAg) / kAg;
      if (sapma <= AGIRLIK_TOLERANS){
        bindirme.push({alan:'agirlik', kabuk:kAg, pdf:pAg, secilen:kAg, flag:false,
                       sebep:'tolerans_ici_%'+(Math.round(sapma*1000)/10)});
      } else {
        // %3 üstü → FLAG, kabuk korunur, ikisi saklanır
        bindirme.push({alan:'agirlik', kabuk:kAg, pdf:pAg, secilen:kAg, flag:true,
                       sebep:'tolerans_disi_%'+(Math.round(sapma*1000)/10)});
      }
    }
  }

  // 4) YÜZEY — kabuk boş + PDF dolu → doldur; ikisi dolu+farklı → flag
  var kYz = _str(kabukSpool.yuzey), pYz = _str(pdfSpool.yuzey);
  if (pYz != null){
    if (kYz == null){
      deg.yuzey = pYz;
      bindirme.push({alan:'yuzey', kabuk:null, pdf:pYz, secilen:pYz, flag:false, sebep:'kabuk_bos_dolduruldu'});
    } else if (kYz.toLowerCase() !== pYz.toLowerCase()){
      bindirme.push({alan:'yuzey', kabuk:kYz, pdf:pYz, secilen:kYz, flag:true, sebep:'celiski_yuzey_farkli'});
    } else {
      bindirme.push({alan:'yuzey', kabuk:kYz, pdf:pYz, secilen:kYz, flag:false, sebep:'esit'});
    }
  }

  var flagVar = bindirme.some(function(b){ return b.flag; });
  return { degisiklik: deg, bindirme: bindirme, flagVar: flagVar };
}

export { bindir, AGIRLIK_TOLERANS };
