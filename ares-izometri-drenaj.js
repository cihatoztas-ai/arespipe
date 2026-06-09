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
// "tek altyapi" (anlasma): izometri-batch + devre_wizard + devre_detay AYNI bu modulu cagirir.
//
// 508 NEDEN BITER: 2. ve 3. adim ikisi de browser->server. Hicbir server baska server cagirmaz.
//   izometri-oku.js'e DOKUNULMAZ (MK-49.1) — sadece cagiran taraf (server degil) browser oldu.
//
// 153 — COK-TUR KOSU (MK-153.1):
//   Eski davranis: liste BIR kez cekilirdi (global modda 200 limit). 200+ bekleyende tek
//   basis listeyi bitirip duruyordu -> operator tekrar basmak zorunda kaliyordu.
//   Yeni davranis: dis while dongusu — liste biter bitmez yeniden cekilir, islenecek YENI
//   is kalmayana dek devam. 113'un "her is BIR kez denenir, AI'a iki kez odenmez" garantisi
//   AYNEN korunur: bu kosuda gorulen is id'leri atlanir (gorulen-set). Yani 'hata'ya dusen
//   bir is ayni basista tekrar denenmez; bir SONRAKI basista yeniden denenebilir.
//
// Bagimliliklar (sayfada global):
//   - ARES.supabase()        (ares-store.js)
//   - ARES.tenantId()        (ares-store.js)
//   - ARES.dosyaUrlAl(yol, bucket)  (ares-store.js, MK-112.4 — imzali URL doner)
//   - ARES.userId()          (opsiyonel — yoksa dok.yukleyen_id kullanilir)
//
// 154 — SILINMIS-DEVRE FILTRESI (W-2.13 ikinci savunma hatti):
//   _bekleyenleriCek silinmis (silindi=true) devrelerin islerini HIC dondurmez — wizard iptali
//   kuyrugu temizlemeyi kacirirsa bile yetim is islenmez, AI'a odenmez. Atlanan is konsola yazilir
//   (sessiz kaybolma yok, B-6). Gorulen-set / cok-tur mantigi (MK-153.1) degismedi.
//
// Son guncelleme: 4 Haziran 2026 (154. oturum — silinmis-devre filtresi, W-2.13)

(function (g) {
  'use strict';

  var VARSAYILAN_BUCKET = 'devre-belgeleri';
  var MAX_TUR = 50;   // guvenlik tavani (50 tur x 200 is = 10.000 is — pratikte erisilemez)

  // 172/DURDUR: isbirlikci iptal. durdur() cagrilinca devam eden is biter, SONRAKI ise gecmeden durur.
  //   AI'a cifte odeme yok (113): zaten islenmis is gorulen-set'te; iptal yalnizca yeni ise baslamayi engeller.
  var _iptal = false;
  function durdur() { _iptal = true; }

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
      // 154 / W-2.13 ikinci savunma hatti: devre silinmisse isleri HIC alinmaz (sessiz degil, konsola yazilir).
      var dvr = await supa.from('devreler').select('id, silindi')
        .eq('id', filtre.devreId).eq('tenant_id', tid).maybeSingle();
      if (dvr.error) throw new Error('devre okuma: ' + dvr.error.message);
      if (!dvr.data || dvr.data.silindi === true) {
        console.warn('[drenaj] devre silinmis/yok — isler atlandi (W-2.13):', filtre.devreId);
        return [];
      }
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

    // Global (izometri-batch genel) — bir seferde sinirli cek (cok-tur kosu gerisini alir).
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

    // 154 / W-2.13 ikinci savunma hatti: silinmis devrelerin yetim isleri listeye GIRMEZ.
    // (Veri onarimi yetimleri 'iptal'e cekti; bu filtre gelecekteki kacaklar icin sigorta.)
    // Gorulen-set'e dokunmaya gerek yok: yetim hic donmedigi icin tur mantigi (MK-153.1) aynen isler.
    var devreIds = {};
    (dr2.data || []).forEach(function (d) { if (d.devre_id) devreIds[d.devre_id] = true; });
    var dIdList = Object.keys(devreIds);
    var olu = {};   // silinmis devre id -> true
    if (dIdList.length) {
      var sv = await supa.from('devreler').select('id')
        .in('id', dIdList).eq('silindi', true);
      if (!sv.error) (sv.data || []).forEach(function (d) { olu[d.id] = true; });
      // sv.error: filtre sigortadir — okunamadiysa isleri DUSURME (yanlis pozitif atlamadan kotu degil).
    }

    var sonuc = rows
      .map(function (q) { return { id: q.id, durum: q.durum, dok: dmap[q.devre_dokuman_id] }; })
      .filter(function (x) { return x.dok; });
    var oluSayi = 0;
    sonuc = sonuc.filter(function (x) {
      if (x.dok.devre_id && olu[x.dok.devre_id]) { oluSayi++; return false; }
      return true;
    });
    if (oluSayi) console.warn('[drenaj] ' + oluSayi + ' yetim is atlandi (devre silinmis, W-2.13)');
    return sonuc;
  }

  // ── Tek isi isle (1: indir+parse, 2: kaydet+eslestir). Asla throw ETMEZ. ──
  async function _birIsIsle(item, bucket, uid) {
    var dok = item.dok;

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

    return wj;
  }

  // ── ANA: bekleyen izometrileri drene et (client-loop, COK-TUR — MK-153.1). ──
  //    opts = {
  //      filtre:      {devreId} | {} (global),
  //      bucket:      'devre-belgeleri' (vars.) | 'izometri-pdfs' (batch),
  //      onIlerleme:  function(durum) — {faz, tur?, sira, toplam, dosya, sonuc?, ozet}
  //    }
  //    Doner: { toplam, islenen, oneri, manuel, hata, kalan, tur }
  //
  //    Her is bu kosuda EN FAZLA BIR kez denenir (gorulen-set) -> AI'a cifte odeme YOK
  //    (113 garantisi). Liste bitince yeniden cekilir; islenecek yeni is kalmayinca durur.
  async function izometriDreneEt(opts) {
    opts = opts || {};
    var filtre = opts.filtre || {};
    var bucket = opts.bucket || VARSAYILAN_BUCKET;
    var onIlerleme = (typeof opts.onIlerleme === 'function') ? opts.onIlerleme : function () {};
    var supa = ARES.supabase();
    var tid = ARES.tenantId();
    var uid = (ARES.userId && ARES.userId()) || null;

    var ozet = { toplam: 0, islenen: 0, oneri: 0, manuel: 0, hata: 0, kalan: 0, tur: 0, iptal: false };
    var gorulen = {};   // is_id -> true (bu kosuda bir kez — 113: AI'a cifte odeme yok)
    _iptal = false;     // 172/DURDUR: her yeni kosu temiz baslar

    while (ozet.tur < MAX_TUR) {
      if (_iptal) break;   // 172/DURDUR: tur arasi iptal
      ozet.tur++;

      var liste;
      try {
        liste = await _bekleyenleriCek(supa, tid, filtre);
      } catch (e) {
        if (ozet.tur === 1) throw e;   // ilk turda liste bile gelmiyorsa gercek hata: yukari
        break;                          // sonraki turlarda: eldekiyle bitir, kalan'i tahmin etme
      }

      liste = liste.filter(function (x) { return !gorulen[x.id]; });
      if (!liste.length) break;        // islenecek YENI is yok -> kosu bitti
      ozet.toplam += liste.length;

      for (var i = 0; i < liste.length; i++) {
        if (_iptal) break;   // 172/DURDUR: is arasi iptal (devam eden is zaten bitti, yenisine baslama)
        var item = liste[i];
        gorulen[item.id] = true;
        onIlerleme({ faz: 'basliyor', tur: ozet.tur, sira: ozet.islenen + 1, toplam: ozet.toplam, dosya: item.dok.dosya_adi, ozet: ozet });

        var wj = await _birIsIsle(item, bucket, uid);

        ozet.islenen++;
        if (wj.durum === 'oneri_hazir') ozet.oneri++;
        else if (wj.durum === 'manuel_onay') ozet.manuel++;
        else ozet.hata++;

        onIlerleme({ faz: 'bitti', tur: ozet.tur, sira: ozet.islenen, toplam: ozet.toplam, dosya: item.dok.dosya_adi, sonuc: wj, ozet: ozet });
      }
    }

    // Kalan = bu kosuda dokunulmamis bekleyen/hata (gorulen haric) — bir sonraki basis alir.
    try {
      var son = await _bekleyenleriCek(supa, tid, filtre);
      ozet.kalan = son.filter(function (x) { return !gorulen[x.id]; }).length;
    } catch (e) { ozet.kalan = 0; }

    ozet.iptal = _iptal;   // 172/DURDUR: cagiran iptal mi normal bitis mi ayirsin
    onIlerleme({ faz: _iptal ? 'iptal' : ((ozet.islenen || ozet.kalan) ? 'tamam' : 'bos'), ozet: ozet });
    return ozet;
  }

  g.ARES_IZO_DRENAJ = { izometriDreneEt: izometriDreneEt, durdur: durdur };

})(typeof window !== 'undefined' ? window : this);
