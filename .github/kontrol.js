#!/usr/bin/env node

// AresPipe Kod Kalite Kontrol Script'i
// ─────────────────────────────────────
// Çalışma modları:
//   node kontrol.js              → Repo'yu tarar, hata/uyarı raporlar, exit code ile CI'ı kırabilir
//   node kontrol.js --json       → Normal taramaya ek olarak .github/ci-son-rapor.json yazar
//                                  (pano Sistem Sağlığı kartının kaynağı — 25. oturum)
//   node kontrol.js --self-test  → .github/bozuk-ornekler/ klasörünü tarar, kuralların ÇALIŞTIĞINI doğrular
//
// Kurallar: .github/kurallar.json
// Bozuk örnekler: .github/bozuk-ornekler/
// JSON rapor: .github/ci-son-rapor.json (sadece --json modunda)
//
// Kural tipleri:
//   1. yasak_string    → dosyada bulunmamalı (desen + satirda_olmamalidir opsiyonel istisna)
//   2. zorunlu_her_html → HTML'lerde bulunmalı
//   3. ham_gosterim    → ARES_NORM yoksa raw malzeme/kalite/yüzey pattern'i uyarı
//   4. i18n_senkron    → tv() anahtarları lang/tr.json'da olmalı
//   5. migrations      → migrations/ klasöründe dosya adı + duplicate numara + header kontrolü
//                        (28. oturum — önceden .github/workflows/migrations-check.yml'deydi, kaldırıldı)
//
// Son güncelleme: 28. oturum — migrations kontrolü entegre edildi (A1 yaklaşımı: üst-seviye klasör taraması)

const fs = require('fs');
const path = require('path');

const KURALLAR_DOSYA = path.join(__dirname, 'kurallar.json');
const BOZUK_DIZIN    = path.join(__dirname, 'bozuk-ornekler');
const BEKLENEN_DOSYA = path.join(BOZUK_DIZIN, 'beklenen-hatalar.json');
const RAPOR_DOSYA    = path.join(__dirname, 'ci-son-rapor.json');

const KURAL = JSON.parse(fs.readFileSync(KURALLAR_DOSYA, 'utf8'));
const SELF_TEST = process.argv.includes('--self-test');
const JSON_MODU = process.argv.includes('--json');

let hataSayisi = 0;
let uyariSayisi = 0;
const raporSatirlari = [];

function log(mesaj) {
  raporSatirlari.push(mesaj);
  console.log(mesaj);
}

// ─────────────────────────────────────────────────────────────
// DOSYA YARDIMCILARI
// ─────────────────────────────────────────────────────────────

function htmlDosyalariniGetir(dizin, liste = []) {
  const girisler = fs.readdirSync(dizin, { withFileTypes: true });
  for (const giris of girisler) {
    // 200: _arsiv (arşivlenmiş prototipler) + docs (tasarım mockup/dokümanı) app sayfası DEĞİL
    //      → ARES_LAYOUT vb. app kuralları uygulanmaz, taramadan dışla.
    if (giris.name.startsWith('.') || giris.name === 'node_modules' || giris.name === '_arsiv' || giris.name === 'docs') continue;
    const tamYol = path.join(dizin, giris.name);
    if (giris.isDirectory()) {
      htmlDosyalariniGetir(tamYol, liste);
    } else if (/\.(html|js|jsx|json)$/.test(giris.name)) {
      liste.push(tamYol);
    }
  }
  return liste;
}

function dosyaIstisnasiMi(dosyaYolu) {
  const normalize = dosyaYolu.replace(/\\/g, '/');
  return (KURAL.istisnalar.dosyalar || []).some(istisna =>
    normalize.endsWith(istisna.replace(/\\/g, '/'))
  );
}

function satirBul(icerik, arananIlkIndex) {
  // Karakter indexinden satır numarası çıkar
  if (arananIlkIndex < 0) return null;
  return icerik.substring(0, arananIlkIndex).split('\n').length;
}

// ─────────────────────────────────────────────────────────────
// DİL DOSYALARI CACHE (i18n senkron kontrolü için)
// ─────────────────────────────────────────────────────────────

let _langCache = null;
function dilDosyalariniYukle() {
  if (_langCache !== null) return _langCache;
  _langCache = { tr: {}, en: {}, ar: {}, yuklendi: false };
  try {
    const trPath = 'lang/tr.json';
    if (fs.existsSync(trPath)) {
      _langCache.tr = JSON.parse(fs.readFileSync(trPath, 'utf8'));
      _langCache.yuklendi = true;
    }
    // EN/AR senkron kontrolü için de yükle (şimdilik sadece TR'yi kullanıyoruz, 24. oturumda genişletilir)
    if (fs.existsSync('lang/en.json')) _langCache.en = JSON.parse(fs.readFileSync('lang/en.json', 'utf8'));
    if (fs.existsSync('lang/ar.json')) _langCache.ar = JSON.parse(fs.readFileSync('lang/ar.json', 'utf8'));
  } catch (err) {
    log(`⚠  Dil dosyası okuma hatası: ${err.message}`);
  }
  return _langCache;
}

// ─────────────────────────────────────────────────────────────
// KONTROL 1 — YASAK STRING (regex desteği + satırda istisna)
// ─────────────────────────────────────────────────────────────

function yasakStringKontrol(dosyaYolu, icerik) {
  if (dosyaIstisnasiMi(dosyaYolu)) return [];
  const hatalar = [];
  const satirlar = icerik.split('\n');

  for (const kural of KURAL.yasak_string.kurallar) {
    // Dosya tipi istisnası (opsiyonel)
    if (kural.sadece_dosya_tipi) {
      const pattern = new RegExp(kural.sadece_dosya_tipi + '$');
      if (!pattern.test(dosyaYolu)) continue;
    }

    if (kural.regex) {
      // REGEX MODU
      let regex;
      try {
        regex = new RegExp(kural.desen);
      } catch (e) {
        log(`⚠  Bozuk regex (${kural.kod || kural.desen}): ${e.message}`);
        continue;
      }

      satirlar.forEach((satir, idx) => {
        if (!regex.test(satir)) return;
        // satırda_olmamalidir varsa — eşleşen satırda bu string varsa atla
        if (kural.satirda_olmamalidir &&
            kural.satirda_olmamalidir.some(s => satir.includes(s))) return;
        hatalar.push({
          kod: kural.kod || null,
          tip: kural.siddet,
          satir: idx + 1,
          mesaj: kural.mesaj,
          desen: kural.desen
        });
      });
    } else {
      // INCLUDES MODU (eski davranış — backward compat)
      if (icerik.includes(kural.desen)) {
        const satirNo = icerik.split('\n').findIndex(s => s.includes(kural.desen)) + 1;
        hatalar.push({
          kod: kural.kod || null,
          tip: kural.siddet,
          satir: satirNo,
          mesaj: kural.mesaj,
          desen: kural.desen
        });
      }
    }
  }

  return hatalar;
}

// ─────────────────────────────────────────────────────────────
// KONTROL 2 — ZORUNLU HER HTML
// ─────────────────────────────────────────────────────────────

function zorunluKontrol(dosyaYolu, icerik) {
  if (!dosyaYolu.endsWith('.html')) return [];
  if (dosyaIstisnasiMi(dosyaYolu)) return [];
  // mobile/ altındaki HTML'ler Vite SPA build çıktısı — ortak ares-* (store/lang/normalize/layout)
  // vanilla JS dosyalarını yüklemez; React component'ler + kendi i18n'i kullanır.
  // Regex: yol başında veya alt yolunda mobile/ — relative ('mobile/dist/...') ve absolute ikisinde de çalışır.
  if (/(^|\/)mobile\//.test(dosyaYolu.replace(/\\/g, '/'))) return [];

  const hatalar = [];
  for (const kural of KURAL.zorunlu_her_html.kurallar) {
    const arananlar = [kural.desen];
    if (kural.desene_alternatif) arananlar.push(kural.desene_alternatif);
    const bulundu = arananlar.some(d => icerik.includes(d));
    if (!bulundu) {
      hatalar.push({
        kod: kural.kod || null,
        tip: kural.siddet,
        satir: null,
        mesaj: kural.mesaj,
        desen: kural.desen
      });
    }
  }
  return hatalar;
}

// ─────────────────────────────────────────────────────────────
// KONTROL 3 — I18N SENKRON (tv() anahtarları lang/tr.json'da mı?)
// ─────────────────────────────────────────────────────────────

function i18nSenkronKontrol(dosyaYolu, icerik) {
  if (!KURAL.i18n_senkron || !KURAL.i18n_senkron.aktif) return [];
  if (!/\.(html|js|jsx)$/.test(dosyaYolu)) return [];
  if (dosyaIstisnasiMi(dosyaYolu)) return [];
  // lang dosyalarının kendisini kontrol etme
  if (/\/lang\//.test(dosyaYolu.replace(/\\/g, '/'))) return [];

  const lang = dilDosyalariniYukle();
  if (!lang.yuklendi) return []; // lang/tr.json yoksa sessiz geç

  const hatalar = [];
  const siddet = KURAL.i18n_senkron.siddet || 'uyari';
  // tv('anahtar', ...) veya tv('anahtar')
  const regex = /tv\(\s*['"]([^'"]+)['"]\s*[,)]/g;
  const satirlar = icerik.split('\n');

  const zatenRaporlandi = new Set();
  satirlar.forEach((satir, idx) => {
    // mobile/ altındaki React dosyaları farklı sözlük kullanabilir — atla (Web focus)
    // Regex: relative ve absolute yol başlangıçlarında çalışır.
    if (/(^|\/)mobile\//.test(dosyaYolu.replace(/\\/g, '/'))) return;

    let match;
    const lokalRegex = new RegExp(regex.source, 'g');
    while ((match = lokalRegex.exec(satir)) !== null) {
      const anahtar = match[1];
      if (zatenRaporlandi.has(anahtar)) continue;
      if (lang.tr[anahtar] !== undefined) continue; // OK, sözlükte var
      zatenRaporlandi.add(anahtar);
      hatalar.push({
        kod: 'I18N_EKSIK',
        tip: siddet,
        satir: idx + 1,
        mesaj: `tv('${anahtar}') kullanılıyor ama lang/tr.json'da yok`,
        desen: `tv('${anahtar}'...)`
      });
    }
  });

  return hatalar;
}

// ─────────────────────────────────────────────────────────────
// KONTROL 5 — MIGRATIONS (28. oturum)
// ─────────────────────────────────────────────────────────────
//
// migrations/ klasöründeki .sql dosyalarını topluca inceler:
//  (a) Dosya adı NNN_aciklama.sql formatında mı          → MIG_ISIM_BOZUK (hata)
//  (b) Aynı 3 haneli sıra numarası iki dosyada var mı   → MIG_NUMARA_TEKRAR (hata)
//  (c) İlk 10 satırda '--' yorumu var mı                → MIG_HEADER_EKSIK (uyari)
//
// Dönen yapı: [{ dosya, kod, tip, satir, mesaj }]. Klasör bazlı çalışır — test ortamında
// kurallar.klasor override edilebilir (self-test bunu kullanır).

function migrationsKontrol(kokDizin) {
  if (!KURAL.migrations || !KURAL.migrations.aktif) return [];
  const klasorGoreceli = KURAL.migrations.klasor || 'migrations';
  const klasor = path.isAbsolute(klasorGoreceli)
    ? klasorGoreceli
    : path.join(kokDizin, klasorGoreceli);

  if (!fs.existsSync(klasor)) return []; // klasör yoksa sessiz geç
  if (!fs.statSync(klasor).isDirectory()) return [];

  const kurallar = KURAL.migrations.kurallar || [];
  const isimKural    = kurallar.find(k => k.kod === 'MIG_ISIM_BOZUK');
  const tekrarKural  = kurallar.find(k => k.kod === 'MIG_NUMARA_TEKRAR');
  const headerKural  = kurallar.find(k => k.kod === 'MIG_HEADER_EKSIK');

  const hatalar = [];
  let dosyalar;
  try {
    dosyalar = fs.readdirSync(klasor).filter(f => f.endsWith('.sql'));
  } catch (e) {
    return [];
  }

  const numaraMap = {}; // { "001": ["001_foo.sql", "001_bar.sql"] }

  for (const dosya of dosyalar) {
    const tamYol = path.join(klasor, dosya);
    const goreceli = path.relative(process.cwd(), tamYol).replace(/\\/g, '/');

    // (a) İsim formatı
    if (isimKural) {
      let regex;
      try {
        regex = new RegExp(isimKural.desen_regex);
      } catch (e) {
        log(`⚠  Bozuk migrations regex (${isimKural.kod}): ${e.message}`);
        regex = null;
      }
      if (regex && !regex.test(dosya)) {
        hatalar.push({
          dosya: goreceli,
          kod: isimKural.kod,
          tip: isimKural.siddet,
          satir: null,
          mesaj: `${isimKural.mesaj} — bulunan: ${dosya}`
        });
      }
    }

    // Numara topla (isim formatı geçerli olmasa bile baştaki 3 rakamı yakalamayı dene)
    const numaraMatch = dosya.match(/^([0-9]{3})_/);
    if (numaraMatch) {
      const num = numaraMatch[1];
      if (!numaraMap[num]) numaraMap[num] = [];
      numaraMap[num].push(dosya);
    }

    // (c) Header yorumu
    if (headerKural) {
      try {
        const icerik = fs.readFileSync(tamYol, 'utf8');
        const ilk10 = icerik.split('\n').slice(0, 10).join('\n');
        if (!/^\s*--/m.test(ilk10)) {
          hatalar.push({
            dosya: goreceli,
            kod: headerKural.kod,
            tip: headerKural.siddet,
            satir: 1,
            mesaj: `${headerKural.mesaj} — dosya: ${dosya}`
          });
        }
      } catch (e) {
        // okuma hatası — sessiz geç
      }
    }
  }

  // (b) Duplicate numara
  if (tekrarKural) {
    for (const [num, dosyaListesi] of Object.entries(numaraMap)) {
      if (dosyaListesi.length > 1) {
        for (const dosya of dosyaListesi) {
          const tamYol = path.join(klasor, dosya);
          const goreceli = path.relative(process.cwd(), tamYol).replace(/\\/g, '/');
          hatalar.push({
            dosya: goreceli,
            kod: tekrarKural.kod,
            tip: tekrarKural.siddet,
            satir: null,
            mesaj: `${tekrarKural.mesaj} — numara ${num}: ${dosyaListesi.join(', ')}`
          });
        }
      }
    }
  }

  return hatalar;
}

// ─────────────────────────────────────────────────────────────
// DOSYA TARAMA (HTML/JS/JSX/JSON)
// ─────────────────────────────────────────────────────────────

function dosyayiTara(dosyaYolu) {
  const icerik = fs.readFileSync(dosyaYolu, 'utf8');
  return [
    ...yasakStringKontrol(dosyaYolu, icerik),
    ...zorunluKontrol(dosyaYolu, icerik),
    ...i18nSenkronKontrol(dosyaYolu, icerik),
  ];
}

// ─────────────────────────────────────────────────────────────
// SİLİNMİŞ DOSYA KONTROLÜ (mevcut davranış)
// ─────────────────────────────────────────────────────────────

function silinmisKontrol() {
  log('\n🗑️  Silinmesi Gereken Dosyalar:');
  let bulundu = false;
  for (const dosya of (KURAL.silinmis_dosyalar.dosyalar || [])) {
    if (fs.existsSync(dosya)) {
      log(`  ❌ ${dosya} — Bu dosya silinmeli!`);
      hataSayisi++;
      bulundu = true;
    }
  }
  if (!bulundu) log('  ✅ Silinmesi gereken dosya yok.');
}

// ─────────────────────────────────────────────────────────────
// JSON RAPOR ÜRET (--json modu için — 25. oturum)
// ─────────────────────────────────────────────────────────────

function jsonRaporuYaz(tumDosyalar, dosyaRaporlari, hataSay, uyariSay) {
  // Kural bazlı özet — hangi kuralden kaç adet, hangi dosyalarda?
  const kuralOzet = {};
  for (const rapor of dosyaRaporlari) {
    for (const h of rapor.hatalar) {
      const kod = h.kod || 'BILINMEYEN';
      if (!kuralOzet[kod]) {
        kuralOzet[kod] = {
          tip: h.tip,
          mesaj: h.mesaj,
          sayi: 0,
          dosyalar: []
        };
      }
      kuralOzet[kod].sayi++;
      const varOlan = kuralOzet[kod].dosyalar.find(d => d.dosya === rapor.dosya);
      if (varOlan) {
        varOlan.sayi++;
        if (h.satir && !varOlan.satirlar.includes(h.satir)) {
          varOlan.satirlar.push(h.satir);
        }
      } else {
        kuralOzet[kod].dosyalar.push({
          dosya: rapor.dosya,
          sayi: 1,
          satirlar: h.satir ? [h.satir] : []
        });
      }
    }
  }

  const rapor = {
    tarih: new Date().toISOString(),
    commit_sha: process.env.GITHUB_SHA || null,
    commit_ref: process.env.GITHUB_REF_NAME || process.env.GITHUB_REF || null,
    workflow_run: process.env.GITHUB_RUN_NUMBER
      ? parseInt(process.env.GITHUB_RUN_NUMBER, 10)
      : null,
    ozet: {
      hata: hataSay,
      uyari: uyariSay,
      taranan_dosya: tumDosyalar.length,
      sorunlu_dosya: dosyaRaporlari.length,
      durum: hataSay > 0 ? 'kirmizi' : (uyariSay > 0 ? 'sari' : 'yesil')
    },
    kurallar: kuralOzet,
    dosyalar: dosyaRaporlari.map(r => ({
      dosya: r.dosya,
      hata_sayisi: r.hatalar.filter(h => h.tip === 'hata').length,
      uyari_sayisi: r.hatalar.filter(h => h.tip === 'uyari').length,
      hatalar: r.hatalar.map(h => ({
        kod: h.kod,
        tip: h.tip,
        satir: h.satir,
        mesaj: h.mesaj
      }))
    }))
  };

  try {
    fs.writeFileSync(RAPOR_DOSYA, JSON.stringify(rapor, null, 2) + '\n', 'utf8');
    log(`\n📄 JSON rapor yazıldı: ${path.relative(process.cwd(), RAPOR_DOSYA)}`);
  } catch (err) {
    log(`\n⚠  JSON rapor yazılamadı: ${err.message}`);
  }
}

// ─────────────────────────────────────────────────────────────
// NORMAL TARAMA MODU
// ─────────────────────────────────────────────────────────────

function normalTarama() {
  log('╔════════════════════════════════════════╗');
  log('║     AresPipe Kod Kalite Kontrolü       ║');
  log('╚════════════════════════════════════════╝');
  log(`📅 ${new Date().toLocaleString('tr-TR')}`);
  if (JSON_MODU) log('📄 JSON rapor modu aktif (--json)');
  log('');

  silinmisKontrol();

  const dosyalar = htmlDosyalariniGetir('.');
  const dosyaRaporlari = [];

  for (const dosyaYolu of dosyalar) {
    const goreceli = path.relative(process.cwd(), dosyaYolu).replace(/\\/g, '/');
    if (goreceli.startsWith('.github/')) continue;

    let tumHatalar;
    try {
      tumHatalar = dosyayiTara(dosyaYolu);
    } catch (err) {
      log(`⚠  ${goreceli} okuma hatası: ${err.message}`);
      continue;
    }

    if (tumHatalar.length > 0) {
      dosyaRaporlari.push({ dosya: goreceli, hatalar: tumHatalar });
      for (const h of tumHatalar) {
        if (h.tip === 'hata') hataSayisi++;
        else uyariSayisi++;
      }
    }
  }

  // MIGRATIONS KONTROLÜ (28. oturum) — üst-seviye klasör taraması, dosya iterate edilmez
  const migHatalari = migrationsKontrol('.');
  if (migHatalari.length > 0) {
    // Dosya bazında grupla ve dosyaRaporlari yapısına ekle
    const migDosyaMap = {};
    for (const h of migHatalari) {
      if (!migDosyaMap[h.dosya]) migDosyaMap[h.dosya] = [];
      migDosyaMap[h.dosya].push({
        kod: h.kod,
        tip: h.tip,
        satir: h.satir,
        mesaj: h.mesaj
      });
      if (h.tip === 'hata') hataSayisi++;
      else uyariSayisi++;
    }
    for (const [dosya, hatalar] of Object.entries(migDosyaMap)) {
      const mevcut = dosyaRaporlari.find(r => r.dosya === dosya);
      if (mevcut) {
        mevcut.hatalar.push(...hatalar);
      } else {
        dosyaRaporlari.push({ dosya, hatalar });
      }
    }
  }

  if (dosyaRaporlari.length === 0) {
    log('\n✅ Tüm dosyalar temiz!\n');
  } else {
    log('\n📋 Bulunan Sorunlar:\n');
    for (const rapor of dosyaRaporlari) {
      const hataSay = rapor.hatalar.filter(h => h.tip === 'hata').length;
      const uyariSay = rapor.hatalar.filter(h => h.tip === 'uyari').length;
      const etiket = hataSay > 0 ? '❌' : '⚠️';
      const etiketMetin =
        (hataSay > 0 ? `${hataSay} hata` : '') +
        (hataSay > 0 && uyariSay > 0 ? ', ' : '') +
        (uyariSay > 0 ? `${uyariSay} uyarı` : '');
      log(`${etiket} ${rapor.dosya} (${etiketMetin})`);
      for (const h of rapor.hatalar) {
        const ikon = h.tip === 'hata' ? '  ✗' : '  ⚠';
        const satirBilgi = h.satir ? ` (satır ${h.satir})` : '';
        const kodEtiket = h.kod ? `[${h.kod}] ` : '';
        log(`${ikon}${satirBilgi} ${kodEtiket}${h.mesaj}`);
      }
    }
  }

  log('\n════════════════════════════════════════');
  log(`📊 Sonuç: ${hataSayisi} hata, ${uyariSayisi} uyarı`);
  log(`📁 Taranan dosya: ${dosyalar.length}`);

  // JSON rapor yazımı — exit'ten ÖNCE (kırmızı CI'da bile rapor olsun)
  if (JSON_MODU) {
    jsonRaporuYaz(dosyalar, dosyaRaporlari, hataSayisi, uyariSayisi);
  }

  if (hataSayisi > 0) {
    log('\n❌ KALİTE KONTROLÜ BAŞARISIZ — Deploy engellendi.');
    log('════════════════════════════════════════\n');
    process.exit(1);
  } else if (uyariSayisi > 0) {
    log('\n⚠️  Uyarılar var ama deploy devam ediyor.');
    log('    (Pano > Sistem Sağlığı kartında detay görülebilir.)');
    log('════════════════════════════════════════\n');
    process.exit(0);
  } else {
    log('\n✅ KALİTE KONTROLÜ BAŞARILI — Deploy devam ediyor.');
    log('════════════════════════════════════════\n');
    process.exit(0);
  }
}

// ─────────────────────────────────────────────────────────────
// SELF-TEST MODU
// ─────────────────────────────────────────────────────────────
//
// "Kurallar gerçekten iş görüyor mu?" doğrulaması.
// .github/bozuk-ornekler/ klasöründeki her dosya kasten bozuktur.
// beklenen-hatalar.json her dosyadan hangi kural kodlarının çıkması
// gerektiğini listeler. Gerçekte çıkanlarla beklenenler karşılaştırılır.
//
// 28. oturum: "/" ile biten anahtarlar klasör-bazlı test olarak
// yorumlanır (migrations tarzı). Bu durumda migrations kuralı için
// kurallar.klasor geçici olarak bozuk-ornekler/<anahtar> yapılır.

function selfTest() {
  log('╔════════════════════════════════════════╗');
  log('║    AresPipe Self-Test (Kural Sağlığı)   ║');
  log('╚════════════════════════════════════════╝');
  log(`📅 ${new Date().toLocaleString('tr-TR')}\n`);

  if (!fs.existsSync(BOZUK_DIZIN)) {
    log(`❌ Bozuk örnek klasörü yok: ${BOZUK_DIZIN}`);
    log('   Self-test çalıştırılamaz.\n');
    process.exit(2);
  }
  if (!fs.existsSync(BEKLENEN_DOSYA)) {
    log(`❌ Beklenen hatalar dosyası yok: ${BEKLENEN_DOSYA}`);
    process.exit(2);
  }

  const beklenen = JSON.parse(fs.readFileSync(BEKLENEN_DOSYA, 'utf8'));
  let basarili = 0, basarisiz = 0;

  for (const [dosyaAd, beklenenKodlar] of Object.entries(beklenen)) {
    if (dosyaAd.startsWith('_')) continue; // meta anahtarlar (_aciklama vb.) atlanır
    const tamYol = path.join(BOZUK_DIZIN, dosyaAd);
    if (!fs.existsSync(tamYol)) {
      log(`❌ ${dosyaAd} — Dosya/klasör yok`);
      basarisiz++;
      continue;
    }

    let yakalananKodlar;

    if (dosyaAd.endsWith('/')) {
      // KLASÖR BAZLI TEST — migrations tarzı
      if (!KURAL.migrations) {
        log(`❌ ${dosyaAd} — Klasör bazlı test ama kurallar.json'da migrations bölümü yok`);
        basarisiz++;
        continue;
      }
      // Geçici klasör override
      const eskiKlasor = KURAL.migrations.klasor;
      KURAL.migrations.klasor = path.join('.github', 'bozuk-ornekler', dosyaAd);
      const migHatalari = migrationsKontrol('.');
      KURAL.migrations.klasor = eskiKlasor;
      yakalananKodlar = new Set(migHatalari.map(h => h.kod).filter(Boolean));
    } else {
      // DOSYA BAZLI TEST — mevcut davranış
      const icerik = fs.readFileSync(tamYol, 'utf8');
      // Sahte yol ver ki istisna listesi bozuk örneği vurmasın
      const sahteYol = dosyaAd.replace(/^/, 'bozuk-ornek-test-');
      const tumHatalar = [
        ...yasakStringKontrol(sahteYol, icerik),
        ...(dosyaAd.endsWith('.html') ? zorunluKontrol(sahteYol, icerik) : []),
        ...i18nSenkronKontrol(sahteYol, icerik),
      ];
      yakalananKodlar = new Set(tumHatalar.map(h => h.kod).filter(Boolean));
    }

    const eksikler = beklenenKodlar.filter(k => !yakalananKodlar.has(k));

    if (eksikler.length === 0) {
      log(`✅ ${dosyaAd}`);
      beklenenKodlar.forEach(k => log(`     ✓ [${k}] yakalandı`));
      basarili++;
    } else {
      log(`❌ ${dosyaAd}`);
      beklenenKodlar.forEach(k => {
        const mark = yakalananKodlar.has(k) ? '✓' : '✗';
        log(`     ${mark} [${k}] ${mark === '✓' ? 'yakalandı' : 'YAKALANMADI — kural bozuk!'}`);
      });
      basarisiz++;
    }
  }

  log('\n════════════════════════════════════════');
  log(`📊 Self-test: ${basarili} başarılı, ${basarisiz} başarısız`);

  if (basarisiz > 0) {
    log('\n❌ KURAL SAĞLIĞI BOZUK — Bazı kurallar görevini yapmıyor!');
    log('    Bu bir uyarı değil — sistem güvencesi zedelenmiş demektir.');
    log('════════════════════════════════════════\n');
    process.exit(1);
  } else {
    log('\n✅ Tüm kurallar sağlıklı çalışıyor.');
    log('════════════════════════════════════════\n');
    process.exit(0);
  }
}

// ─────────────────────────────────────────────────────────────
// ANA
// ─────────────────────────────────────────────────────────────

if (SELF_TEST) {
  selfTest();
} else {
  normalTarama();
}
