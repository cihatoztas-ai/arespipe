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

  // ── BOYUT: "60.3x4.5" (OD x et) | "DN50" | "OD:60" | düz sayı → {dis_cap, et}
  //    (devre_detay._onayBoyut + wizard._boyutParse AYNI mantıktı — burada birleşti)
  function boyutParse(dn){
    var s=String(dn||'').trim();
    if(!s)return {dis_cap:null,et:null};
    var mx=s.match(/([\d.,]+)\s*[xX]\s*([\d.,]+)/);
    if(mx)return {dis_cap:parseFloat(mx[1].replace(',','.'))||null, et:parseFloat(mx[2].replace(',','.'))||null};
    var mo=s.match(/OD\s*:?\s*([\d.,]+)/i);
    if(mo)return {dis_cap:parseFloat(mo[1].replace(',','.'))||null, et:null};
    var md=s.match(/DN\s*(\d+)/i);
    if(md){var T={15:21.3,20:26.9,25:33.7,32:42.4,40:48.3,50:60.3,65:76.1,80:88.9,100:114.3,125:139.7,150:168.3,200:219.1,250:273,300:323.9,350:355.6,400:406.4};var dn2=parseInt(md[1],10);return {dis_cap:T[dn2]||null,et:null};}
    var n=parseFloat(s.replace(',','.'));
    return {dis_cap:isFinite(n)?n:null, et:null};
  }

  // ── GRUPLA: parse_sonuc.satirlar → gruplu spool modeli (gruplama + aynı özellikteki kalemleri topla)
  //    (devre_detay._onayGrupla AYNEN). ps: { satirlar:[...], secilen, guven }
  //    Dönen: { spoollar:[{pipeline,spoolNo,rev,anaMalzeme,toplamKg,bom:[...]}], atanmamis, secilenSayfa, guven }
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
        var k=(r.tanim||'')+'|'+(r.malzeme||'')+'|'+(r.dn||'')+'|'+tip;
        if(!map[k]){map[k]={tip:tip,tanim:r.tanim||'',malzeme:r.malzeme||'',dn:r.dn||'',standart:r.standart||'',ifs_kod:r.ifs_kod||'',boy_mm:0,adet:0,agirlik_kg:0};sira.push(k);}
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
      return {pipeline:s.pipeline,spoolNo:s.spoolNo,rev:s.rev,anaMalzeme:anaMalzeme,toplamKg:topKg,bom:konsolide(s.kalemler)};
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
  //      yuzey,                // opsiyonel yüzey kodu (null olabilir)
  //      kuyrukIds             // opsiyonel: tamamlandı işaretlenecek dosya_isleme_kuyrugu id dizisi
  //                            //   (devre_detay tek id → [id]; wizard N BOM Excel → tümü)
  //    }
  //    Dönen (Promise):
  //      { ok:true, eklenen:N, atlananlar:[spoolNo...], idMap }
  //      { ok:false, hata:'...' }   ya da   { ok:false, hata:msg, error }
  async function aktar(opts){
    opts=opts||{};
    var supa=opts.supa, tid=opts.tid, devreId=opts.devreId;
    var spoollar=(opts.spoollar||[]).slice();
    var yuzeySec=opts.yuzey||null;
    var kuyrukIds=opts.kuyrukIds||[];
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
        var bp=boyutParse(anaBoru?anaBoru.dn:'');
        spoolRows.push({
          tenant_id:tid, devre_id:devreId,
          spool_no:s.spoolNo, spool_id:sid,
          pipeline_no:s.pipeline||null, rev:s.rev||'',
          malzeme:malKod(s.anaMalzeme), kalite:s.anaMalzeme||null,
          dis_cap_mm:bp.dis_cap, et_kalinligi_mm:bp.et,
          agirlik:s.toplamKg||0, agirlik_kg:s.toplamKg||0, yuzey:yuzeySec,
          durum:'Bekliyor', is_durumu:'bekliyor', ilerleme:0, durduruldu:false,
          cizim_durumu:'bekliyor',
          aktif_basamak:dv.aktif_basamak||null, basamak_snapshot:dv.basamak_snapshot||null, alistirma:null
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
          var bp=boyutParse(b.dn);
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
