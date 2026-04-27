// Birim test — ares-asme.js helper doğrulama
// Çalıştırma: node test-asme.js

const ARES_BORU = require('./ares-asme.js');

let basari = 0;
let hata = 0;

function esit(adi, gerci, beklenen, tolerans) {
  tolerans = tolerans || 0.01;
  if (gerci === null && beklenen === null) {
    console.log(`✓ ${adi}: null (beklenen null)`);
    basari++;
    return;
  }
  if (gerci === null || beklenen === null) {
    console.log(`✗ ${adi}: ${gerci} (beklenen ${beklenen})`);
    hata++;
    return;
  }
  if (typeof gerci === 'string') {
    if (gerci === beklenen) {
      console.log(`✓ ${adi}: ${gerci}`);
      basari++;
    } else {
      console.log(`✗ ${adi}: ${gerci} (beklenen ${beklenen})`);
      hata++;
    }
    return;
  }
  const fark = Math.abs(gerci - beklenen);
  if (fark <= tolerans) {
    console.log(`✓ ${adi}: ${gerci} (beklenen ${beklenen})`);
    basari++;
  } else {
    console.log(`✗ ${adi}: ${gerci} (beklenen ${beklenen}, fark ${fark})`);
    hata++;
  }
}

console.log('═══════════════════════════════════════════════');
console.log('  ARES_BORU Helper Birim Testi');
console.log('═══════════════════════════════════════════════\n');

console.log('▶ KARBON ÇELİK (B36.10M)');
esit('DN100 SCH40 et', ARES_BORU.etKalinligi(100, '40', 'karbon'), 6.02);
esit('DN100 SCH40 OD', ARES_BORU.disCap(100, 'karbon'), 114.3);
esit('DN100 SCH40 IC', ARES_BORU.icCap(100, '40', 'karbon'), 102.26);
esit('DN100 SCH40 kg/m', ARES_BORU.agirlikKgM(100, '40', 'karbon'), 16.08);
esit('DN200 SCH40 et', ARES_BORU.etKalinligi(200, '40', 'karbon'), 8.18);
esit('DN200 SCH40 kg/m', ARES_BORU.agirlikKgM(200, '40', 'karbon'), 42.55);
esit('DN50 SCH80 et', ARES_BORU.etKalinligi(50, '80', 'karbon'), 5.54);
esit('DN300 STD et', ARES_BORU.etKalinligi(300, 'STD', 'karbon'), 9.53);
esit('DN300 SCH40 et (STD≠40 üstte)', ARES_BORU.etKalinligi(300, '40', 'karbon'), 10.31);

console.log('\n▶ PASLANMAZ (B36.19M)');
esit('DN100 SCH40S et', ARES_BORU.etKalinligi(100, '40S', 'paslanmaz'), 6.02);
esit('DN100 SCH40S kg/m', ARES_BORU.agirlikKgM(100, '40S', 'paslanmaz'), 16.40);
esit('DN200 SCH40S et', ARES_BORU.etKalinligi(200, '40S', 'paslanmaz'), 8.18);
esit('DN300 SCH40S et (B36.10\'dan farklı)', ARES_BORU.etKalinligi(300, '40S', 'paslanmaz'), 9.52);
esit('DN350 SCH40S (paslanmazda yok)', ARES_BORU.etKalinligi(350, '40S', 'paslanmaz'), null);
esit('DN350 SCH10S et (paslanmaz)', ARES_BORU.etKalinligi(350, '10S', 'paslanmaz'), 4.78);
esit('316L→paslanmaz normalize', ARES_BORU.etKalinligi(100, '40S', '316L'), 6.02);

console.log('\n▶ ALÜMİNYUM (B241)');
esit('DN100 SCH40 et', ARES_BORU.etKalinligi(100, '40', 'aluminyum'), 6.02);
esit('DN100 SCH40 kg/m (yoğunluk hesabı)', ARES_BORU.agirlikKgM(100, '40', 'aluminyum'), 5.529, 0.05);
esit('DN150 SCH40 kg/m', ARES_BORU.agirlikKgM(150, '40', 'aluminyum'), 9.728, 0.05);
esit('6061→aluminyum normalize', ARES_BORU.etKalinligi(100, '40', '6061'), 6.02);
esit('Alüm DN100 SCH160 (yok)', ARES_BORU.etKalinligi(100, '160', 'aluminyum'), null);

console.log('\n▶ CUNİFE (EEMUA-144)');
esit('DN200 20bar et', ARES_BORU.cunifeEtKalinligi(200, 20), 4.5);
esit('DN200 20bar OD', ARES_BORU.cunifeDisCap(200), 219.1);
esit('DN200 20bar kg/m', ARES_BORU.cunifeAgirlikKgM(200, 20), 27.122, 0.05);
esit('DN300 20bar et', ARES_BORU.cunifeEtKalinligi(300, 20), 7.0);
esit('DN150 OD farklı (159 ≠ ASME 168.3)', ARES_BORU.cunifeDisCap(150), 159.0);
esit('DN300 OD yakın (323.9 ≈ ASME 323.8)', ARES_BORU.cunifeDisCap(300), 323.9);
esit('DN200 16bar et', ARES_BORU.cunifeEtKalinligi(200, 16), 3.5);
esit('cuni→cunife normalize', ARES_BORU.disCap(200, 'cuni'), 219.1);
esit('cunife on ana API uyarı verir', ARES_BORU.etKalinligi(200, 20, 'cunife'), null);

console.log('\n▶ TOPLAM AĞIRLIK');
esit('DN100 SCH40 karbon 1m', ARES_BORU.boruAgirligiKg(100, '40', 1000, 'karbon'), 16.08);
esit('DN100 SCH40 karbon 6m', ARES_BORU.boruAgirligiKg(100, '40', 6000, 'karbon'), 96.48);
esit('DN50 SCH40 karbon 1m', ARES_BORU.boruAgirligiKg(50, '40', 1000, 'karbon'), 5.44);
esit('CuNife DN200 20bar 6m', ARES_BORU.cunifeBoruAgirligiKg(200, 20, 6000), 162.732, 0.5);

console.log('\n▶ NPS ↔ DN');
esit('NPS 1/2 → DN15', ARES_BORU.npsToDn('1/2'), 15);
esit('NPS 4 → DN100', ARES_BORU.npsToDn('4'), 100);
esit('NPS 1 1/4 → DN32', ARES_BORU.npsToDn('1 1/4'), 32);
esit('NPS 4" → DN100 (tırnak)', ARES_BORU.npsToDn('4"'), 100);
esit('DN100 → NPS 4', ARES_BORU.dnToNps(100), '4');
esit('DN15 → NPS 1/2', ARES_BORU.dnToNps(15), '1/2');

console.log('\n▶ VARSAYILAN SCHEDULE');
esit('DN100 default', ARES_BORU.varsayilanSchedule(100), '40');
esit('DN300 default', ARES_BORU.varsayilanSchedule(300), 'STD');
esit('DN500 default', ARES_BORU.varsayilanSchedule(500), 'STD');

console.log('\n▶ SCHEDULE NORMALIZE (PAOR PDF varyantları)');
esit('"Sch 40" → 40', ARES_BORU.etKalinligi(100, 'Sch 40', 'karbon'), 6.02);
esit('"SCH40" → 40', ARES_BORU.etKalinligi(100, 'SCH40', 'karbon'), 6.02);
esit('"  40 " → 40 (whitespace)', ARES_BORU.etKalinligi(100, '  40 ', 'karbon'), 6.02);

console.log('\n▶ DN/SCH LİSTELERİ');
const karbonDN = ARES_BORU.dnListesi('karbon');
esit('Karbon DN sayısı', karbonDN.length, 20);
esit('İlk DN', karbonDN[0], 15);
esit('Son DN', karbonDN[karbonDN.length-1], 600);

const dn100Sch = ARES_BORU.scheduleListesi(100, 'karbon');
esit('DN100 karbon schedule sayısı', dn100Sch.length, 10);

console.log('\n═══════════════════════════════════════════════');
console.log(`  ${basari} başarılı, ${hata} başarısız`);
console.log('═══════════════════════════════════════════════');
process.exit(hata > 0 ? 1 : 0);
