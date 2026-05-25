'use strict';
// ============================================================================
// asama1-l2-canli.mjs — Oturum 123 ÖNCELİK 1 MÜHÜR (uçtan uca L2 doğrulaması)
// ----------------------------------------------------------------------------
// 122'de band-B METİN onarımı kanıtlandı (pilot T9). Bu test ondan FARKLI:
// gerçek L2 MOTORUNU (metinNormalle -> aileBirlestir -> parse) gerçek NB1137
// spool ham'ına uçtan uca çalıştırır. Oturum 123'te 6 gerçek glyph spool PDF'i
// gerçek motorda (pdf-parse v1.1.1) koşuldu; 6/6 -> parser_seviye='l2'.
//
// PDF GEREKTİRMEZ (CI-güvenli): fixture'lar gerçek spool PDF'lerinin pdf-parse
// v1.1.1 HAM çıktısının \u-escape kopyasıdır (pure-ASCII, paste-güvenli — T9 gibi).
// İki facet temsil edilir:
//   • Y200 (karbon/galvaniz, metrik ODxWT)  -> boru_mm, tam alan (139.7x4.5)
//   • M130 (paslanmaz, emperyal inç+Sch)     -> boru_sch (nps/schedule)
// + temiz-regresyon: çapa ham'da varsa band-B ÇALIŞMAZ, gerçek Türkçe korunur.
//
// MK-51.2 (5+ gerçek PDF): tam koşu yerel B-runner ile yapıldı (müşteri PDF'leri,
// KARAR-48.1 → repo'ya konmaz). Bu CI mühürü iki temsilci facet'i sabitler.
// ============================================================================

import { parse, malzemeTablosuCikar } from '../lib/l2-parser.js';
import { aileBirlestir } from '../lib/katman-birlestirici.js';
import { metinNormalle } from '../lib/glyph-onar.js';

let gecen = 0, kalan = 0;
function ok(ad, kosul, detay) {
  if (kosul) { gecen++; console.log('  \u2705 ' + ad); }
  else { kalan++; console.log('  \u26d4 ' + ad + (detay !== undefined ? '  \u2192  ' + detay : '')); }
}

// --- Gerçek NB1137 spool ham (pdf-parse v1.1.1, band-A şifreli, \u-escape) ---
// karbon ornek (galvaniz) (karbon/galvaniz, metrik). Çapa: pmlli=k^jb (-29 = SPOOL NAME).
const HAM_Y200 = "\n\nOPRU\nOPRP\nOPRU\nOPRP\nPNR\nRR\nPNR\ncoK=p_coK=^cqcoK=qlm\nmp\nrm\nct\nmprm\nct\nJpMN\nabjlJMMMJMMN\nMVJMNJOS\nPV=\u00E2\u00D6\n_MMMM\nd~\u00E4\u00EE~\u00E5\u00E1\u00F2\n\u00EE\u00E2~\u00F3~\nNENF\nUMQJa\u00EA~\u00E1\u00E5=c\u00EA\u00E7\u00E3=b\u00F1\u00EDK=a\u00C9\u00C5\u00E2\u00EB=p\u00F3\u00EBKJvOMMJd~\u00E4\u00EE\nklqW=I\n^\n_\n`\na\nb\nc\nUTSRQPON\na\u00EA~\u00EF\u00E1\u00E5\u00D6=\u00EB\u00F3\u00E3\u00C4\u00E7\u00E4\u00EBa\u00EA~\u00EF\u00E1\u00E5\u00D6=\u00EB\u00F3\u00E3\u00C4\u00E7\u00E4\u00EB\npmlli=k^jb\ntbiafkd=krj_bo`rq=krj_bo\nm^oq=krj_bo\nk\u00E7^\u00C7\u00C9\u00ED^\u00E7\u03C3\u00E2\u00E4~\u00E3~_\u00E7\u00F3\u00EC\u00ED_\u00E7\u00F3j~\u00E4\u00F2\u00C9\u00E3\u00C9^\u011F\u03C3\u00EA\u00E4\u03C3\u00E2\nj~\u00E4\u00F2\u00C9\u00E3\u00C9=i\u00E1\u00EB\u00ED\u00C9\u00EB\u00E1\np\u00E9\u00E7\u00E7\u00E4J`\u00EC\u00ED`\u00EC\u00ED\ni\u00C9\u00E5\u00D6\u00ED\u00DC\np\u00C9\u00ED=i\u00C9\u00E5\u00D6\u00ED\u00DC\nLq\u00EA~\u00E5\u00EB\u00E9\u00E7\u00EA\u00ED\no\u00E7\u00ED~\u00ED\u00E1\u00E7\u00E5^\u00E5\u00D6\u00E4\u00C9`\u00EC\u00ED=^\u00EF~\u00F3\np\u00EDL_\u00ED\u00EFLb\u00E5\u00C7\n`\u00EC\u00ED=C=_\u00C9\u00E5\u00C7\u00E1\u00E5\u00D6=f\u00E5\u00D1\u00E7`\u00EC\u00ED=C=_\u00C9\u00E5\u00C7\u00E1\u00E5\u00D6=f\u00E5\u00D1\u00E7\nqfqibW\n`eb`h=_vWao^tkWpebbqW\na^qbW\npmlli=klW\nmog=klWobsW\np\u00EC\u00EA\u00D1~\u00C5\u00C9=q\u00EA\u00C9~\u00ED\u00E3\u00C9\u00E5\u00EDW\nmfmb=klW\nq\u00E7\u00ED~\u00E4=t\u00C9\u00E1\u00D6\u00DC\u00EDW\nN_\u00E7\u00EA\u00EC=a\u00E1\u00E2\u00E1\u015F\u00E4\u00E1=\u00C7\u00C9\u00E4\u00E1\u00E2=pqPTJ=PKN=p\u00C9\u00EA\u00ED\u00E1\u00D1\u00E1\u00E2~\u00E4\u03C3NPVKT\u00F1QKRORRP=pqPTPUKOUP\npMNJNORRO\nORROQMMOUM\nORROOMTUM\nNORRONPVKT\u00F1QK\nPNR\nOPRP\nOSN=H=qtbbk|ab`h|ab`hPEUPMMF\nNURM=J=`i\nOOM=H=coNS\n`\u00E7\u00E5\u00ED\u00E1\u00E5\u00EC\u00C9W\n=abjlJMMMJMMOLpMO\nNV=H=m^ppbkdbo|ab`hQENMVMMF\nNRPR=J=`i\nOOM=H=coNS\n`\u00E7\u00E5\u00ED\u00E1\u00E5\u00EC\u00C9W\n=abjlJMMMJMMP\nNN\nUV\u00B0\nm^ppbkdbo|ab`hQENMVMMFHNP\noZOUMKM\ntN\nk\nrm";

// paslanmaz ornek (St.St) (paslanmaz, emperyal inç+Sch). Aynı font/şifre.
const HAM_M130 = "\n\nNVQP\nPST\nNVQP\nPST\nSPS\nNRTSNRTS\nSPS\ncoK=p_coK=^cqcoK=qlm\nmp\nrm\nct\nmprm\nct\nJpMN\nabjlJMMMJMMQ\nNOJMOJOS\nNM=\u00E2\u00D6\n_MMMM\nm~\u00EB\u00E4~\u00E5\u00E3~\u00F2\n\u00EE\u00E2~\u00F3~\nNENF\naks=m\u00E1\u00E9\u00C9=`\u00E4~\u00EB\u00EB=fff\nUNTJt~\u00ED\u00C9\u00EA\u00E3\u00E1\u00EB\u00ED=p\u00F3\u00EB\u00ED\u00C9\u00E3JjNPMJp\u00EDKp\u00EDK\nklqW=I\n^\n_\n`\na\nb\nc\nUTSRQPON\na\u00EA~\u00EF\u00E1\u00E5\u00D6=\u00EB\u00F3\u00E3\u00C4\u00E7\u00E4\u00EBa\u00EA~\u00EF\u00E1\u00E5\u00D6=\u00EB\u00F3\u00E3\u00C4\u00E7\u00E4\u00EB\npmlli=k^jb\ntbiafkd=krj_bo`rq=krj_bo\nm^oq=krj_bo\nk\u00E7^\u00C7\u00C9\u00ED^\u00E7\u03C3\u00E2\u00E4~\u00E3~_\u00E7\u00F3\u00EC\u00ED_\u00E7\u00F3j~\u00E4\u00F2\u00C9\u00E3\u00C9^\u011F\u03C3\u00EA\u00E4\u03C3\u00E2\nj~\u00E4\u00F2\u00C9\u00E3\u00C9=i\u00E1\u00EB\u00ED\u00C9\u00EB\u00E1\np\u00E9\u00E7\u00E7\u00E4J`\u00EC\u00ED`\u00EC\u00ED\ni\u00C9\u00E5\u00D6\u00ED\u00DC\np\u00C9\u00ED=i\u00C9\u00E5\u00D6\u00ED\u00DC\nLq\u00EA~\u00E5\u00EB\u00E9\u00E7\u00EA\u00ED\no\u00E7\u00ED~\u00ED\u00E1\u00E7\u00E5^\u00E5\u00D6\u00E4\u00C9`\u00EC\u00ED=^\u00EF~\u00F3\np\u00EDL_\u00ED\u00EFLb\u00E5\u00C7\n`\u00EC\u00ED=C=_\u00C9\u00E5\u00C7\u00E1\u00E5\u00D6=f\u00E5\u00D1\u00E7`\u00EC\u00ED=C=_\u00C9\u00E5\u00C7\u00E1\u00E5\u00D6=f\u00E5\u00D1\u00E7\nqfqibW\n`eb`h=_vWao^tkWpebbqW\na^qbW\npmlli=klW\nmog=klWobsW\np\u00EC\u00EA\u00D1~\u00C5\u00C9=q\u00EA\u00C9~\u00ED\u00E3\u00C9\u00E5\u00EDW\nmfmb=klW\nq\u00E7\u00ED~\u00E4=t\u00C9\u00E1\u00D6\u00DC\u00EDW\nN_\u00E7\u00EA\u00EC=a\u00E1\u00E2\u00E1\u015F\u00EB\u00E1\u00F2=m~\u00EB\u00E4~\u00E5\u00E3~\u00F2=PNSi=p`eNMp=J=PKO?=p\u00C5\u00DC=NMpOOON=PNSiUKTOSP\nONo\u00C9\u00C7\u0107\u00E2\u00EB\u00E1\u00F3\u00E7\u00E5=h\u00E7\u00E5\u00EB~\u00E5\u00ED\u00EA\u00E1\u00E2=a\u00E1\u00E2\u00E1\u015F\u00EB\u00E1\u00F2=PNSi=NMp=O?=\u00F1=NJNLQ?=p\u00C5\u00DC=TSKOPNSiMKP\nPNm~\u00EB\u00E4~\u00E5\u00E3~\u00F2=^\u00E4\u03C3\u00E5=h~\u00F3\u00E5~\u011F\u03C3=J=p~\u00DC~akPO=PpqPT\npMNJNOOOM\nSRVMNPM\nNQORM\nNOOOMO?=p\u00C5\u00DC=N\nPM\u00B0\nSPS\nPST\nNRTV\nTS\nP\nTPQ\nNRMM\nNOR=J=coPP\nRPVM=H=`i\nSVO=J=j^fk|ab`h|ab`hOERSOMF\n=r\u00EA\u00C9\u00ED\u00E1\u00E4\u00E3\u00C9\u00F3\u00C9\u00C5\u00C9\u00E2\n`\u00E7\u00E5\u00ED\u00E1\u00E5\u00EC\u00C9W\nOSPU=J=j^fk|ab`h|ab`hOERSOMF\nQTRQ=H=`i\nNOQ=J=coPP\n`\u00E7\u00E5\u00ED\u00E1\u00E5\u00EC\u00C9W\n=abjlJMMMJMMQLpMO\nP\nO\nNN\nSM\u00B0\nj^fk|ab`h|ab`hOERSOMFJOOTN\nO?GNJNLQ?kp\noZNPMKM\ntO\ntP\ntN\nk\nrm";

function calistir(ham) {
  const n = metinNormalle(ham);
  const kural = aileBirlestir('tersan_cadmatic_spool', n.metin);
  const r = parse(n.metin, kural);
  const sp = (r.parsed && r.parsed.spoollar && r.parsed.spoollar[0]) || {};
  return { n, r, sp, mlz: sp.malzeme_listesi || [] };
}

console.log('=== ONCELIK 1 MUHUR: uctan uca L2 (gercek NB1137 ham) ===\n');

// 1) KARBON facet (Y200, metrik) — boru_mm tam alan dolumu
console.log('--- 1. KARBON / metrik (karbon ornek (galvaniz)) ---');
const k = calistir(HAM_Y200);
console.log('  [parse] ok=%s seviye=%s match=%s malzeme=%s yuzey=%s kg=%s',
  k.r.ok, k.r.parser_seviye, (k.r.alan_match_orani||0).toFixed(2), k.r.malzeme_satir_sayisi, k.sp.yuzey, k.sp.agirlik_kg);
const kBoru = k.mlz.find(m => m.kategori === 'boru' && !m.ham_satir) || {};
console.log('  [boru] dis_cap=%s et=%s boy=%s kalite=%s kg=%s', kBoru.dis_cap_mm, kBoru.et_mm, kBoru.boy_mm, kBoru.kalite, kBoru.agirlik_kg);
ok('1.1 glyph onarildi (band_a+b)', k.n.durum === 'glyph_band_a_onarildi' && k.n.glyph_band_b === true, k.n.durum);
ok('1.2 parse ok:true', k.r.ok === true, k.r.sebep);
ok('1.3 parser_seviye=l2 (L3 DEGIL)', k.r.parser_seviye === 'l2', k.r.parser_seviye);
ok('1.4 yuzey=Galvaniz', k.sp.yuzey === 'Galvaniz', k.sp.yuzey);
ok('1.5 boru dis_cap=139.7', kBoru.dis_cap_mm === 139.7, kBoru.dis_cap_mm);
ok('1.6 boru et=4.5', kBoru.et_mm === 4.5, kBoru.et_mm);
ok('1.7 boru kalite=ST37', /ST37/.test(kBoru.kalite || ''), kBoru.kalite);
ok('1.8 boru agirlik>0', typeof kBoru.agirlik_kg === 'number' && kBoru.agirlik_kg > 0, kBoru.agirlik_kg);
ok('1.9 Celik kurtarildi (ce_kurtarma>=1)', k.n.band_b_meta && k.n.band_b_meta.ce_kurtarma >= 1, k.n.band_b_meta && k.n.band_b_meta.ce_kurtarma);

// 2) PASLANMAZ facet (M130, emperyal inç+Sch) — boru_sch nps/schedule
console.log('\n--- 2. PASLANMAZ / inc+Sch (paslanmaz ornek (St.St)) ---');
const p = calistir(HAM_M130);
console.log('  [parse] ok=%s seviye=%s match=%s malzeme=%s yuzey=%s',
  p.r.ok, p.r.parser_seviye, (p.r.alan_match_orani||0).toFixed(2), p.r.malzeme_satir_sayisi, p.sp.yuzey);
const pBoru = p.mlz.find(m => m.kategori === 'boru' && !m.ham_satir) || {};
console.log('  [boru] nps=%s sch=%s boy=%s kalite=%s kg=%s', pBoru.nps_inc, pBoru.schedule_kod, pBoru.boy_mm, pBoru.kalite, pBoru.agirlik_kg);
ok('2.1 glyph onarildi (band_a+b)', p.n.durum === 'glyph_band_a_onarildi' && p.n.glyph_band_b === true, p.n.durum);
ok('2.2 parse ok:true', p.r.ok === true, p.r.sebep);
ok('2.3 parser_seviye=l2 (L3 DEGIL)', p.r.parser_seviye === 'l2', p.r.parser_seviye);
ok('2.4 yuzey=Paslanmaz', p.sp.yuzey === 'Paslanmaz', p.sp.yuzey);
ok('2.5 boru_sch nps dolu', pBoru.nps_inc != null && String(pBoru.nps_inc).length > 0, pBoru.nps_inc);
ok('2.6 boru_sch schedule=10S', /10S/.test(String(pBoru.schedule_kod || '')), pBoru.schedule_kod);
ok('2.7 boru_sch kalite=316L', /316L/.test(pBoru.kalite || ''), pBoru.kalite);
ok('2.8 boru_sch agirlik>0', typeof pBoru.agirlik_kg === 'number' && pBoru.agirlik_kg > 0, pBoru.agirlik_kg);

// 3) TEMIZ REGRESYON — ham'da capa varsa band-B CALISMAZ, Turkce korunur (MK-121.1)
console.log('\n--- 3. TEMIZ regresyon (gercek Turkce korunmali) ---');
const temiz = "SPOOL NAME\nNoAdetA\u00E7\u0131klamaBoyutBoyMalzemeA\u011F\u0131rl\u0131k\n1Boru Diki\u015Fsiz \u00C7elik - 2.2 Sertifikal\u013148.3x4.53241 ST3715.751\nXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX dolgu min uzunluk";
const t = metinNormalle(temiz);
ok('3.1 durum=temiz (capa ham\u0027da)', t.durum === 'temiz', t.durum);
ok('3.2 glyph_band_b=false', t.glyph_band_b === false);
ok('3.3 metin AYNEN korundu (c/s bozulmadi)', t.metin === temiz);

// 4) MK-123 FITTING GAP-FIX — dirsek(inc+Sch) / reduksiyon / manson / kaynak(islem)
// Onceden: dirsek+kaynak ham_satir, manson+reduksiyon SESSIZCE dusuyordu (tetikleyici yok).
// Generic muhendislik tanimlari (musteri-id yok). malzemeTablosuCikar dogrudan test.
console.log('\n--- 4. MK-123 fitting gap-fix (dirsek/reduksiyon/manson/kaynak) ---');
// 316L + Sch tokenlari -> paslanmaz facet secilir; A1 + paslanmaz satir tipleri etkin.
const fittingBlok = [
  "Malzeme Listesi",
  "11Dirsek Diki\u015Fli 1.5D 316L SCH 10S - 2.2 S2-1/2\" Sch 10S 95.25316L0.85",
  "21Red\u00FCksiyonKonsantrikDiki\u015Fsiz 316L 10S 2\" x 1-1/4\" Sch 76.2316L0.3",
  "31Man\u015FonDN65 x DN15.0 19.05SA/A1050.0454",
  "41Paslanmaz Al\u0131n Kayna\u011F\u0131 - SahaDN50 3ST37"
].join("\n");
const fitKural = aileBirlestir('tersan_cadmatic_spool', fittingBlok);
const fitMlz = malzemeTablosuCikar(fittingBlok, fitKural.malzeme_tablosu);
const bul = pred => fitMlz.find(m => !m.ham_satir && pred(m)) || {};
const dr = bul(m => m.kategori === 'fitting' && m.schedule_kod && m.nps_kucuk === undefined);
const rd = bul(m => m.nps_kucuk !== undefined);
const mn = bul(m => /Man.on/i.test(m.tanim || ''));
const ky = bul(m => m.kategori === 'islem');
console.log('  [dirsek] nps=%s sch=%s kalite=%s kg=%s', dr.nps_inc, dr.schedule_kod, dr.kalite, dr.agirlik_kg);
console.log('  [reduk ] nps=%s/%s kalite=%s kg=%s', rd.nps_inc, rd.nps_kucuk, rd.kalite, rd.agirlik_kg);
console.log('  [manson] dn=%s kalite=%s kg=%s', mn.dn, mn.kalite, mn.agirlik_kg);
console.log('  [kaynak] kat=%s dn=%s kalite=%s kg=%s', ky.kategori, ky.dn, ky.kalite, ky.agirlik_kg);
ok('4.0 ham_satir YOK (hepsi pattern tuttu)', fitMlz.every(m => !m.ham_satir), fitMlz.filter(m=>m.ham_satir).length);
ok('4.1 dirsek_sch nps=2-1/2', dr.nps_inc === '2-1/2', dr.nps_inc);
ok('4.2 dirsek_sch kalite=316L + agirlik=0.85', /316L/.test(dr.kalite||'') && dr.agirlik_kg === 0.85, dr.kalite+'/'+dr.agirlik_kg);
ok('4.3 reduksiyon cift olcu (2 x 1-1/4)', rd.nps_inc === '2' && rd.nps_kucuk === '1-1/4', rd.nps_inc+'/'+rd.nps_kucuk);
ok('4.4 manson dn=65 + kalite=SA/A105', mn.dn === 65 && /SA\/A105/.test(mn.kalite||''), mn.dn+'/'+mn.kalite);
ok('4.5 manson agirlik=0.0454', mn.agirlik_kg === 0.0454, mn.agirlik_kg);
ok('4.6 kaynak kategori=islem (parca degil)', ky.kategori === 'islem', ky.kategori);
ok('4.7 kaynak agirliksiz (kaynak=islem, kg null)', ky.agirlik_kg == null, ky.agirlik_kg);

console.log('\n=== MUHUR SONUCU ===');
console.log(`  Gecen: ${gecen} | Kalan: ${kalan}`);
if (kalan > 0) { console.log('  \u26d4 MUHUR KIRMIZI'); process.exit(1); }
console.log('  \u2705 MUHUR YESIL — uctan uca L2 (karbon metrik + paslanmaz inc/Sch + temiz regresyon)');
