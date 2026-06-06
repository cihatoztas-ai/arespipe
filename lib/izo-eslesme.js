// lib/izo-eslesme.js — AresPipe İnceleme & Onay eşleştirme çekirdeği (oturum 127 / MK-127.3/4/5)
//
// AMAÇ: Kabuk (Excel/BOM → ARES_KABUK.grupla) × izometri parse sonuçlarını eşleyip
//   spool başına 4-DURUM (okundu/zayif/eksik/fazla) üretmek. SAF fonksiyon:
//   - DB YOK, regex YOK, yan etki YOK → birim test edilebilir, kimseyi bozamaz.
//   - Dosya-adı regex'leri (dosyaAdiParse/montajDosyaKok) BİLİNÇLİ olarak BURADA DEĞİL.
//     Tek kaynak: api/kuyruk-isle-izometri.js (export'lu). Endpoint anahtarları ORADA üretip
//     bu modüle `anahtarlar` olarak verir → regex DRIFT'i imkânsız (MK-127.3).
//
// KRİTİK KARAR (oturum 127): Eşleştirme, kanonik eşleştiriciyle (kuyruk-isle-izometri.js) BİREBİR
//   aynı anahtar mantığını kullanır. Dosya adından pipeline çıkmazsa parse.pipeline_no'ya FALLBACK
//   YAPILMAZ — çünkü o zaman İnceleme 🟢 gösterip terfide kanonik eşleştirici bağ kuramaz → onay
//   sonrası SESSİZ HATA. İnceleme = terfinin birebir önizlemesi. Eşleşmeyen → ekranda 🟠/🔴 görünür
//   (sessiz geçmez, omurga Bölüm 3 + 11). Çözüm = dosya_adi_regex düzeltmesi (MK-124.1), draft hilesi değil.
//
// NOT: marka (proje-pipeline-spool-rev) BURADA üretilmez — ARES_NORM.marka tarayıcıda (v3.html'de)
//   uygulanır. Bu modül ham alanları (pipeline/spoolNo/rev) döndürür.

'use strict';

// ── Anahtar normalizasyonu — worker'daki normPipeline/normSpoolNo ile aynı (trim + UPPER).
//    Bilinçli ufak kopya: tek satır, semantik bariz, kararlı. Worker'daki değişirse burası da
//    güncellenir; ama bu fonksiyonlar (sadece trim+upper) yıllardır stabil, drift riski pratikte yok.
const _norm = (s) => String(s == null ? '' : s).trim().toUpperCase();

/**
 * İki parçadan eşleştirme anahtarı: "PIPELINE|SPOOL" (devre içi tekil).
 * Worker'daki `normPipeline(p)+'|'+normSpoolNo(s)` ile birebir aynı.
 */
function anahtar(pipeline, spoolNo) {
  return _norm(pipeline) + '|' + _norm(spoolNo);
}

/**
 * İzometri parse sonucundan seviye (L1/L2/L3) çıkarımı.
 * Kaynak alanlar: et_kaynagi ('l2_regex' → L2; 'pdf_*'/vision → L3), opsiyonel açık `seviye`.
 * Tek bir parse_sonuc.spoollar[] elemanı (veya endpoint'in derlediği özet) beklenir.
 */
function seviyeBelirle(izo) {
  if (izo.seviye) return izo.seviye;                 // endpoint açıkça verdiyse onu kullan
  const ek = String(izo.et_kaynagi || '').toLowerCase();
  // 161 fix: 'pdf_yok' = L2 parse ama et PDF'te yazılı değil — vision DEĞİL. includes('pdf')
  //   bunu da yakalayıp yanlış L3 rozeti basıyordu (Y200 vakası: notlar=L2 deterministik, rozet L3).
  if (ek === 'pdf_yok') return null;
  if (ek.includes('l2') || ek.includes('regex') || ek === 'tablo') return 'L2';
  if (ek.includes('vision') || ek.includes('pdf')) return 'L3';
  return null;                                       // bilinmiyor (cache/L1 veya alan yok)
}

/**
 * Bir izometrinin "zayıf" olup olmadığı (🟡 sinyali).
 *   - bindirme_flag: kabuk↔PDF değer çelişkisi (%3 tolerans dışı) — gerçek sinyal
 *   - kritik_uyari : parse kritik uyarı üretti (DN yok vb.)
 *   - guven < eşik : düşük güvenli parse
 */
function zayifMi(izo, guvenEsigi) {
  if (izo.bindirme_flag === true) return true;
  if (izo.kritik_uyari === true) return true;
  if (typeof izo.guven === 'number' && izo.guven < guvenEsigi) return true;
  return false;
}

/**
 * ANA FONKSİYON — kabuk × izometri → 4-durum tablosu.
 *
 * @param {Object} girdi
 * @param {Array}  girdi.kabukSpoollar  ARES_KABUK.grupla().spoollar — [{pipeline, spoolNo, rev,
 *                                       anaMalzeme, toplamKg, yuzeyHam}]
 * @param {Array}  girdi.izometriler    endpoint'in derlediği izometri kayıtları:
 *   {
 *     dosya_adi,
 *     parse_durumu,            // 'tamamlandi' | 'bekliyor' | 'isleniyor' | 'hata'
 *     anahtarlar: [{pipeline, spoolNo}],   // endpoint kanonik primitiflerle ürettı; BOŞ olabilir
 *     anahtar_yok_sebep,       // anahtarlar boşsa sebep ('dosya_adi_pipeline_yok' vb.)
 *     seviye, et_kaynagi, guven, bindirme_flag, kritik_uyari
 *   }
 * @param {Number} girdi.guvenEsigi     varsayılan 0.7 (altı → zayıf)
 *
 * @returns {Object} {
 *   spoollar: [{pipeline, spoolNo, rev, anaMalzeme, toplamKg, yuzeyHam, cap, et,
 *               durum:'okundu'|'zayif'|'eksik', izometri:{dosya_adi,seviye,guven}|null, bindirme_flag}],
 *   fazla:    [{pipeline, spoolNo, dosya_adi, sebep}],   // izometri var, kabukta yok / anahtarsız
 *   ozet:     {toplam, okundu, zayif, eksik, fazla, isleniyor}
 * }
 */
function incelemeTablosu({ kabukSpoollar = [], izometriler = [], guvenEsigi = 0.7 } = {}) {
  // 138/B(b): MONTAJ BELGELERI ayri sinif — spool celetesine ve Fazla'ya GIRMEZ.
  //   montaj_belge=true (endpoint dosya adindan deterministik isaretler) → ayri montajlar[] dizisi.
  //   Anahtarlari kabuga eslesirse bagli_spoollar dolar (bilgi); eslesmese de Fazla olmaz.
  const montajKayitlar = izometriler.filter((z) => z.montaj_belge === true);
  const izoNormal      = izometriler.filter((z) => z.montaj_belge !== true);
  // Yalnızca PARSE EDİLMİŞ izometriler eşleşmeye katılır. Bekleyenler 'isleniyor' sayılır;
  // hedef spool'ları drenaj ilerleyene kadar 🔴 kalır (drenaj bitince yeniden çağrı → 🟢).
  const bitenler   = izoNormal.filter((z) => z.parse_durumu === 'tamamlandi');
  const isleniyor  = izoNormal.filter((z) => z.parse_durumu !== 'tamamlandi').length;

  // anahtar → eşleşen izometri kayıtları (bir spool'a birden çok çizim gelebilir: detay+montaj)
  const harita = new Map();
  // Hangi izometri en az bir kabuğa eşleşti? (fazla tespiti için)
  const eslesenIzoIdx = new Set();

  bitenler.forEach((z, idx) => {
    (z.anahtarlar || []).forEach((a) => {
      const k = anahtar(a.pipeline, a.spoolNo);
      if (!harita.has(k)) harita.set(k, []);
      harita.get(k).push({ izoIdx: idx, izo: z });
    });
  });

  let okundu = 0, zayif = 0, eksik = 0;

  // Her kabuk spool'u için durum hesapla — KABUK OTORİTEDİR (omurga Bölüm 3)
  const spoollar = kabukSpoollar.map((sp) => {
    const k = anahtar(sp.pipeline, sp.spoolNo);
    const eslesmeler = harita.get(k) || [];

    if (eslesmeler.length === 0) {
      eksik++;
      return {
        pipeline: sp.pipeline, spoolNo: sp.spoolNo, rev: sp.rev,
        anaMalzeme: sp.anaMalzeme, toplamKg: sp.toplamKg, yuzeyHam: sp.yuzeyHam,
        cap: (sp.cap != null ? sp.cap : null), et: (sp.et != null ? sp.et : null),
        durum: 'eksik', izometri: null, bindirme_flag: false,
      };
    }

    // En az bir eşleşme var → bu spool'a eşleşen izometrileri "eşleşti" işaretle (fazla'dan düşsün)
    eslesmeler.forEach((e) => eslesenIzoIdx.add(e.izoIdx));

    // Zayıf mı? Herhangi bir eşleşen izometri zayıf sinyal taşıyorsa → 🟡
    const herhangiZayif = eslesmeler.some((e) => zayifMi(e.izo, guvenEsigi));
    const herhangiFlag  = eslesmeler.some((e) => e.izo.bindirme_flag === true);
    // Temsilci izometri: tercihen güçlü olan (zayıf olmayan); yoksa ilki.
    const temsil = (eslesmeler.find((e) => !zayifMi(e.izo, guvenEsigi)) || eslesmeler[0]).izo;

    const durum = herhangiZayif ? 'zayif' : 'okundu';
    if (durum === 'zayif') zayif++; else okundu++;

    return {
      pipeline: sp.pipeline, spoolNo: sp.spoolNo, rev: sp.rev,
      anaMalzeme: sp.anaMalzeme, toplamKg: sp.toplamKg, yuzeyHam: sp.yuzeyHam,
      cap: (sp.cap != null ? sp.cap : null), et: (sp.et != null ? sp.et : null),
      durum,
      izometri: {
        dosya_adi: temsil.dosya_adi,
        seviye: seviyeBelirle(temsil),
        guven: (typeof temsil.guven === 'number') ? temsil.guven : null,
      },
      bindirme_flag: herhangiFlag,
    };
  });

  // FAZLA (🟠): hiçbir kabuğa eşleşmeyen izometriler + anahtarı çıkarılamayanlar.
  //   Sessizce eklenmez — kullanıcıya "ekle/yoksay" diye SORULUR (MK-126.2).
  const fazla = [];
  bitenler.forEach((z, idx) => {
    const anahtarlar = z.anahtarlar || [];
    if (anahtarlar.length === 0) {
      // Anahtar çıkmadı (ör. dosyaAdiParse null + parse pipeline yok) → MK-124.1 borcu YÜZEYE ÇIKAR.
      fazla.push({
        pipeline: null, spoolNo: null, dosya_adi: z.dosya_adi,
        sebep: z.anahtar_yok_sebep || 'anahtar_cikarilamadi',
      });
      return;
    }
    if (!eslesenIzoIdx.has(idx)) {
      // Anahtar(lar) var ama hiçbiri kabukta yok → gerçekten fazla.
      anahtarlar.forEach((a) => {
        fazla.push({ pipeline: a.pipeline, spoolNo: a.spoolNo, dosya_adi: z.dosya_adi, sebep: 'kabukta_yok' });
      });
    }
  });

  // 138/B(b): MONTAJLAR — ayri bolum. Kabuk anahtarina eslesen montaj spool'lari "bagli" sayilir.
  const kabukAnahtarSet = new Set(kabukSpoollar.map((sp) => anahtar(sp.pipeline, sp.spoolNo)));
  const montajlar = montajKayitlar.map((z) => {
    const liste = (z.anahtarlar || []);
    const bagli = liste.filter((a) => kabukAnahtarSet.has(anahtar(a.pipeline, a.spoolNo))).map((a) => a.spoolNo);
    return {
      dosya_adi: z.dosya_adi,
      kok: (liste[0] && liste[0].pipeline) || null,
      bagli_spoollar: bagli,
      tum_spoollar: liste.map((a) => a.spoolNo),
      icerik_okundu: (z.montaj_icerik_okundu === true),
    };
  });

  return {
    spoollar,
    fazla,
    montajlar,
    ozet: { toplam: kabukSpoollar.length, okundu, zayif, eksik, fazla: fazla.length, montaj: montajlar.length, isleniyor },
  };
}

export { _norm, anahtar, seviyeBelirle, zayifMi, incelemeTablosu };

// ─────────────────────────────────────────────────────────────────────────────
// SELF-TEST — doğrudan çalıştırılınca koşar:  node lib/izo-eslesme.js
//   Gerçek canlı veriden (oturum 127 SQL çıktısı) türetilmiş üç vaka:
//   1) G400-804-604/S01 — eşleşti AMA bindirme_flag (ağırlık %4.2) → 🟡 zayif
//   2) Bir kabuk spool'u (S02) için hiç izometri yok → 🔴 eksik
//   3) M200-355C-355-ALS — dosyaAdiParse null (.S01. segmenti yok) → anahtar YOK → 🟠 fazla
//      (kanonik eşleştirici de bunu atanmamis yapıyor; draft birebir aynı → terfide sürpriz yok)
// ─────────────────────────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const kabukSpoollar = [
    { pipeline: 'G400-804-604', spoolNo: 'S01', rev: '',  anaMalzeme: 'ST37', toplamKg: 24.956, yuzeyHam: 'galvaniz' },
    { pipeline: 'G400-804-604', spoolNo: 'S02', rev: '',  anaMalzeme: 'ST37', toplamKg: 12.0,   yuzeyHam: 'galvaniz' },
    { pipeline: 'M200-355C-355-ALS', spoolNo: 'S01', rev: 'A', anaMalzeme: 'Paslanmaz', toplamKg: 10, yuzeyHam: '' },
  ];

  const izometriler = [
    // 1) G400 S01 — L2, güven tam, ama ağırlık tolerans dışı → bindirme_flag:true
    {
      dosya_adi: 'G400-804-604.S01.1.pdf', parse_durumu: 'tamamlandi',
      anahtarlar: [{ pipeline: 'G400-804-604', spoolNo: 'S01' }],
      et_kaynagi: 'l2_regex', guven: 1, bindirme_flag: true, kritik_uyari: true,
    },
    // 3) M200 — dosyaAdiParse null → endpoint anahtar üretemedi (FALLBACK YOK) → fazla/anahtarsız
    {
      dosya_adi: 'M200-355C-355-ALS.1.pdf', parse_durumu: 'tamamlandi',
      anahtarlar: [], anahtar_yok_sebep: 'dosya_adi_pipeline_yok',
      et_kaynagi: 'pdf_yok', guven: 0.75, bindirme_flag: false, kritik_uyari: true,
    },
    // bekleyen bir izometri (drenaj henüz işlemedi) → isleniyor
    {
      dosya_adi: 'G400-804-604.S03.1.pdf', parse_durumu: 'bekliyor',
      anahtarlar: [], et_kaynagi: null, guven: null, bindirme_flag: false, kritik_uyari: false,
    },
  ];

  const r = incelemeTablosu({ kabukSpoollar, izometriler });
  console.log('--- ÖZET ---');
  console.log(r.ozet);
  console.log('--- SPOOLLAR ---');
  r.spoollar.forEach((s) => {
    const emoji = { okundu: '🟢', zayif: '🟡', eksik: '🔴' }[s.durum];
    console.log(`${emoji} ${s.pipeline}/${s.spoolNo} → ${s.durum}` +
      (s.izometri ? ` [${s.izometri.dosya_adi}, ${s.izometri.seviye}, güven ${s.izometri.guven}${s.bindirme_flag ? ', ÇELİŞKİ' : ''}]` : ' [izometri yok]'));
  });
  console.log('--- FAZLA (🟠 sorulacak) ---');
  r.fazla.forEach((f) => console.log(`🟠 ${f.dosya_adi} → ${f.sebep}`));

  // Beklenen: özet {toplam:3, okundu:0, zayif:1, eksik:2, fazla:1, isleniyor:1}
  //   🟡 G400/S01 (bindirme çelişki) · 🔴 G400/S02 (izometri yok) · 🔴 M200/S01 (anahtarsız izo eşleşmedi)
  //   🟠 M200-355C-355-ALS.1.pdf (dosya_adi_pipeline_yok)  ← MK-124.1 borcu ekranda görünür
  const ok =
    r.ozet.toplam === 3 && r.ozet.zayif === 1 && r.ozet.eksik === 2 &&
    r.ozet.fazla === 1 && r.ozet.isleniyor === 1;
  console.log('\nSELF-TEST:', ok ? '✅ GEÇTİ' : '❌ KALDI (beklenenle eşleşmedi)');
}
