'use strict';
// lib/malzeme-kiyas.js — K2: PDF malzeme_listesi x Excel BOM (spool_malzemeleri) kiyas.
// EVRENSEL katman (format-bagimsiz). Katman-birlestiriciden gecmis parse ciktisini TUKETIR.
// Server-side saf fonksiyon (ARES_NORM tarayici-global, server'da yok -> kendi minimal normu).
// FK kurmaz, migration yok. Cikti _eslesme.detay[].malzeme_kiyas'a yazilir.
//
// Karar 1 (133, Cihat): boru -> uzunluk (boy primary); fitting/flans -> adet primary + per-adet agirlik.
//   Islem (kaynak/yiv vb.) gercek malzeme degil; evrensel katmanda taninir, kiyastan DISLANIR.
// Karar 2 (133): excel'de var PDF'te yok -> kapsam'a gore ayir.
//   FAB parca (boru/dirsek/te/red/bilezik/...) -> gercek 🟡 bulgu (flagVar=true).
//   MONTAJ parca (flans/civata/conta/somun) -> info (sahada birlestirilir, PDF'te olmayabilir).
// Karar 3 (133): boru agirlik sapmasi sebebi belirsiz; boy hassas, agirlik yumusak (%10) tutulur.

// --- Minimal normalizasyon (normSpoolNo deseni: upper + bosluk/diakritik sok) ---
function _norm(s){
  return String(s==null?'':s).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/ı/g,'i').replace(/ş/g,'s').replace(/ğ/g,'g').replace(/ç/g,'c').replace(/ö/g,'o').replace(/ü/g,'u')
    .replace(/\s+/g,' ').trim();
}
function _kaliteNorm(s){ return _norm(s).replace(/\s+/g,'').toUpperCase(); } // "St 37" == "ST37"
function _num(v){ const n=parseFloat(v); return isNaN(n)?null:n; }
function _yakin(a,b,tol){ if(a==null||b==null) return false; if(a===0&&b===0) return true; return Math.abs(a-b)/Math.max(Math.abs(a),Math.abs(b)) <= tol; }
function _kelimeVar(metin, kelime){
  // Kelime-siniri eslesme: "steel" icindeki "tee" yakalanmasin (substring tuzagi).
  const k=_norm(kelime).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  try { return new RegExp('(^|[^a-z0-9])'+k+'([^a-z0-9]|$)','i').test(' '+_norm(metin)+' '); }
  catch(e){ return false; }
}

// --- EVRENSEL parca-tipi + kapsam sozlugu (TR + EN) ---
// kapsam: 'islem' (kaynak/yiv) | 'fab' (atolyede uretilen) | 'montaj' (sahada birlestirilen)
const PARCA_SOZLUK = [
  // ISLEM — gercek malzeme degil, kiyastan dislanir (K1: Cihat)
  { pt:'kaynak',  kapsam:'islem',  k:['kaynak','welding','weld','kaynak isi'] },
  { pt:'yiv',     kapsam:'islem',  k:['yiv','groove','thread','tornalama','dis cekme'] },
  { pt:'lehim',   kapsam:'islem',  k:['lehim','solder','brazing','braze'] },
  // FAB — atolyede kesilen/uretilen; PDF imalat listesinin esas hedefi
  { pt:'dirsek',     kapsam:'fab', k:['dirsek','elbow','bend'] },
  { pt:'te',         kapsam:'fab', k:['tee','branch'] },
  { pt:'reduksiyon', kapsam:'fab', k:['reduksiyon','reducer','reduction','konik'] },
  { pt:'kapak',      kapsam:'fab', k:['kapak','blind','kor tapa','cap'] },
  { pt:'bilezik',    kapsam:'fab', k:['bilezik','ring','collar','stub'] },
  { pt:'boru',       kapsam:'fab', k:['boru','pipe','tube'] },
  // MONTAJ — sahada birlestirilir; Excel'de var PDF'te yok = beklenir (K2: Cihat)
  { pt:'flans',      kapsam:'montaj', k:['flans','flange'] },
  { pt:'civata',     kapsam:'montaj', k:['civata','bolt','stud'] },
  { pt:'somun',      kapsam:'montaj', k:['somun','nut'] },
  { pt:'conta',      kapsam:'montaj', k:['conta','gasket','seal'] },
  { pt:'rondela',    kapsam:'montaj', k:['rondela','washer'] },
  { pt:'nipel',      kapsam:'montaj', k:['nipel','nipple'] },
];
function _parcaSinif(tanim, hamTip){
  for(const e of PARCA_SOZLUK){
    if(e.k.some(kw=>_kelimeVar(tanim,kw))) return {pt:e.pt, kapsam:e.kapsam};
  }
  // Sozluk tutmadi -> ham tip + belirsiz kapsam (UI bunu info olarak gosterir)
  return hamTip==='boru' ? {pt:'boru', kapsam:'fab'} : {pt:'fitting', kapsam:'belirsiz'};
}

function _kanon(row, kaynak){
  const hamTip = (row.kategori || row.tip || '').toLowerCase()==='boru' ? 'boru' : 'fitting';
  // PDF l2-parser kategori='islem' satirini direkt yakala
  let sinif;
  const kat = (row.kategori||'').toLowerCase();
  if(kat==='islem') sinif = {pt:'islem-ham', kapsam:'islem'};
  else sinif = _parcaSinif(row.tanim||'', hamTip);
  const cap = _num(row.dis_cap_mm);
  // dn: ham dn alani -> sonra excel boyut metninden ("DN300", "DN400  L=150")
  let dn = _num(row.dn);
  if(dn==null){ const m=String(row.boyut||'').match(/dn\s*(\d+)/i); if(m) dn=_num(m[1]); }
  return {
    pt: sinif.pt, kapsam: sinif.kapsam,
    cap, dn, et: _num(row.et_mm),
    kalite: _kaliteNorm(row.kalite),
    adet: _num(row.adet) ?? 1,
    boy_mm: _num(row.boy_mm),
    agirlik_kg: _num(row.agirlik_kg) || 0,
    tanim: row.tanim || '',
    kaynak, _ham: row
  };
}

// Konsolide: ayni parca-tipi+cap+et+kalite topla. Islem hic gelmez (filtre disardan).
function _konsolide(kanonlar){
  const map=new Map(), sira=[];
  for(const c of kanonlar){
    const key = c.pt+'|'+(c.cap??c.dn??'')+'|'+(c.et??'')+'|'+c.kalite;
    if(!map.has(key)){
      map.set(key, Object.assign({}, c, {adet:0, boy_mm:0, agirlik_kg:0, _say:0}));
      sira.push(key);
    }
    const m = map.get(key);
    m.adet += (c.adet||0);
    m.boy_mm += (c.boy_mm||0);
    m.agirlik_kg += (c.agirlik_kg||0);
    m._say++;
  }
  return sira.map(k=>map.get(k));
}

// Toleranslar (K1+K3+MK-133.3): cap %3 sert; boru boy %5 sert + agirlik %10 yumusak;
// fitting per-adet agirlik %5; dirsek toplam-agirlik %15 (malzeme-korunumu, fire toleransi)
const TOL_CAP = 0.03, TOL_BORU_BOY = 0.05, TOL_BORU_AG = 0.10, TOL_FIT_AG = 0.05, TOL_DIRSEK_AG = 0.15;

function _eslesirMi(p, e){
  if(p.pt !== e.pt) return false;
  if(p.cap!=null && e.cap!=null) return _yakin(p.cap, e.cap, TOL_CAP);
  if(p.dn!=null  && e.dn!=null)  return _yakin(p.dn, e.dn, TOL_CAP);
  // cap/dn ikisi de yoksa (custom bilezik gibi): per-adet agirlik
  const pPer = (p.adet>0) ? p.agirlik_kg/p.adet : p.agirlik_kg;
  const ePer = (e.adet>0) ? e.agirlik_kg/e.adet : e.agirlik_kg;
  return _yakin(pPer, ePer, TOL_FIT_AG);
}

function _r(n){ return n==null?null:Math.round(n*100)/100; }
function _ozet(c){
  return {
    pt: c.pt, kapsam: c.kapsam,
    cap: c.cap, dn: c.dn, et: c.et, kalite: c.kalite,
    adet: c.adet, boy_mm: _r(c.boy_mm), agirlik_kg: _r(c.agirlik_kg),
    tanim: c.tanim
  };
}

function malzemeKiyas(pdfListesi, excelListesi, secenekler){
  // secenekler.excel_guven: 'otorite' (default, IFS gibi ERP cikti) | 'parite' (manuel Excel)
  // MK-133.1: lib her iki davranista da AYNI sapmalari uretir; cikti tag'iyle UI dili degisir.
  const excelGuven = (secenekler && secenekler.excel_guven) || 'otorite';
  // 1) Ham -> kanon
  const pdfRaw   = (pdfListesi||[]).filter(r=>!r.ham_satir).map(r=>_kanon(r,'pdf'));
  const excelRaw = (excelListesi||[]).map(r=>_kanon(r,'excel'));

  // 2) Islem ayir (kiyasa girmez, info)
  const islemler_pdf   = pdfRaw.filter(c=>c.kapsam==='islem').map(_ozet);
  const islemler_excel = excelRaw.filter(c=>c.kapsam==='islem').map(_ozet);

  // 3) Konsolide (islem disinda kalanlar)
  const pdf   = _konsolide(pdfRaw.filter(c=>c.kapsam!=='islem'));
  const excel = _konsolide(excelRaw.filter(c=>c.kapsam!=='islem'));

  // 4) Eslesme: parca_tipi + cap/dn
  const eslesen=[], celiski=[];
  const pKullanildi = new Array(pdf.length).fill(false);
  const eKullanildi = new Array(excel.length).fill(false);

  for(let i=0;i<pdf.length;i++){
    const p = pdf[i];
    let j = -1;
    for(let k=0;k<excel.length;k++){
      if(eKullanildi[k]) continue;
      if(_eslesirMi(p, excel[k])){ j = k; break; }
    }
    if(j<0) continue;
    pKullanildi[i]=true; eKullanildi[j]=true;
    const e = excel[j];

    // K1 + MK-133.3: kategoriye gore kiyas
    const sapmalar=[];
    if(p.pt==='boru'){
      // boy primary (sert), agirlik soft (genis tol), adet IGNORE (PDF=parca, Excel=tek satir)
      if(!_yakin(p.boy_mm, e.boy_mm, TOL_BORU_BOY))
        sapmalar.push({alan:'boy_mm', pdf:_r(p.boy_mm), excel:_r(e.boy_mm)});
      if(!_yakin(p.agirlik_kg, e.agirlik_kg, TOL_BORU_AG))
        sapmalar.push({alan:'agirlik_kg', pdf:_r(p.agirlik_kg), excel:_r(e.agirlik_kg), seviye:'soft'});
    } else if(p.pt==='dirsek'){
      // MK-133.3: dirsek 90 stoktan farkli acilarla kesilir (45/60/20...);
      // artan parca FIRE degil geri-stok. Adet kiyasi anlamsiz; malzeme-korunumu invarianti:
      // PDF toplam dirsek agirligi ≈ Excel toplam dirsek agirligi (±%15, fire/aci-detay yoklugu).
      // Aci verisi PDF'te yoksa toplam-agirlik tek invariant; aci akmaya baslayinca v2 rafine eder.
      if(!_yakin(p.agirlik_kg, e.agirlik_kg, TOL_DIRSEK_AG))
        sapmalar.push({alan:'agirlik_kg_toplam', pdf:_r(p.agirlik_kg), excel:_r(e.agirlik_kg)});
      // adet ve boy IGNORE (dirsek icin yaniltici)
    } else {
      // diger fitting/montaj/bilezik: adet exact + per-adet agirlik, boy IGNORE
      if(p.adet!=null && e.adet!=null && p.adet!==e.adet)
        sapmalar.push({alan:'adet', pdf:p.adet, excel:e.adet});
      // MK-133.2: Excel agirlik_kg satir-toplami; per-adet = agirlik/adet
      const pPer = (p.adet>0) ? p.agirlik_kg/p.adet : p.agirlik_kg;
      const ePer = (e.adet>0) ? e.agirlik_kg/e.adet : e.agirlik_kg;
      if(!_yakin(pPer, ePer, TOL_FIT_AG))
        sapmalar.push({alan:'agirlik_kg_per_adet', pdf:_r(pPer), excel:_r(ePer)});
    }
    const kayit = { pt:p.pt, kapsam:p.kapsam, cap:p.cap??p.dn, pdf:_ozet(p), excel:_ozet(e), sapmalar };
    const hardSapma = sapmalar.filter(s=>s.seviye!=='soft').length;
    if(hardSapma===0) eslesen.push(kayit); else celiski.push(kayit);
  }

  // 5) Eslesemeyenler — kapsama gore bucket
  const pdf_fazla=[];
  for(let i=0;i<pdf.length;i++){ if(!pKullanildi[i]) pdf_fazla.push(_ozet(pdf[i])); }

  const excel_fazla_fab=[], excel_fazla_montaj=[], excel_fazla_belirsiz=[];
  for(let k=0;k<excel.length;k++){
    if(eKullanildi[k]) continue;
    const oz = _ozet(excel[k]);
    if(excel[k].kapsam==='montaj') excel_fazla_montaj.push(oz);
    else if(excel[k].kapsam==='fab') excel_fazla_fab.push(oz);
    else excel_fazla_belirsiz.push(oz);
  }

  // K2: flag yalniz GERCEK FAB bulgular icin (montaj/belirsiz/islem alarm degil, info)
  const flagVar = (celiski.length
                 + pdf_fazla.filter(p=>p.kapsam==='fab').length
                 + excel_fazla_fab.length) > 0;

  return {
    meta: { excel_guven: excelGuven, lib_versiyon: 'k2-v3' },
    eslesen_sayisi: eslesen.length,
    celiski_sayisi: celiski.length,
    pdf_fazla_sayisi: pdf_fazla.length,
    excel_fazla_fab_sayisi: excel_fazla_fab.length,
    excel_fazla_montaj_sayisi: excel_fazla_montaj.length,
    excel_fazla_belirsiz_sayisi: excel_fazla_belirsiz.length,
    islem_pdf_sayisi: islemler_pdf.length,
    islem_excel_sayisi: islemler_excel.length,
    flagVar,
    eslesen, celiski, pdf_fazla,
    excel_fazla_fab, excel_fazla_montaj, excel_fazla_belirsiz,
    islemler_pdf, islemler_excel
  };
}

export { malzemeKiyas };
export default { malzemeKiyas };
