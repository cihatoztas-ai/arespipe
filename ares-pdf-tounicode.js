'use strict';

// ============================================================================
// ares-pdf-tounicode.js — Cadmatic glyph CANVAS onarımı (oturum 161)
// ----------------------------------------------------------------------------
// SORUN (160 devri "Windows/pilot görüntü konusu"): NB1137 Cadmatic export'ları
// ArialMT'yi CID TrueType + Identity-H ile, fontu GÖMMEDEN ve kullanılabilir
// /ToUnicode OLMADAN yazıyor (pdffonts: emb=no, uni=no). pdf.js gömülü olmayan
// fontta glyph→unicode eşlemesini ToUnicode'dan kurar; yokken canvas ÇORBA basar
// (metin katmanı da bozuk doğar — onu glyph-onar.js L1'de onarıyor, canvas'a
// etkisi yok).
//
// KANIT (161 mekanik test): ham CID'ler GERÇEK unicode değerleridir (E120 PDF'i,
// poppler + pdf.js 1.10 çift doğrulama) → doğru ToUnicode = IDENTITY (0x20-0x17F).
// Identity CMap enjekte edilince pdf.js 1.10 getTextContent "SPOOL NAME /
// Ağırlık / Flanş Düz Çelik" okudu; canvas aynı eşlemeyle çizer.
//
// YÖNTEM: PDF'e ARTIMLI güncelleme (orijinal baytlara dokunulmaz, sona eklenir):
//   yeni CMap stream objesi + /ToUnicode referanslı font objesi kopyası +
//   klasik xref alt-bölümü + /Prev'li trailer. Bellekte yapılır, storage'a
//   YAZILMAZ — salt görüntüleme/metin katmanı için.
//
// GÜVENLİK — onarım KAPILIDIR (glyph-onar MK-121.1 ruhu):
//   • Yalnız: /Subtype /Type0 + /Identity-H + /ToUnicode YOK ise uygulanır.
//   • XRef stream (/Type /XRef) veya ObjStm görülürse DOKUNULMAZ (klasik
//     artımlı ekleme o yapılarda geçersiz olabilir) → orijinal döner, sebep raporlanır.
//   • Her hata yolunda orijinal döner; sessiz bozma yok (console.warn + sebep).
// ============================================================================

(function (global) {

  function _lat1(u8) {            // bayt-güvenli string (latin-1)
    var s = '', CH = 0x8000;
    for (var i = 0; i < u8.length; i += CH) s += String.fromCharCode.apply(null, u8.subarray(i, i + CH));
    return s;
  }
  function _bytes(s) {
    var u = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i) & 0xff;
    return u;
  }

  // Identity ToUnicode CMap (0x0020-0x017F; Latin + Latin-1 + Latin Extended-A → Türkçe dahil)
  function _identityCmap() {
    var pairs = [];
    for (var c = 0x20; c < 0x180; c++) {
      var h = c.toString(16).toUpperCase(); while (h.length < 4) h = '0' + h;
      pairs.push('<' + h + '> <' + h + '>');
    }
    var body = '';
    for (var i = 0; i < pairs.length; i += 100) {
      var b = pairs.slice(i, i + 100);
      body += b.length + ' beginbfchar\n' + b.join('\n') + '\nendbfchar\n';
    }
    return '/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n' +
      '/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n' +
      '/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n' +
      '1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n' +
      body + 'endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend';
  }

  // ArrayBuffer|Uint8Array → { data:Uint8Array, uygulandi:bool, sebep:string }
  function onar(buf) {
    var u8 = (buf instanceof Uint8Array) ? buf : new Uint8Array(buf);
    var out = { data: u8, uygulandi: false, sebep: '' };
    try {
      var s = _lat1(u8);

      // Kapı 1: yapı klasik mi?
      if (/\/Type\s*\/XRef/.test(s)) { out.sebep = 'xref_stream'; return out; }
      if (s.indexOf('/ObjStm') !== -1) { out.sebep = 'objstm'; return out; }

      // Kapı 2: ToUnicode'suz Identity-H Type0 fontları bul.
      //   NOT: tek dev regex stream'li objelerde komşuyu yutar (161 testinde kanıtlandı) —
      //   bu yüzden objeler 'N 0 obj' SINIRLARINDAN bölünüp tek tek incelenir.
      var basRe = /(\d+)\s+0\s+obj\b/g, baslar = [], bm;
      while ((bm = basRe.exec(s)) !== null) baslar.push({ num: parseInt(bm[1], 10), ix: bm.index, son: basRe.lastIndex });
      // Artımlı güncellemede aynı obje no birden çok kez geçer — SON sürüm kazanır (PDF kuralı;
      //   idempotency bunun üstüne kurulur: bizim eklediğimiz düzgün sürüm sonda olduğundan ikinci
      //   çağrı hedef bulamaz).
      var sonSurum = {};
      for (var si = 0; si < baslar.length; si++) sonSurum[baslar[si].num] = si;
      var hedefler = [];
      for (var bi = 0; bi < baslar.length; bi++) {
        if (sonSurum[baslar[bi].num] !== bi) continue;                    // eski sürüm — atla
        var govde = s.slice(baslar[bi].son, bi + 1 < baslar.length ? baslar[bi + 1].ix : s.length);
        var eo = govde.indexOf('endobj'); if (eo === -1) continue;
        govde = govde.slice(0, eo);
        if (govde.indexOf('stream') !== -1) continue;                     // stream'li obje font dict'i değil
        if (!/\/Subtype\s*\/Type0\b/.test(govde) || !/\/Encoding\s*\/Identity-H\b/.test(govde)) continue;
        // ToUnicode durumu: yok VEYA Cadmatic'in BOZUK '/ToUnicode /Identity-H' İSMİ (stream ref değil —
        //   161 bulgusu: pdffonts uni=no'nun sebebi; pdf.js geçersiz sayıp atıyor, çorba buradan doğuyor).
        var bozukTU = /\/ToUnicode\s*\/Identity-H\b/.test(govde);
        var tuVar = /\/ToUnicode\b/.test(govde);
        if (tuVar && !bozukTU) continue;                                  // gerçek ToUnicode var → dokunma
        var d0 = govde.indexOf('<<'), d1 = govde.lastIndexOf('>>');
        if (d0 === -1 || d1 === -1) continue;
        hedefler.push({ num: baslar[bi].num, dict: govde.slice(d0, d1 + 2), bozuk: bozukTU });
      }
      if (!hedefler.length) { out.sebep = 'hedef_font_yok'; return out; }

      // Kapı 3: trailer /Size + startxref
      var sizeM = s.match(/\/Size\s+(\d+)/g);
      var sxM = s.match(/startxref\s+(\d+)\s*%%EOF\s*$/);
      if (!sizeM || !sxM) { out.sebep = 'trailer_okunamadi'; return out; }
      var size = parseInt(sizeM[sizeM.length - 1].replace(/\/Size\s+/, ''), 10);
      var prevXref = parseInt(sxM[1], 10);
      var rootM = s.match(/\/Root\s+(\d+\s+0\s+R)/);
      if (!rootM) { out.sebep = 'root_yok'; return out; }

      // Artımlı bölüm: CMap stream + güncellenmiş font objeleri
      var cmap = _identityCmap();
      var cmapNum = size;                          // yeni obje no'ları Size'dan başlar
      var ek = '\n', ofsetler = [];                // [{num, ofs}]
      var taban = u8.length;

      ofsetler.push({ num: cmapNum, ofs: taban + ek.length });
      ek += cmapNum + ' 0 obj\n<< /Length ' + cmap.length + ' >>\nstream\n' + cmap + '\nendstream\nendobj\n';

      hedefler.forEach(function (h) {
        var yeniDict;
        if (h.bozuk) {                                                   // bozuk ismi stream referansıyla DEĞİŞTİR
          yeniDict = h.dict.replace(/\/ToUnicode\s*\/Identity-H\b/, '/ToUnicode ' + cmapNum + ' 0 R');
        } else {                                                         // hiç yok → son '>>' öncesine ekle
          var kapanis = h.dict.lastIndexOf('>>');
          yeniDict = h.dict.slice(0, kapanis) + ' /ToUnicode ' + cmapNum + ' 0 R ' + h.dict.slice(kapanis);
        }
        ofsetler.push({ num: h.num, ofs: taban + ek.length });
        ek += h.num + ' 0 obj\n' + yeniDict + '\nendobj\n';
      });

      // Klasik xref (her obje ayrı alt-bölüm — numaralar ardışık olmayabilir)
      var xrefOfs = taban + ek.length;
      ek += 'xref\n';
      ofsetler.forEach(function (o) {
        var p = String(o.ofs); while (p.length < 10) p = '0' + p;
        ek += o.num + ' 1\n' + p + ' 00000 n \n';
      });
      ek += 'trailer\n<< /Size ' + (cmapNum + 1) + ' /Root ' + rootM[1] + ' /Prev ' + prevXref + ' >>\n' +
            'startxref\n' + xrefOfs + '\n%%EOF\n';

      var ekU8 = _bytes(ek);
      var yeni = new Uint8Array(u8.length + ekU8.length);
      yeni.set(u8, 0); yeni.set(ekU8, u8.length);
      out.data = yeni; out.uygulandi = true; out.sebep = 'tounicode_eklendi(' + hedefler.length + ' font)';
      return out;
    } catch (e) {
      console.warn('[pdf-tounicode] onarım atlandı:', e && e.message);
      out.sebep = 'hata: ' + ((e && e.message) || '');
      return out;
    }
  }

  var API = { onar: onar };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;   // Node mekanik test
  global.ARES_PDF_TOUNICODE = API;
})(typeof window !== 'undefined' ? window : globalThis);
