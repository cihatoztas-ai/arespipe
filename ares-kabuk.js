// ares-kabuk.js — AresPipe kabuk-first ortak modülü (109. oturum / A-yolu)
//
// Amaç: Excel BOM parse_sonuc'undan spool KABUĞU oluşturmayı TEK YERE topla.
//   - 108'e kadar INSERT mantığı yalnız devre_detay.html > onayAktar içindeydi.
//     Wizard sadece önizliyordu → kullanıcı spool oluşturmak için devre_detay'a
//     gidip Excel'i bulup "Aktar"lamak zorundaydı (dolambaç). Bu modül onu çözer:
//     wizard da, devre_detay da aynı `aktar()`'ı çağırır.
//   - Bu kod devre_detay'ın KANITLI onayAktar gövdesinin AYNEN taşınmış halidir
//     (108 dersi: çalışan kodu yeniden yazma, hizala). DOM/toast/reload soyuldu;
//     onlar çağırana ait. Çoklu kuyruk id desteği eklendi (wizard N BOM Excel yükleyebilir).
//
// Bağımlılıklar (her iki sayfada da global):
//   - ARES.sonrakiNo('spool')   (ares-store.js)
//   - ARES_NORM.malzemeKod(ham) (ares-normalize.js)
//
// Script yükleme sırası:
//   ares-store.js → ares-lang.js → ares-normalize.js → ares-kabuk.js → ares-layout.js
//
// Mimari kararlar:
//   MK-WIZARD.3 — kabuk kilidi (idempotency): devrede mevcut (pipeline_no, spool_no, rev)
//                 tekrar yazılmaz. Bu kontrol modülün İÇİNDE → iki taraf da otomatik korur.
//   MK-108.2    — tarihsel ikiz kolonlar (agirlik/agirlik_kg, durum/is_durumu): expand fazı
//                 ikisine de yazar (yeni tutarsızlık yaratma). Temizlik ayrı oturum.
//   MK-108.3    — cizim_durumu = kabuk veri-olgunluk ekseni (üretim durumundan ayrı).
//
// Son güncelleme: 21 Mayıs 2026 (109. oturum — A-yolu: onayAktar + _onayGrupla + _onayBoyut taşındı)

(function(g){
  'use strict';

  // ── BOYUT: boyut metni + malzeme → {dis_cap, et}.
  //    111/Karar-B (MK-110.3): fakir DN-tablosu mantığı KALDIRILDI. Artık tek ortak metin parser
  //    ARES_OLCU.olcuParse çağrılır — SCH/inç ("4\" Sch 10S") çözülür, et lookup ARES_BORU'dan gelir.
  //    Eski kabuk parseFloat("4")=4 ham çap / et=null hatası bu sayede biter.
  //    ARES_OLCU yüklenmemişse (script sırası bozuksa) boş + warn — sessiz fallback YOK (kopya bırakma).
  function boyutParse(dn, malzeme){
    var O = (typeof ARES_OLCU !== 'undefined' && ARES_OLCU) ? ARES_OLCU
          : (typeof window !== 'undefined' && window.ARES_OLCU) ? window.ARES_OLCU
          : (typeof globalThis !== 'undefined' && globalThis.ARES_OLCU) ? globalThis.ARES_OLCU
          : null;
    if(!O){ console.warn('[kabuk] ARES_OLCU yuklenmemis — boyut parse atlandi (script sirasi?)'); return {dis_cap:null,et:null}; }
    var r = O.olcuParse(dn, malzeme);
    return {dis_cap:r.dis_cap, et:r.et};   // çağıranlar yalnız dis_cap/et kullanıyor; dn/sch sessizce yutulur
  }

  // ── YÜZEY: kabuk satırlarından spool yüzeyi türet (109/B1).
  //    Önce r.yuzey alanı, sonra system token'ı ("M100-Galv"). Ham etiket döner ("Galvaniz");
  //    koda çevirim aktar()'da ARES_NORM.yuzeyKod ile yapılır. (wizard.yuzeyCikar ile AYNI mantık —
  //    önizleme [kabukTuret] ile INSERT [grupla] aynı yüzeyi göstersin diye birebir.)
  function _yuzeyTokenden(s){
    var n=String(s||'').toLowerCase();
    if(n.indexOf('galv')!==-1)return 'Galvaniz';
    if(n.indexOf('boyal')!==-1||n.indexOf('boya')!==-1||n.indexOf('paint')!==-1)return 'Boyalı';
    if(n.indexOf('asit')!==-1||n.indexOf('pickl')!==-1)return 'Asitleme';
    if(n.indexOf('epoks')!==-1||n.indexOf('epoxy')!==-1)return 'Epoksi';
    return '';
  }
  function _yuzeyHamCikar(rows){
    for(var i=0;i<rows.length;i++){ if(rows[i].yuzey){ var y=_yuzeyTokenden(rows[i].yuzey); return y||String(rows[i].yuzey).trim(); } }
    for(var j=0;j<rows.length;j++){ if(rows[j].system){ var y2=_yuzeyTokenden(rows[j].system); if(y2)return y2; } }
    return '';
  }

  // ── GRUPLA: parse_sonuc.satirlar → gruplu spool modeli (gruplama + aynı özellikteki kalemleri topla)
  //    (devre_detay._onayGrupla AYNEN). ps: { satirlar:[...], secilen, guven }
  //    Dönen: { spoollar:[{pipeline,spoolNo,rev,anaMalzeme,toplamKg,cap,et,yuzeyHam,bom:[...]}], atanmamis, secilenSayfa, guven }
  function grupla(ps){
    var rows=ps.satirlar||[];
    function tipBelirle(tanim){
      var t=(tanim||'').toLowerCase();
      return (t.indexOf('pipe')>=0||t.indexOf('tube')>=0||t.indexOf('boru')>=0)?'boru':'fitting';
    }
    function konsolide(kalemler){
      var map={},sira=[];
      kalemler.forEach(function(r){
        var tip=tipBelirle(r.tanim);
        var k=(r.tanim||'')+'|'+(r.malzeme||'')+'|'+(r.dn||'')+'|'+(r.aci||'')+'|'+tip;
        if(!map[k]){map[k]={tip:tip,tanim:r.tanim||'',malzeme:r.malzeme||'',dn:r.dn||'',aci:(r.aci!=null?r.aci:''),standart:r.standart||'',ifs_kod:r.ifs_kod||'',boy_mm:0,adet:0,agirlik_kg:0};sira.push(k);}
        var c=map[k];
        if(tip==='boru'){c.boy_mm+=(parseFloat(r.uzunluk_mm)||0);}else{c.adet+=(parseFloat(r.adet)||0);}
        c.agirlik_kg+=(parseFloat(r.agirlik_kg)||0);
      });
      return sira.map(function(k){return map[k];});
    }
    var spoolMap={},sirayla=[],atanmamis=[];
    rows.forEach(function(r){
      var sn=(r.spool_no||'').trim();
      if(!sn){atanmamis.push(r);return;}
      var key=(r.pipeline_no||'').trim()+'|'+sn+'|'+(r.rev||'').trim();
      if(!spoolMap[key]){spoolMap[key]={pipeline:(r.pipeline_no||'').trim(),spoolNo:sn,rev:(r.rev||'').trim(),kalemler:[]};sirayla.push(key);}
      spoolMap[key].kalemler.push(r);
    });
    // Karar 2: spool_no'suz satırlar — pipeline'da tek spool varsa ona bağla, çoksa Atanmamış
    if(atanmamis.length){
      var plSpools={};
      sirayla.forEach(function(k){var s=spoolMap[k];(plSpools[s.pipeline]=plSpools[s.pipeline]||[]).push(k);});
      var kalan=[];
      atanmamis.forEach(function(r){
        var hedef=plSpools[(r.pipeline_no||'').trim()];
        if(hedef&&hedef.length===1){spoolMap[hedef[0]].kalemler.push(r);}else{kalan.push(r);}
      });
      atanmamis=kalan;
    }
    var spoollar=sirayla.map(function(k){
      var s=spoolMap[k];
      var mc={};s.kalemler.forEach(function(r){if(r.malzeme){mc[r.malzeme]=(mc[r.malzeme]||0)+1;}});
      var anaMalzeme=Object.keys(mc).sort(function(a,b){return mc[b]-mc[a];})[0]||'';
      var topKg=s.kalemler.reduce(function(t,r){return t+(parseFloat(r.agirlik_kg)||0);},0);
      var bom=konsolide(s.kalemler);
      // 139/MK-139.1: çap/et spool BAŞLIĞINDA türet (taslak=terfi). aktar()'daki (satır 174-175) anaBoru→boyutParse
      //   AYNEN buraya taşındı — tek kaynak. Önce yalnız aktar()'da koşuyordu → grupla başlığı cap'siz kalıyor,
      //   wizard inceleme modalı s.cap/s.et okuyup "—" gösteriyor, terfide doluyor ("canlıya geçince çap çıkıyor"
      //   sürprizi). Şimdi taslak önizleme = terfi. boyutParse ARES_OLCU yoksa {null,null} döner (zararsız guard).
      var anaBoru=bom.filter(function(b){return b.tip==='boru';}).sort(function(a,b){return (b.boy_mm||0)-(a.boy_mm||0);})[0];
      var bp=boyutParse(anaBoru?anaBoru.dn:'', anaBoru?anaBoru.malzeme:'');
      return {pipeline:s.pipeline,spoolNo:s.spoolNo,rev:s.rev,anaMalzeme:anaMalzeme,toplamKg:topKg,cap:bp.dis_cap,et:bp.et,yuzeyHam:_yuzeyHamCikar(s.kalemler),bom:bom};
    });
    return {spoollar:spoollar,atanmamis:atanmamis,secilenSayfa:ps.secilen||'',guven:ps.guven||0};
  }

  // ── AKTAR: kabuk modelinden spooller + spool_malzemeleri INSERT (idempotent).
  //    (devre_detay.onayAktar gövdesi AYNEN — DOM/toast/reload soyuldu, parametrize edildi.)
  //
  //    opts = {
  //      supa,                 // Supabase client (zorunlu)
  //      tid,                  // tenant_id (zorunlu)
  //      devreId,              // devre id (zorunlu)
  //      spoollar,             // grupla().spoollar (zaten seçilmiş/filtrelenmiş aday liste, zorunlu)
  //      yuzey,                // opsiyonel TEK yüzey kodu (tüm spool'lara — devre_detay modalı böyle)
  //      perSpoolYuzey,        // 109/B1: true ise her spool kendi yuzeyHam'ından kod alır (wizard).
  //                            //   yuzeyHam boşsa yine `yuzey` param'ına düşer. devre_detay GÖNDERMEZ
  //                            //   → eski davranış (tek yüzey) korunur, sıfır regresyon.
  //      kuyrukIds             // opsiyonel: tamamlandı işaretlenecek dosya_isleme_kuyrugu id dizisi
  //                            //   (devre_detay tek id → [id]; wizard N BOM Excel → tümü)
  //      duzeltmeler           // 143/G2a opsiyonel: { (pipeline|spoolNo): {cap,et,agirlik,malzeme,kalite,
  //                            //   yuzey,alistirma} } — operatör düzeltmeleri spool BAŞLIĞINI ezer.
  //                            //   devre_detay göndermez → eski davranış korunur (sıfır regresyon).
  //    }
  //    Dönen (Promise):
  //      { ok:true, eklenen:N, atlananlar:[spoolNo...], idMap }
  //      { ok:false, hata:'...' }   ya da   { ok:false, hata:msg, error }
  async function aktar(opts){
    opts=opts||{};
    var supa=opts.supa, tid=opts.tid, devreId=opts.devreId;
    var spoollar=(opts.spoollar||[]).slice();
    var yuzeySec=opts.yuzey||null;
    var perSpool=opts.perSpoolYuzey===true;
    var kuyrukIds=opts.kuyrukIds||[];
    var duzeltmeler=opts.duzeltmeler||null;   // 143/G2a: {(pipeline|spoolNo):{alan:deger}} — opsiyonel, yoksa eski davranış
    if(!supa||!tid||!devreId){return {ok:false,hata:'ortam'};}      // Tenant/devre/db eksik
    if(!spoollar.length){return {ok:false,hata:'sec'};}             // Aktarılacak spool yok

    try{
      var dq=await supa.from('devreler').select('aktif_basamak,basamak_snapshot').eq('id',devreId).maybeSingle();
      var dv=(dq&&dq.data)||{};
      var tq=await supa.from('tenants').select('kod').eq('id',tid).maybeSingle();
      var tkod=(tq&&tq.data&&tq.data.kod)?tq.data.kod:'';
      var malKod=function(ham){return (typeof ARES_NORM!=='undefined'&&ARES_NORM.malzemeKod)?(ARES_NORM.malzemeKod(ham)||null):null;};

      // 108/MK-WIZARD.3: idempotency — kabuk kilidi. Devrede zaten olan (pipeline_no, spool_no, rev)
      // tekrar yazılmaz; aynı BOM iki kez aktarılsa bile spool çoğalmaz. Atlananları çağırana bildir.
      var mevcut=await supa.from('spooller')
        .select('pipeline_no,spool_no,rev')
        .eq('tenant_id',tid).eq('devre_id',devreId).eq('silindi',false);
      var mevcutSet={};
      (mevcut.data||[]).forEach(function(r){mevcutSet[(r.pipeline_no||'')+'|'+r.spool_no+'|'+(r.rev||'')]=true;});
      var atlananlar=[];
      spoollar=spoollar.filter(function(s){
        var k=(s.pipeline||'')+'|'+s.spoolNo+'|'+(s.rev||'');
        if(mevcutSet[k]){atlananlar.push(s.spoolNo);return false;}
        return true;
      });
      if(!spoollar.length){
        // Hepsi zaten mevcut — yeni ekleme yok. Kuyruğu yine de tamamlandı say (iş bitti).
        await _kuyrukKapat(supa,kuyrukIds);
        return {ok:true,eklenen:0,atlananlar:atlananlar};
      }

      // 1) Spooller satırları
      var spoolRows=[];
      for(var i=0;i<spoollar.length;i++){
        var s=spoollar[i];
        var no=await ARES.sonrakiNo('spool');
        var sid=tkod?(tkod+'-'+no):String(no);
        var anaBoru=s.bom.filter(function(b){return b.tip==='boru';}).sort(function(a,b){return (b.boy_mm||0)-(a.boy_mm||0);})[0];
        var bp=boyutParse(anaBoru?anaBoru.dn:'', anaBoru?anaBoru.malzeme:'');
        // 109/B1: per-spool yüzey — perSpoolYuzey=true ise spool kendi yuzeyHam'ından kod alır
        // (önizlemede gösterilen yüzey DB'ye de yazılsın). Boşsa tek `yuzey` param'ına düşer.
        var yz=yuzeySec;
        if(perSpool && s.yuzeyHam && typeof ARES_NORM!=='undefined' && ARES_NORM.yuzeyKod){
          yz=ARES_NORM.yuzeyKod(s.yuzeyHam)||yuzeySec;
        }
        // 143/G2a overlay-B: operatör düzeltmesi (taslak_duzeltmeleri) varsa spool BAŞLIK alanlarını ezer.
        //   duzeltmeler[(pipeline|spoolNo)] = { cap, et, agirlik, malzeme, kalite, yuzey, alistirma } (string).
        //   Sadece spooller başlığı; spool_malzemeleri (BOM kalemleri) bu turda dokunulmaz (ayrı iş).
        //   devre_detay duzeltmeler GÖNDERMEZ → bu blok atlanır, eski davranış korunur (sıfır regresyon).
        var _dzKey=(s.pipeline||'')+'|'+s.spoolNo;
        var _dz=(duzeltmeler && duzeltmeler[_dzKey]) ? duzeltmeler[_dzKey] : null;
        // değer üretimi: düzeltme varsa onu kullan, yoksa parse değeri (sayısal alanlar NaN-güvenli)
        var _sayi=function(v,fb){ if(v==null||v==='')return fb; var n=Number(String(v).replace(',','.')); return isFinite(n)?n:fb; };
        var _capMm = (_dz && _dz.cap!=null && _dz.cap!=='') ? _sayi(_dz.cap, bp.dis_cap) : bp.dis_cap;
        var _etMm  = (_dz && _dz.et!=null  && _dz.et!=='')  ? _sayi(_dz.et,  bp.et)      : bp.et;
        var _agKg  = (_dz && _dz.agirlik!=null && _dz.agirlik!=='') ? _sayi(_dz.agirlik, (s.toplamKg||0)) : (s.toplamKg||0);
        var _malHam = (_dz && _dz.malzeme!=null && _dz.malzeme!=='') ? _dz.malzeme : s.anaMalzeme;
        var _kalite = (_dz && _dz.kalite!=null && _dz.kalite!=='') ? _dz.kalite : (s.anaMalzeme||null);
        var _yuzey  = (_dz && _dz.yuzey!=null && _dz.yuzey!=='') ? _dz.yuzey : yz;
        var _alist  = (_dz && _dz.alistirma!=null && _dz.alistirma!=='') ? _dz.alistirma : null;
        spoolRows.push({
          tenant_id:tid, devre_id:devreId,
          spool_no:s.spoolNo, spool_id:sid,
          pipeline_no:s.pipeline||null, rev:s.rev||'',
          malzeme:malKod(_malHam), kalite:_kalite,
          dis_cap_mm:_capMm, et_kalinligi_mm:_etMm,
          agirlik:_agKg, agirlik_kg:_agKg, yuzey:_yuzey,
          durum:'Bekliyor', is_durumu:'bekliyor', ilerleme:0, durduruldu:false,
          cizim_durumu:'bekliyor',
          aktif_basamak:dv.aktif_basamak||null, basamak_snapshot:dv.basamak_snapshot||null, alistirma:_alist
        });
      }
      var ins=await supa.from('spooller').insert(spoolRows);
      if(ins.error){console.error('[kabuk] spooller:',ins.error);return {ok:false,hata:ins.error.message,error:ins.error};}

      // 2) id eşleştir (pipeline+spool+rev)
      var fr=await supa.from('spooller').select('id,pipeline_no,spool_no,rev').eq('tenant_id',tid).eq('devre_id',devreId);
      var idMap={};(fr.data||[]).forEach(function(r){idMap[(r.pipeline_no||'')+'|'+r.spool_no+'|'+(r.rev||'')]=r.id;});

      // 3) spool_malzemeleri (konsolide BOM)
      var malRows=[];
      spoollar.forEach(function(s){
        var sid=idMap[(s.pipeline||'')+'|'+s.spoolNo+'|'+(s.rev||'')];
        if(!sid)return;
        s.bom.forEach(function(b){
          var bp=boyutParse(b.dn, b.malzeme);
          malRows.push({
            tenant_id:tid, spool_id:sid,
            kod:(b.ifs_kod||(b.tanim||'').substring(0,20)||'IFS'),
            tip:b.tip, tanim:b.tanim||null, boyut:b.dn||null,
            malzeme:malKod(b.malzeme), kalite:b.malzeme||null,
            dis_cap_mm:bp.dis_cap, et_mm:bp.et,
            boy_mm:b.tip==='boru'?(b.boy_mm||null):null,
            adet:b.tip==='fitting'?(Math.round(b.adet||0)||null):null,
            miktar:b.tip==='boru'?((b.boy_mm||0)/1000):(b.adet||0),
            agirlik_kg:b.agirlik_kg||0, ifs_kod:b.ifs_kod||null
          });
        });
      });
      if(malRows.length){var mr=await supa.from('spool_malzemeleri').insert(malRows);if(mr.error)console.warn('[kabuk] spool_malzemeleri:',mr.error.message);}

      // 4) Kuyruk + doküman durumu (çoklu id — wizard N BOM Excel)
      await _kuyrukKapat(supa,kuyrukIds);

      return {ok:true,eklenen:spoollar.length,atlananlar:atlananlar,idMap:idMap};
    }catch(e){
      console.error('[kabuk] aktar:',e);
      return {ok:false,hata:(e&&e.message)||String(e),error:e};
    }
  }

  // Verilen kuyruk id'lerini tamamlandı + bağlı dokümanları parse_durumu=tamamlandi yap.
  async function _kuyrukKapat(supa,kuyrukIds){
    if(!kuyrukIds||!kuyrukIds.length)return;
    for(var i=0;i<kuyrukIds.length;i++){
      var kid=kuyrukIds[i];
      if(!kid)continue;
      try{
        await supa.from('dosya_isleme_kuyrugu').update({durum:'tamamlandi'}).eq('id',kid);
        var kq=await supa.from('dosya_isleme_kuyrugu').select('devre_dokuman_id').eq('id',kid).maybeSingle();
        if(kq&&kq.data&&kq.data.devre_dokuman_id){
          await supa.from('devre_dokumanlari').update({parse_durumu:'tamamlandi'}).eq('id',kq.data.devre_dokuman_id);
        }
      }catch(e){console.warn('[kabuk] kuyruk kapat:',e);}
    }
  }

  // Namespace
  g.ARES_KABUK = {
    boyutParse: boyutParse,
    grupla:     grupla,
    aktar:      aktar,
  };

})(window);
