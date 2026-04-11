#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const KURALLAR_DOSYA = path.join(__dirname, 'kurallar.json');
const KURAL = JSON.parse(fs.readFileSync(KURALLAR_DOSYA, 'utf8'));

let hataSayisi = 0;
let uyariSayisi = 0;
const raporSatirlari = [];

function log(mesaj) {
  raporSatirlari.push(mesaj);
  console.log(mesaj);
}

function htmlDosyalariniGetir(dizin, liste = []) {
  const girişler = fs.readdirSync(dizin, { withFileTypes: true });
  for (const giris of girişler) {
    if (giris.name.startsWith('.') || giris.name === 'node_modules') continue;
    const tamYol = path.join(dizin, giris.name);
    if (giris.isDirectory()) {
      htmlDosyalariniGetir(tamYol, liste);
    } else if (giris.name.endsWith('.html') || giris.name.endsWith('.js') || giris.name.endsWith('.json')) {
      liste.push(tamYol);
    }
  }
  return liste;
}

function dosyaIstisnasiMi(dosyaYolu) {
  const normalize = dosyaYolu.replace(/\\/g, '/');
  return KURAL.istisnalar.dosyalar.some(istisna =>
    normalize.endsWith(istisna.replace(/\\/g, '/'))
  );
}

function silinmisKontrol() {
  log('\n🗑️  Silinmesi Gereken Dosyalar:');
  let bulundu = false;
  for (const dosya of KURAL.silinmis_dosyalar.dosyalar) {
    if (fs.existsSync(dosya)) {
      log(`  ❌ ${dosya} — Bu dosya silinmeli!`);
      hataSayisi++;
      bulundu = true;
    }
  }
  if (!bulundu) log('  ✅ Silinmesi gereken dosya yok.');
}

function yasatKontrol(dosyaYolu, icerik) {
  const goreceli = path.relative(process.cwd(), dosyaYolu).replace(/\\/g, '/');
  const hatalar = [];

  for (const kural of KURAL.yasak_string.kurallar) {
    if (icerik.includes(kural.desen)) {
      const satirNo = icerik.split('\n').findIndex(s => s.includes(kural.desen)) + 1;
      hatalar.push({ tip: kural.siddet, satir: satirNo, mesaj: kural.mesaj, desen: kural.desen });
    }
  }

  return hatalar;
}

function zorunluKontrol(dosyaYolu, icerik) {
  if (!dosyaYolu.endsWith('.html')) return [];
  if (dosyaIstisnasiMi(dosyaYolu)) return [];

  const hatalar = [];
  for (const kural of KURAL.zorunlu_her_html.kurallar) {
    const arananlar = [kural.desen];
    if (kural.desene_alternatif) arananlar.push(kural.desene_alternatif);
    const bulundu = arananlar.some(d => icerik.includes(d));
    if (!bulundu) {
      hatalar.push({ tip: kural.siddet, satir: null, mesaj: kural.mesaj, desen: kural.desen });
    }
  }
  return hatalar;
}

function main() {
  log('╔════════════════════════════════════════╗');
  log('║     AresPipe Kod Kalite Kontrolü       ║');
  log('╚════════════════════════════════════════╝');
  log(`📅 ${new Date().toLocaleString('tr-TR')}\n`);

  silinmisKontrol();

  const dosyalar = htmlDosyalariniGetir('.');
  const dosyaRaporlari = [];

  for (const dosyaYolu of dosyalar) {
    const goreceli = path.relative(process.cwd(), dosyaYolu).replace(/\\/g, '/');
    if (goreceli.startsWith('.github/')) continue;

    const icerik = fs.readFileSync(dosyaYolu, 'utf8');
    const yasatHatalari = yasatKontrol(dosyaYolu, icerik);
    const zorunluHatalari = zorunluKontrol(dosyaYolu, icerik);
    const tumHatalar = [...yasatHatalari, ...zorunluHatalari];

    if (tumHatalar.length > 0) {
      dosyaRaporlari.push({ dosya: goreceli, hatalar: tumHatalar });
      for (const h of tumHatalar) {
        if (h.tip === 'hata') hataSayisi++;
        else uyariSayisi++;
      }
    }
  }

  if (dosyaRaporlari.length === 0) {
    log('\n✅ Tüm dosyalar temiz!\n');
  } else {
    log('\n📋 Bulunan Sorunlar:\n');
    for (const rapor of dosyaRaporlari) {
      const hataSayisiDosya = rapor.hatalar.filter(h => h.tip === 'hata').length;
      const uyariSayisiDosya = rapor.hatalar.filter(h => h.tip === 'uyari').length;
      const etiket = hataSayisiDosya > 0 ? '❌' : '⚠️';
      log(`${etiket} ${rapor.dosya} (${hataSayisiDosya > 0 ? hataSayisiDosya + ' hata' : ''}${uyariSayisiDosya > 0 ? (hataSayisiDosya > 0 ? ', ' : '') + uyariSayisiDosya + ' uyarı' : ''})`);
      for (const h of rapor.hatalar) {
        const ikon = h.tip === 'hata' ? '  ✗' : '  ⚠';
        const satirBilgi = h.satir ? ` (satır ${h.satir})` : '';
        log(`${ikon}${satirBilgi} ${h.mesaj}`);
      }
    }
  }

  log('\n════════════════════════════════════════');
  log(`📊 Sonuç: ${hataSayisi} hata, ${uyariSayisi} uyarı`);
  log(`📁 Taranan dosya: ${dosyalar.length}`);

  if (hataSayisi > 0) {
    log('\n❌ KALİTE KONTROLÜ BAŞARISIZ — Deploy engellendi.');
    log('════════════════════════════════════════\n');
    process.exit(1);
  } else if (uyariSayisi > 0) {
    log('\n⚠️  Uyarılar var ama deploy devam ediyor.');
    log('════════════════════════════════════════\n');
    process.exit(0);
  } else {
    log('\n✅ KALİTE KONTROLÜ BAŞARILI — Deploy devam ediyor.');
    log('════════════════════════════════════════\n');
    process.exit(0);
  }
}

main();
