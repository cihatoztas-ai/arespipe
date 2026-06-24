#!/usr/bin/env python3
# KK v3 — iki kademe accordion + belgeler popup (görsel kabuk) + G-05 renk fix
# İdempotent · .bak yedek · anchor eşleşmezse ABORT (hiç yazmaz). İş mantığı DOKUNULMAZ.
import sys, os, shutil

_RENDER_BLOK = r"""/* ───────── AÇIK / ARŞİV — iki kademe accordion (mockup v3) ───────── */
function _gemiOzet(d){
  var p=[...new Set(d.spoollar.map(function(s){return s._proje_no;}).filter(Boolean))];
  if(!p.length)return '—'; if(p.length===1)return esc(p[0]); return p.length+' '+tvv('kk_gemi','gemi');
}
function _tersPill(ad){return '<span class="ters">'+esc(ad)+'</span>';}
function paketTablo(list,arsiv){
  if(!list.length)return '<div class="bos">'+(arsiv?tvv('kk_bos_arsiv','Arşivde davet yok.'):tvv('kk_bos_acik','Açık davetiye yok.'))+'</div>';
  var sonBas=arsiv?tvv('kk_th_sonuc','Sonuç'):tvv('kk_th_durum','Durum');
  var h='<table class="kk"><colgroup>'
    +'<col style="width:34px"><col style="width:30px"><col style="width:120px"><col style="width:92px">'
    +'<col><col style="width:118px"><col style="width:74px"><col style="width:96px"><col style="width:118px"><col style="width:132px">'
    +'</colgroup><thead><tr>'
    +'<th class="cchev"></th><th></th><th>'+tvv('kk_th_davet','Davet / Tersane')+'</th><th>'+tvv('kk_th_gemi','Gemi')+'</th>'
    +'<th>'+tvv('kk_th_devre','Devre')+'</th><th>'+sonBas+'</th>'
    +'<th class="num">'+tvv('kk_th_spool','Spool')+'</th><th class="num">'+tvv('cmn_agirlik','Ağırlık')+'</th>'
    +'<th>'+tvv('cmn_malzeme','Malzeme')+'</th><th class="num">'+tvv('kk_th_islem','İşlem')+'</th></tr></thead><tbody>';
  list.forEach(function(d){
    var pid=d.id, gruplar=devreGrupla(d.spoollar);
    var onay=d.spoollar.filter(function(s){return s._sonuc==='gecti';}).length;
    var ret=d.spoollar.filter(function(s){return s._sonuc==='tamir'||s._sonuc==='hatali';}).length;
    var kg=grupAgirlik(d.spoollar), tarih=(d.tarih||'').split('-').reverse().join('.');
    var sonCell, sonKol;
    if(arsiv){
      var kap=d.kapanis_ts?new Date(d.kapanis_ts).toLocaleDateString('tr-TR'):'—';
      sonCell='<span class="okc">'+onay+'</span> / <span class="retc">'+ret+'</span>';
      sonKol='<span class="pdate">'+tvv('kk_kapanis','kapanış')+' '+esc(kap)+'</span>';
    }else{
      sonCell='<span class="son sonbek">'+tvv('kk_durum_bekliyor','Bekliyor')+'</span>';
      sonKol='<span class="pdate">'+tvv('kk_davet','davet')+' '+esc(tarih)+'</span>';
    }
    var islem='<div class="pact" onclick="event.stopPropagation()">'
      +'<span class="iconbtn" title="'+tvv('kk_belgeler','Belgeler')+'" onclick="belgeAc(\''+esc(d.davet_no)+'\')">📁</span>';
    islem+= d.pdf_yolu ? '<span class="iconbtn" title="PDF" onclick="window.open(\''+esc(d.pdf_yolu)+'\')">📄</span>'
                       : '<span class="iconbtn dis" title="'+tvv('kk_pdf_yok','PDF yok')+'">📄</span>';
    if(!arsiv)islem+='<button class="btn btn-pri sm" onclick="sonucAc(\''+pid+'\')">'+tvv('kk_btn_sonuc','Sonuç Gir')+'</button>';
    islem+='</div>';
    h+='<tr class="prow" onclick="pktTgl(\''+pid+'\',this)">'
      +'<td class="cchev"><span class="chev">▶</span></td><td class="cidx">·</td>'
      +'<td><span class="no">'+esc(d.davet_no)+'</span><div class="psub">'+_tersPill(d._tersane)+'</div></td>'
      +'<td class="gemi">'+_gemiOzet(d)+'</td>'
      +'<td class="devre-ad">'+gruplar.length+' '+tvv('kk_sec_devre','devre')+'</td>'
      +'<td>'+sonCell+'</td>'
      +'<td class="num"><span class="ratio">'+d.spoollar.length+'</span></td>'
      +'<td class="num agir">'+_fmt(kg)+' kg</td>'
      +'<td>'+sonKol+'</td><td class="num">'+islem+'</td></tr>';
    gruplar.forEach(function(g){
      var top=_devreToplam[g.devre_id]||g.spoollar.length;
      var dOnay=g.spoollar.filter(function(s){return s._sonuc==='gecti';}).length;
      var dRet=g.spoollar.filter(function(s){return s._sonuc==='tamir'||s._sonuc==='hatali';}).length;
      var dSon=arsiv?'<span class="okc">'+dOnay+'</span>/<span class="retc">'+dRet+'</span>'
                    :'<span class="son sonbek">'+tvv('kk_durum_bekliyor','bekliyor')+'</span>';
      h+='<tr class="grow drow" data-pkg="'+pid+'" onclick="devreTgl(this)">'
        +'<td class="cchev"><span class="chev">▶</span></td><td class="cidx"></td>'
        +'<td>'+_tersPill(g.tersane)+'</td><td class="gemi">'+esc(g.proje_no||'—')+'</td>'
        +'<td class="devre-ad">'+esc(g.devre_no||'—')+'</td><td class="zone">'+(g.zone?esc(g.zone):'—')+'</td>'
        +'<td class="num"><span class="ratio">'+g.spoollar.length+'/'+top+'</span></td>'
        +'<td class="num agir">'+_fmt(grupAgirlik(g.spoollar))+' kg</td>'
        +'<td>'+matBadge(g.spoollar[0].malzeme)+'</td><td class="num">'+dSon+'</td></tr>';
      var sub='<table class="sub"><thead><tr><th>#</th><th>'+tvv('kk_th_marka','Marka')+'</th><th>Rev</th><th>Spool ID</th>'
        +'<th class="num">Çap</th><th class="num">Et</th><th class="num">'+tvv('cmn_agirlik','Ağırlık')+'</th>'
        +'<th>'+tvv('cmn_malzeme','Malzeme')+'</th><th>'+tvv('kk_th_sonuc','Sonuç')+'</th></tr></thead><tbody>';
      g.spoollar.forEach(function(s,i){
        var snc='<span class="son '+sonucCls(s._sonuc)+'">'+esc(sonucEtiket(s._sonuc))+'</span>'
          +((s._sonuc==='tamir'&&s._not)?' <span class="snnot">· '+esc(s._not)+'</span>':'');
        sub+='<tr><td>'+(i+1)+'</td><td class="mrk">'+esc(marka(s))+'</td><td>'+esc(s.rev||'—')+'</td>'
          +'<td class="sid">'+esc(markaId(s.spool_id))+'</td><td class="num">'+_fmt(s.dis_cap_mm)+'</td>'
          +'<td class="num">'+_fmt(s.et_mm)+'</td><td class="num">'+_fmt(s.agirlik)+' kg</td>'
          +'<td>'+matBadge(s.malzeme)+'</td><td>'+snc+'</td></tr>';
      });
      sub+='</tbody></table>';
      h+='<tr class="subrow" data-pkg="'+pid+'"><td colspan="10"><div class="subwrap">'+sub+'</div></td></tr>';
    });
  });
  h+='</tbody></table>'; return h;
}
function acikRender(){document.getElementById('acikListe').innerHTML=paketTablo(ACIK,false);}
function arsivRender(){document.getElementById('arsivListe').innerHTML=paketTablo(ARSIV,true);}
function pktTgl(pid,row){
  row.classList.toggle('open'); var open=row.classList.contains('open');
  document.querySelectorAll('tr.drow[data-pkg="'+pid+'"],tr.subrow[data-pkg="'+pid+'"]').forEach(function(r){
    if(r.classList.contains('subrow')){r.style.display='none';}
    else{r.style.display=open?'':'none';r.classList.remove('open');}
  });
}
function devreTgl(row){
  row.classList.toggle('open'); var sub=row.nextElementSibling;
  if(sub&&sub.classList.contains('subrow'))sub.style.display=row.classList.contains('open')?'':'none';
}
function belgeAc(no){document.getElementById('belgeNo').textContent=no;modAc('m-belge');}
function belgeKapat(){modKapat('m-belge');}"""

_BELGE_MODAL = r"""<!-- ════ MODAL: BELGELER (görsel kabuk — storage bağı sonraki parça) ════ -->
<div id="m-belge" class="modbg gizli">
  <div class="mod gen">
    <div class="modh"><h2><span data-i18n="kk_belgeler">Davet Belgeleri</span> — <span class="no" id="belgeNo"></span></h2><button class="x" onclick="modKapat('m-belge')">×</button></div>
    <div class="belge-defer">ⓘ <span data-i18n="kk_belge_defer">Galeri / not / belge görsel taslaktır — Storage bağı ve kapsam modeli (paket/spool) sonraki parçada kodlanacak.</span></div>
    <div class="belge-sec">
      <h4>🖼 <span data-i18n="kk_belge_galeri">Resim Galerisi</span></h4>
      <div class="gallery"><div class="gitem add">＋ <span data-i18n="kk_belge_foto_ekle">Foto ekle</span></div></div>
    </div>
    <div class="belge-sec">
      <h4>📝 <span data-i18n="kk_belge_notlar">Davet Notları</span></h4>
      <textarea class="notearea" data-i18n-placeholder="kk_belge_not_ph" placeholder="Bu davet paketine not ekle…"></textarea>
      <div style="text-align:right;margin-top:8px;"><button class="btn sm" disabled data-i18n="kk_belge_not_ekle">Not Ekle</button></div>
    </div>
    <div class="belge-sec">
      <h4>📄 <span data-i18n="kk_belgeler">Belgeler</span></h4>
      <div class="filelist"><div class="fileitem add"><span>＋</span><span class="nm" data-i18n="kk_belge_ekle">Belge ekle — kapsam seç (tüm paket / spool)</span></div></div>
    </div>
    <div class="modf"><button class="btn btn-gho ml-a" onclick="modKapat('m-belge')" data-i18n="cmn_kapat">Kapat</button></div>
  </div>
</div>"""


F = sys.argv[1] if len(sys.argv) > 1 else "kalite_kontrol.html"
MARK = "/* KK-V3-ACCORDION */"

with open(F, encoding="utf-8") as fh:
    s = fh.read()

if MARK in s:
    print("⏭  Zaten uygulanmış (marker bulundu). Çıkılıyor, dosya değişmedi.")
    sys.exit(0)

def need(sub, n=1, label=""):
    c = s.count(sub)
    if c != n:
        print(f"✗ ABORT: anchor '{label or sub[:40]}' {n} kez beklendi, {c} bulundu. Dosya YAZILMADI.")
        sys.exit(1)

# ── 1) G-05 renk fix (mb-*) ──
OLD_MB = """.mb-celik{background:rgba(100,116,139,.16);color:#94a3b8;border:1px solid rgba(100,116,139,.3);}
.mb-pas  {background:rgba(45,142,255,.12);color:#5aa8ff;border:1px solid rgba(45,142,255,.3);}
.mb-bakir{background:rgba(193,84,40,.14);color:#e08a5a;border:1px solid rgba(193,84,40,.32);}
.mb-alum {background:rgba(124,58,237,.12);color:#a78bfa;border:1px solid rgba(124,58,237,.3);}
.mb-diger{background:var(--sur2);color:var(--txm);border:1px solid var(--bor);}"""
NEW_MB = """.mb-celik{background:rgba(45,142,255,.12);color:var(--ac);border:1px solid rgba(45,142,255,.28);}   /* karbon → mavi (G-05) */
.mb-pas  {background:rgba(124,58,237,.12);color:var(--leg);border:1px solid rgba(124,58,237,.28);}  /* paslanmaz → mor */
.mb-bakir{background:rgba(217,119,6,.12);color:var(--warn);border:1px solid rgba(217,119,6,.28);}   /* bakır → amber */
.mb-alum {background:rgba(22,163,110,.12);color:var(--gr);border:1px solid rgba(22,163,110,.28);}   /* alüm → yeşil */
.mb-diger{background:var(--sur2);color:var(--txm);border:1px solid var(--bor);}                      /* diğer → gri */"""
need(OLD_MB, 1, "mb-* G-05 bloğu")

# ── 2) CSS ekle (</style> öncesi) ──
NEW_CSS = MARK + """
/* ── İKİ KADEME ACCORDION TABLOSU (mockup v3) ── */
.kk{width:100%;border-collapse:collapse;background:var(--sur);border:1px solid var(--bor);border-radius:13px;overflow:hidden;table-layout:fixed;}
.kk thead th{text-align:left;font-size:10.5px;font-weight:600;color:var(--txd);text-transform:uppercase;letter-spacing:.4px;padding:11px 12px;background:var(--sur2);border-bottom:1px solid var(--bor);white-space:nowrap;overflow:hidden;}
.kk thead th.num{text-align:right;}
.kk td{padding:12px;border-bottom:1px solid var(--bor);vertical-align:middle;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--tx);}
.kk td.num{text-align:right;}
.kk .cchev{text-align:center;padding-left:4px;padding-right:4px;}
.chev{display:inline-block;color:var(--txd);font-size:10px;transition:transform .15s;}
.prow.open .chev,.grow.open .chev{transform:rotate(90deg);color:var(--ac);}
.prow{cursor:pointer;background:var(--sur);transition:background .12s;}
.prow:hover{background:var(--sur2);}
.prow.open>td{background:rgba(45,142,255,.07);}
.psub{margin-top:3px;}
.grow.drow{cursor:pointer;background:var(--sur);}
.grow.drow:hover{background:var(--sur2);}
.grow.drow>td{padding-left:18px;}
.kk tr.drow,.kk tr.subrow{display:none;}
.cidx{color:var(--txd);font-size:12px;}
.ters{display:inline-block;font-size:11px;font-weight:600;padding:2px 9px;border-radius:7px;background:var(--sur2);color:var(--txm);border:1px solid var(--bor);}
.gemi{color:var(--ac);font-weight:600;font-size:13px;}
.devre-ad{font-size:13px;color:var(--tx);}
.zone{font-size:12px;color:var(--txm);}
.ratio{display:inline-block;font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:14px;color:var(--ac);background:rgba(45,142,255,.12);padding:3px 9px;border-radius:7px;}
.agir{color:var(--txm);}
.okc{color:var(--gr);font-weight:700;}.retc{color:var(--re);font-weight:700;}
.pdate{font-size:12px;color:var(--txm);}
.pact{display:flex;align-items:center;gap:6px;justify-content:flex-end;}
.iconbtn{background:var(--sur2);border:1px solid var(--bor);border-radius:8px;width:30px;height:30px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;transition:border-color .12s;}
.iconbtn:hover{border-color:var(--ac);}
.iconbtn.dis{opacity:.4;cursor:default;}.iconbtn.dis:hover{border-color:var(--bor);}
.btn.sm{padding:5px 11px;font-size:12px;}
.subrow>td{padding:0;background:var(--sur2);}
.subwrap{padding:4px 12px 12px 30px;}
table.sub{width:100%;border-collapse:collapse;font-size:12.5px;table-layout:fixed;background:var(--sur);border:1px solid var(--bor);border-radius:9px;overflow:hidden;}
table.sub thead th{text-align:left;font-size:10px;font-weight:600;color:var(--txd);text-transform:uppercase;letter-spacing:.3px;padding:7px 9px;background:var(--sur2);}
table.sub thead th.num{text-align:right;}
table.sub td{padding:8px 9px;border-top:1px solid var(--bor);color:var(--tx);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
table.sub td.num{text-align:right;}
.snnot{font-size:11px;color:var(--txm);}
/* ── BELGELER POPUP (görsel kabuk — storage bağı sonraki parça) ── */
.belge-defer{font-size:12px;color:var(--txm);background:var(--sur2);border-radius:8px;padding:9px 12px;margin:14px 18px 0;line-height:1.5;}
.belge-sec{padding:14px 18px;border-bottom:1px solid var(--bor);}
.belge-sec:last-child{border-bottom:none;}
.belge-sec h4{margin:0 0 10px;font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:700;color:var(--tx);text-transform:uppercase;letter-spacing:.4px;}
.gallery{display:flex;gap:10px;overflow-x:auto;padding-bottom:6px;scroll-snap-type:x mandatory;}
.gallery::-webkit-scrollbar{height:7px;}.gallery::-webkit-scrollbar-thumb{background:var(--bor);border-radius:4px;}
.gitem{flex:0 0 150px;aspect-ratio:4/3;scroll-snap-align:start;border-radius:10px;background:var(--sur2);border:1px solid var(--bor);position:relative;overflow:hidden;display:flex;align-items:flex-end;cursor:pointer;}
.gitem .scope{position:absolute;top:7px;left:7px;font-size:10px;font-weight:700;padding:2px 7px;border-radius:6px;background:rgba(0,0,0,.35);}
.gitem .scope.spool{color:#c4b5fd;}.gitem .scope.paket{color:#93c5fd;}
.gitem .cap{width:100%;padding:6px 8px;font-size:11px;color:var(--tx);background:linear-gradient(transparent,rgba(0,0,0,.5));}
.gitem.add{flex:0 0 110px;background:var(--sur2);border-style:dashed;align-items:center;justify-content:center;color:var(--txd);font-size:13px;}
.gitem.add:hover{border-color:var(--ac);color:var(--ac);}
.notearea{width:100%;min-height:70px;border:1px solid var(--bor);border-radius:10px;padding:10px 12px;font-family:inherit;font-size:13px;color:var(--tx);background:var(--sur2);resize:vertical;}
.filelist{display:flex;flex-direction:column;gap:8px;}
.fileitem{display:flex;align-items:center;gap:10px;background:var(--sur2);border:1px solid var(--bor);border-radius:9px;padding:9px 12px;font-size:12.5px;color:var(--tx);}
.fileitem .nm{flex:1;}
.fileitem.add{border-style:dashed;cursor:pointer;color:var(--txd);}
.fileitem.add:hover{border-color:var(--ac);color:var(--ac);}
.fscope{font-size:10px;font-weight:700;padding:2px 8px;border-radius:6px;}
.fscope.paket{color:var(--ac);background:rgba(45,142,255,.12);}
.fscope.spool{color:var(--leg);background:rgba(124,58,237,.12);}
</style>"""
need("</style>", 1, "</style>")

# ── 3) Tab etiketi + page-alt ──
OLD_TAB = '<span data-i18n="kk_tab_havuz">Havuz</span>'
NEW_TAB = '<span data-i18n="kk_tab_havuz">Davet Bekleyenler</span>'
need(OLD_TAB, 1, "tab etiketi Havuz")
OLD_ALT = '<div class="page-alt" data-i18n="kk_alt">Havuz · Açık Davetiyeler · Arşiv — üçü de aynı açılır devre tablosu. Başlık: tersane / gemi / devre / zone / malzeme / ağırlık / adet oranı.</div>'
NEW_ALT = '<div class="page-alt" data-i18n="kk_alt">Davet Bekleyenler · Açık Davetiyeler · Arşiv. Açık/Arşiv iki kademe açılır: paket → devre → spool. Renkler aktif devreler ile aynı.</div>'
need(OLD_ALT, 1, "page-alt")

# ── 4) AÇIK/ARŞİV render span'i (iki marker arası) ──
A = '/* ───────── AÇIK / ARŞİV ───────── */'
B = '/* ───────── SONUÇ GİR ───────── */'
need(A, 1, "AÇIK/ARŞİV başlık"); need(B, 1, "SONUÇ GİR başlık")
NEW_RENDER = _RENDER_BLOK

# ── 5) Belgeler modal (toast öncesi) ──
TOAST = '<div id="toast"></div>'
need(TOAST, 1, "toast div")
BELGE_MODAL = _BELGE_MODAL

# ════ UYGULA (tüm anchor'lar doğrulandı) ════
shutil.copy(F, F + ".bak")
s = s.replace(OLD_MB, NEW_MB)
s = s.replace("</style>", NEW_CSS, 1)
s = s.replace(OLD_TAB, NEW_TAB)
s = s.replace(OLD_ALT, NEW_ALT)
i = s.index(A); j = s.index(B)
s = s[:i] + NEW_RENDER + "\n\n" + s[j:]
s = s.replace(TOAST, BELGE_MODAL + "\n\n" + TOAST, 1)

with open(F, "w", encoding="utf-8") as fh:
    fh.write(s)

print("✅ Uygulandı.  Yedek:", F + ".bak")
print("   </html> sayısı:", s.count("</html>"), "(1 olmalı)")
print("   marker:", s.count(MARK), "· paketTablo:", s.count("function paketTablo"),
      "· belgeAc:", s.count("function belgeAc"), "· m-belge:", s.count('id="m-belge"'))
