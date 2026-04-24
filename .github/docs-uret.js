#!/usr/bin/env node
// .github/docs-uret.js
// Hibrit doküman üreticisi — manuel metne dokunmaz, AUTO sınırları arasını yeniden yazar.
// Her push'ta docs-uret.yml workflow'u tarafından çalıştırılır.
//
// Kullanım:
//   node .github/docs-uret.js
//
// Tasarım kararları:
// - AUTO-START:xxx ile AUTO-END:xxx ARASI yeniden yazılır, sınırlar dahil
// - Sınır dışı manuel metne ASLA dokunulmaz
// - Bilinmeyen bölüm adı (case) → dokunulmaz (atlanır)
// - Herhangi bir bölüm hata atarsa → diğerleri devam eder
// - Script her durumda exit 0 — CI asla kırılmaz

const fs = require('fs');
const path = require('path');

// -------- KONFİG --------
const KOK = path.resolve(__dirname, '..');  // .github'ın bir üstü = repo kökü

// Hedef markdown dosyaları (her dosyada AUTO sınırları aranır, yoksa atlanır)
// Yeni hedef eklemek için bu listeye ekle — başka yerde değişiklik gerekmez.
const HEDEF_DOSYALAR = [
  'README.md',
  'docs/ONBOARDING.md',
  'docs/ARCHITECTURE.md',
  'docs/DATABASE.md',
  'docs/API.md',
  'docs/LOCAL-DEV.md',
];

// -------- YARDIMCI --------

function dosyaOku(rel) {
  try {
    return fs.readFileSync(path.join(KOK, rel), 'utf8');
  } catch (e) {
    return null;
  }
}

function klasorTara(rel, regex) {
  try {
    const dir = path.join(KOK, rel);
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter(f => regex.test(f));
  } catch (e) {
    return [];
  }
}

function zamanDamga() {
  return new Date().toISOString().slice(0, 10);  // YYYY-MM-DD
}

// -------- ÜRETİCİ FONKSİYONLAR --------

function sayfaSayisi() {
  try {
    let sayim = 0;
    // Kök seviyesi
    if (fs.existsSync(KOK)) {
      sayim += fs.readdirSync(KOK).filter(f => f.endsWith('.html')).length;
    }
    // admin/ alt klasörü (AresPipe'da admin/panel.html var)
    const adminDir = path.join(KOK, 'admin');
    if (fs.existsSync(adminDir)) {
      sayim += fs.readdirSync(adminDir).filter(f => f.endsWith('.html')).length;
    }
    return sayim;
  } catch (e) {
    return '?';
  }
}

function mobileSayfaSayisi() {
  try {
    const dir = path.join(KOK, 'mobile/src');
    if (!fs.existsSync(dir)) return 0;
    let sayim = 0;
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      if (item.isFile() && item.name.endsWith('.jsx')) sayim++;
      else if (item.isDirectory()) {
        try {
          sayim += fs.readdirSync(path.join(dir, item.name))
            .filter(f => f.endsWith('.jsx')).length;
        } catch (_) { /* alt dizin okunamadı, atla */ }
      }
    }
    return sayim;
  } catch (e) {
    return '?';
  }
}

function tabloListesi() {
  const bulunanlar = new Set();
  const re = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?public\.(\w+)/gi;

  // Baseline + tüm migration dosyaları
  const migDosyalari = klasorTara('migrations', /^\d{3}_.+\.sql$/);
  for (const f of migDosyalari) {
    const mig = dosyaOku(`migrations/${f}`);
    if (!mig) continue;
    let m;
    const reLocal = new RegExp(re.source, re.flags);
    while ((m = reLocal.exec(mig)) !== null) {
      bulunanlar.add(m[1]);
    }
  }
  return [...bulunanlar].sort();
}

function apiEndpointListesi() {
  try {
    const dir = path.join(KOK, 'api');
    if (!fs.existsSync(dir)) return [];
    const dosyalar = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
    const sonuc = [];
    for (const f of dosyalar) {
      const icerik = fs.readFileSync(path.join(dir, f), 'utf8');
      const ilkSatirlar = icerik.split('\n').slice(0, 5);
      const yorumlar = ilkSatirlar
        .filter(s => s.trim().startsWith('//'))
        .map(s => s.replace(/^\s*\/\/\s?/, '').trim());
      // İlk yorum = dosya yolu, ikinci = açıklama, üçüncü = güvenlik/not
      const aciklama = yorumlar[1] || '_(açıklama yok — yorum başlığı ekle)_';
      const not = yorumlar[2] || '';
      sonuc.push({ dosya: f, aciklama, not });
    }
    return sonuc.sort((a, b) => a.dosya.localeCompare(b.dosya));
  } catch (e) {
    return [];
  }
}

function kuralBilgisi() {
  try {
    const json = JSON.parse(dosyaOku('.github/kurallar.json') || '{}');
    const kategoriler = Object.keys(json);
    let toplam = 0;
    const kategoriDetay = {};
    for (const k of kategoriler) {
      const adet = Object.keys(json[k] || {}).length;
      toplam += adet;
      kategoriDetay[k] = adet;
    }
    return { toplam, kategoriler, kategoriDetay };
  } catch (e) {
    return { toplam: '?', kategoriler: [], kategoriDetay: {} };
  }
}

function migrationSayisi() {
  return klasorTara('migrations', /^\d{3}_.+\.sql$/).length;
}

// -------- AUTO BÖLÜMLERİ ÜRETİMİ --------
// Her bölüm kendi try/catch'inde — biri hata verirse diğerleri etkilenmesin.

function bolumUret(bolumAdi) {
  try {
    switch (bolumAdi) {
      case 'istatistikler': {
        const sayfa = sayfaSayisi();
        const mob = mobileSayfaSayisi();
        const tablo = tabloListesi().length;
        const ep = apiEndpointListesi().length;
        const k = kuralBilgisi();
        const mig = migrationSayisi();
        return [
          `> Son güncelleme: ${zamanDamga()} (otomatik)`,
          '',
          `- **Web sayfa:** ${sayfa}`,
          `- **Mobil ekran (React):** ${mob}`,
          `- **Tablo:** ${tablo}`,
          `- **API endpoint:** ${ep}`,
          `- **CI kural:** ${k.toplam} (${k.kategoriler.length} kategori)`,
          `- **Migration dosyası:** ${mig}`,
        ].join('\n');
      }
      case 'tablolar': {
        const t = tabloListesi();
        if (t.length === 0) return '_(Tablo bulunamadı — migrations/ boş veya baseline yok)_';
        return [
          `> Toplam ${t.length} tablo. Son güncelleme: ${zamanDamga()}.`,
          '',
          ...t.map(ad => `- \`${ad}\``),
        ].join('\n');
      }
      case 'endpointler': {
        const e = apiEndpointListesi();
        if (e.length === 0) return '_(Endpoint bulunamadı)_';
        return [
          `> Toplam ${e.length} endpoint. Son güncelleme: ${zamanDamga()}.`,
          '',
          ...e.map(({ dosya, aciklama, not }) => {
            const notStr = not ? ` — _${not}_` : '';
            return `- **\`api/${dosya}\`** — ${aciklama}${notStr}`;
          }),
        ].join('\n');
      }
      case 'kurallar': {
        const k = kuralBilgisi();
        if (k.toplam === '?') return '_(kurallar.json okunamadı)_';
        return [
          `> Toplam ${k.toplam} kural, ${k.kategoriler.length} kategori. Son güncelleme: ${zamanDamga()}.`,
          '',
          ...Object.entries(k.kategoriDetay).map(([kat, sayi]) => `- **${kat}**: ${sayi} kural`),
        ].join('\n');
      }
      default:
        return null;  // bilinmeyen bölüm adı
    }
  } catch (e) {
    return `_(Bölüm üretilirken hata: ${e.message})_`;
  }
}

// -------- AUTO SINIR MOTORU --------

function dosyaIsle(relYol) {
  const tamYol = path.join(KOK, relYol);
  if (!fs.existsSync(tamYol)) return { durum: 'yok', dosya: relYol };

  const orijinal = fs.readFileSync(tamYol, 'utf8');

  // Bozuk sınır kontrolü: AUTO-START sayısı ile AUTO-END sayısı aynı mı?
  const baslangicSayi = (orijinal.match(/<!--\s*AUTO-START:[\w-]+\s*-->/g) || []).length;
  const bitisSayi = (orijinal.match(/<!--\s*AUTO-END:[\w-]+\s*-->/g) || []).length;

  if (baslangicSayi !== bitisSayi) {
    return {
      durum: 'bozuk-sinir',
      dosya: relYol,
      baslangic: baslangicSayi,
      bitis: bitisSayi,
    };
  }

  if (baslangicSayi === 0) {
    return { durum: 'auto-yok', dosya: relYol };
  }

  // AUTO-START:xxx ... AUTO-END:xxx çiftlerini yeniden yaz
  const re = /<!--\s*AUTO-START:([\w-]+)\s*-->([\s\S]*?)<!--\s*AUTO-END:\1\s*-->/g;
  const bolumler = [];
  let degisti = false;

  const yeni = orijinal.replace(re, (tam, bolumAdi) => {
    const yeniIcerik = bolumUret(bolumAdi);
    if (yeniIcerik === null) {
      bolumler.push(`${bolumAdi}(?)`);
      return tam;  // bilinmeyen → dokunma
    }
    bolumler.push(bolumAdi);
    const yeniBlok = `<!-- AUTO-START:${bolumAdi} -->\n${yeniIcerik}\n<!-- AUTO-END:${bolumAdi} -->`;
    if (tam !== yeniBlok) degisti = true;
    return yeniBlok;
  });

  if (!degisti) {
    return { durum: 'degismedi', dosya: relYol, bolumler };
  }

  fs.writeFileSync(tamYol, yeni, 'utf8');
  return { durum: 'guncellendi', dosya: relYol, bolumler };
}

// -------- ANA --------

function ana() {
  console.log('📝 docs-uret çalışıyor...\n');
  const raporlar = [];

  for (const hedef of HEDEF_DOSYALAR) {
    try {
      raporlar.push(dosyaIsle(hedef));
    } catch (e) {
      raporlar.push({ durum: 'hata', dosya: hedef, hata: e.message });
    }
  }

  const sayilar = {
    guncellendi: raporlar.filter(r => r.durum === 'guncellendi'),
    degismedi: raporlar.filter(r => r.durum === 'degismedi'),
    'auto-yok': raporlar.filter(r => r.durum === 'auto-yok'),
    yok: raporlar.filter(r => r.durum === 'yok'),
    'bozuk-sinir': raporlar.filter(r => r.durum === 'bozuk-sinir'),
    hata: raporlar.filter(r => r.durum === 'hata'),
  };

  console.log(`✅ Güncellenen: ${sayilar.guncellendi.length}`);
  sayilar.guncellendi.forEach(r => console.log(`   ${r.dosya} [${r.bolumler.join(', ')}]`));

  if (sayilar.degismedi.length) {
    console.log(`⚪ Değişmeyen: ${sayilar.degismedi.length}`);
    sayilar.degismedi.forEach(r => console.log(`   ${r.dosya}`));
  }

  if (sayilar['auto-yok'].length) {
    console.log(`⏭️  AUTO sınırı yok (dokunulmadı): ${sayilar['auto-yok'].length}`);
    sayilar['auto-yok'].forEach(r => console.log(`   ${r.dosya}`));
  }

  if (sayilar.yok.length) {
    console.log(`❔ Dosya yok: ${sayilar.yok.length}`);
    sayilar.yok.forEach(r => console.log(`   ${r.dosya}`));
  }

  if (sayilar['bozuk-sinir'].length) {
    console.log(`⚠️  Bozuk AUTO sınırı (dokunulmadı): ${sayilar['bozuk-sinir'].length}`);
    sayilar['bozuk-sinir'].forEach(r =>
      console.log(`   ${r.dosya} (AUTO-START: ${r.baslangic}, AUTO-END: ${r.bitis})`)
    );
  }

  if (sayilar.hata.length) {
    console.log(`❌ Hata: ${sayilar.hata.length}`);
    sayilar.hata.forEach(r => console.log(`   ${r.dosya}: ${r.hata}`));
  }

  console.log('\n✨ docs-uret tamamlandı.');
  process.exit(0);  // Her durumda temiz çık — CI'ı asla kırma
}

ana();
