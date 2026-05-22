// ares-izometri-drenaj.js — AresPipe client-loop izometri drenaj (113. oturum / A-yolu)
//
// AMAC: izometri PDF parse dongusunu TARAYICIYA al. Boylece HICBIR Vercel fonksiyonu
//   baska bir Vercel fonksiyonunu HTTP ile cagirmaz -> Vercel 508 (INFINITE_LOOP_DETECTED)
//   KOKTEN biter. (112'de drenaj server ic-dongusu + frontend tetik = yogun server->server
//   cagri = 508. Bu modul o deseni client-loop ile degistirir.)
//
// AKIS (her bekleyen izometri PDF icin, SIRAYLA — tek tek):
//   1) imzali URL al (ARES.dosyaUrlAl) -> PDF bytes -> base64        (browser -> server/storage)
//   2) POST /api/izometri-oku  (parse: L2 deterministik / L3 vision) (browser -> izometri-oku)
//   3) POST /api/kuyruk-isle-izometri {is_id, onceden_parse, ...}    (browser -> kaydet+eslestir)
//      -> server SERVICE_ROLE ile lock + parse_sonuc yaz + eslestir (skip-parse modu, 113/A)
//   4) onIlerleme callback -> UI guncelle
//
// "tek altyatri" (anlasma): izometri-batch + devre_wizard + devre_detay AYNI bu modulu cagirir.
//
// 508 NEDEN BITER: 2. ve 3. adim ikisi de browser->server. Hicbir server baska server cagirmaz.
//   izometri-oku.js'e DOKUNULMAZ (MK-49.1) — sadece cagiran taraf (server degil) browser oldu.
//
// Bagimliliklar (sayfada global):
//   - ARES.supabase()        (ares-store.js)
//   - ARES.tenantId()        (ares-store.js)
//   - ARES.dosyaUrlAl(yol, bucket)  (ares-store.js, MK-112.4 — imzali URL doner)
//   - ARES.userId()          (opsiyonel — yoksa dok.yukleyen_id kullanilir)
//
// Son guncelleme: 22 Mayis 2026 (113. oturum — client-loop, MK-113.x)

(function (g) {
  'use strict';

  var VARSAYILAN_BUCKET = 'devre-belgeleri';

  // ── PDF -> base64 (imzali URL ile; private bucket RLS'e takilmaz, MK-112.4) ──
  async function _pdfBase64(bucket, yol) {
    if (!(ARES && typeof ARES.dosyaUrlAl === 'function')) {
      throw new Error('ARES.dosyaUrlAl yok — imzali URL alinamiyor (script sirasi?)');
    }
    var url = await ARES.dosyaUrlAl(yol, bucket);   // MK-112.4: (yol, bucket) -> imzali URL string
    if (!url) throw new Error('imzali URL bos dondu: ' + yol);
    var pr = await fetch(url);
    if (!pr.ok) throw new Error('PDF indirme HTTP ' + pr.status);
    var buf = await pr.arrayBuffer();
    // Buyuk PDF'te tek String.fromCharCode stack overflow yapar -> 32KB parcalar
    var bytes = new Uint8Array(buf), bin = '', CH = 0x8000;
    for (var i = 0; i < bytes.length; i += CH) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
    }
    return btoa(bin);
  }

  // ── Bekleyen izometri islerini cek. filtre: {devreId} (devre-ozgu) | {} (global) ──
  //    PostgREST embed'e GUVENMEZ (FK adi varsaymadan) -> iki adimli: queue + dok ayri,
  //    JS'te birlestir (MK-108.4 ruhu: yapiyi bakarak dogrula, embed adina bel baglama).
  async function _bekleyenleriCek(supa, tid, filtre) {
    filtre = filtre || {};

    if (filtre.devreId) {
      // Devre-ozgu (MK-112.3 ile ayni mantik: once dok id'leri, sonra queue .in()).
      var dr = await supa.from('devre_dokumanlari')
        .select('id, tenant_id, devre_id, storage_yolu, dosya_adi, uzanti, yukleyen_id')
        .eq('tenant_id', tid).eq('devre_id', filtre.devreId);
      if (dr.error) throw new Error('dok okuma: ' + dr.error.message);
      var doklar = dr.data || [];
      if (!doklar.length) return [];
      var dokMap = {}; doklar.forEach(function (d) { dokMap[d.id] = d; });
      var ids = doklar.map(function (d) { return d.id; });
      var qr = await supa.from('dosya_isleme_kuyrugu')
        .select('id, durum, devre_dokuman_id')
        .eq('parser', 'izometri')
        .in('durum', ['bekliyor', 'hata'])
        .in('devre_dokuman_id', ids)
        .order('olusturma', { ascending: true });
      if (qr.error) throw new Error('kuyruk okuma: ' + qr.error.message);
      return (qr.data || [])
        .map(function (q) { return { id: q.id, durum: q.durum, dok: dokMap[q.devre_dokuman_id] }; })
        .filter(function (x) { return x.dok; });
    }

    // Global (cron benzeri / izometri-batch genel) — bir seferde sinirli cek.
    var qr2 = await supa.from('dosya_isleme_kuyrugu')
      .select('id, durum, devre_dokuman_id')
      .eq('parser', 'izometri')
      .in('durum', ['bekliyor', 'hata'])
      .order('olusturma', { ascending: true })
      .limit(filtre.limit || 200);
    if (qr2.error) throw new Error('kuyruk okuma: ' + qr2.error.message);
    var rows = qr2.data || [];
    if (!rows.length) return [];
    var dids = rows.map(function (r) { return r.devre_dokuman_id; });
    var dr2 = await supa.from('devre_dokumanlari')
      .select('id, tenant_id, devre_id, storage_yolu, dosya_adi, uzanti, yukleyen_id')
      .in('id', dids);
    if (dr2.error) throw new Error('dok okuma: ' + dr2.error.message);
    var dmap = {}; (dr2.data || []).forEach(function (d) { dmap[d.id] = d; });
    return rows
      .map(function (q) { return { id: q.id, durum: q.durum, dok: dmap[q.devre_dokuman_id] }; })
      .filter(function (x) { return x.dok; });
  }

  // ── ANA: bekleyen izometrileri tek tek drene et (client-loop). ──
  //    opts = {
  //      filtre:      {devreId} | {} (global),
  //      bucket:      'devre-belgeleri' (vars.) | 'izometri-pdfs' (batch),
  //      onIlerleme:  function(durum) — {faz, sira, toplam, dosya, sonuc?, ozet}
  //    }
  //    Doner: { toplam, islenen, oneri, manuel, hata, kalan }
  //
  //    Liste BIR KEZ cekilir, uzerinde yurunur (her is BIR kez denenir) -> sonsuz/re-pay
  //    dongusu YOK. (Eski drenajda 'hata' tekrar cekilip ayni PDF yeniden parse edilip
  //    AI tekrar odenebiliyordu; burada tek kosuda her PDF bir kez.)
  async function izometriDreneEt(opts) {
    opts = opts || {};
    var filtre = opts.filtre || {};
    var bucket = opts.bucket || VARSAYILAN_BUCKET;
    var onIlerleme = (typeof opts.onIlerleme === 'function') ? opts.onIlerleme : function () {};
    var supa = ARES.supabase();
    var tid = ARES.tenantId();
    var uid = (ARES.userId && ARES.userId()) || null;

    var ozet = { toplam: 0, islenen: 0, oneri: 0, manuel: 0, hata: 0, kalan: 0 };

    var liste = await _bekleyenleriCek(supa, tid, filtre);
    ozet.toplam = liste.length;
    if (!liste.length) { onIlerleme({ faz: 'bos', ozet: ozet }); return ozet; }

    for (var i = 0; i < liste.length; i++) {
      var item = liste[i];
      var dok = item.dok;
      onIlerleme({ faz: 'basliyor', sira: i + 1, toplam: liste.length, dosya: dok.dosya_adi, ozet: ozet });

      // 1+2) imzali URL -> base64 -> izometri-oku (parse)
      var oncedenParse = null, parseHttp = 0;
      try {
        var b64 = await _pdfBase64(bucket, dok.storage_yolu);
        var pr = await fetch('/api/izometri-oku', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenant_id: dok.tenant_id,
            kullanici_id: dok.yukleyen_id || uid,
            batch_id: null,
            pdf_base64: b64,
            dosya_adi: dok.dosya_adi,
            dosya_sirasi: 1,
            dosya_toplami: 1
          })
        });
        parseHttp = pr.status;
        var pt = await pr.text();
        try { oncedenParse = pt ? JSON.parse(pt) : {}; }
        catch (e) { oncedenParse = { ok: false, error: 'izometri-oku cevabi JSON degil' }; }
      } catch (e) {
        // indirme / parse cagri hatasi -> server'a "basarisiz" bildir (kuyruk 'hata'ya gecsin)
        oncedenParse = { ok: false, error: 'tarayici parse/indirme: ' + ((e && e.message) || e) };
        parseHttp = 0;
      }

      // 3) kaydet + eslestir (server SERVICE_ROLE, skip-parse modu — server->server YOK)
      var wj = {};
      try {
        var wr = await fetch('/api/kuyruk-isle-izometri', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            is_id: item.id,
            onceden_parse: oncedenParse,
            onceden_parse_http: parseHttp
          })
        });
        try { wj = await wr.json(); } catch (e) { wj = { durum: 'hata', hata: 'kaydet cevabi JSON degil' }; }
      } catch (e) {
        wj = { durum: 'hata', hata: 'kaydet cagri: ' + ((e && e.message) || e) };
      }

      ozet.islenen++;
      if (wj.durum === 'oneri_hazir') ozet.oneri++;
      else if (wj.durum === 'manuel_onay') ozet.manuel++;
      else ozet.hata++;

      onIlerleme({ faz: 'bitti', sira: i + 1, toplam: liste.length, dosya: dok.dosya_adi, sonuc: wj, ozet: ozet });
    }

    // Kalan (kosu sirasinda eklenmis olabilir / 'hata' kalanlar)
    try { ozet.kalan = (await _bekleyenleriCek(supa, tid, filtre)).length; }
    catch (e) { ozet.kalan = 0; }

    onIlerleme({ faz: 'tamam', ozet: ozet });
    return ozet;
  }

  g.ARES_IZO_DRENAJ = { izometriDreneEt: izometriDreneEt };

})(typeof window !== 'undefined' ? window : this);
