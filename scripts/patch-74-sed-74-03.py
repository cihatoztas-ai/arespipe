#!/usr/bin/env python3
"""
74. Oturum — SED-74-03: Devre detay durum kolonu basamak basina renk
=======================================================================
Hedef dosya: devre_detay.html

Sorun: _stepKey(s) tum aktif basamaklar icin 'progress' donduruyor ->
DR['progress'].cls='sb-prog' (mavi). Yani Kaynak, Imalat, On Kontrol hepsi
ayni mavi renkte gozukuyor, ayirt edilemiyor.

Cozum:
1. CSS'e 4 yeni basamak class'i ekle (on_imalat, kaynak, on_kontrol, sevkiyat).
   imalat ve kk zaten var (sb-prog, sb-qc) - reuse.
2. DURUM() icine 6 yeni progress entry ekle (progress_<basamak>).
3. _stepKey(s) 'progress' yerine 'progress_'+_normalizeBasamak(s._aktifBasamak)
   dondursun. Iki yer: is_durumu=='devam_ediyor' branch + fallback.

Idempotent: marker 'SED-74-03' varsa atlanir.

Calistirma:
    cd ~/Desktop/arespipe && python3 scripts/patch-74-sed-74-03.py
"""
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

CSS_ADD = """/* SED-74-03: basamak basina renk */
.sb-prog-on_imalat{background:rgba(245,158,11,.12);color:#d97706;}
.sb-prog-imalat{background:rgba(45,142,255,.12);color:var(--ac);}
.sb-prog-kaynak{background:rgba(239,68,68,.12);color:#dc2626;}
.sb-prog-on_kontrol{background:rgba(168,85,247,.12);color:#9333ea;}
.sb-prog-kk{background:rgba(124,58,237,.12);color:var(--leg);}
.sb-prog-sevkiyat{background:rgba(20,184,166,.12);color:#0d9488;}"""

DURUM_ENTRIES = """  // SED-74-03: her basamak icin farkli renk
  progress_on_imalat:{cls:'sb-prog-on_imalat', get text(){return _basamakMap['on_imalat']||tv('dv_stage_on_imalat','Ön İmalat');}},
  progress_imalat:{cls:'sb-prog-imalat', get text(){return _basamakMap['imalat']||tv('dv_stage_imalat','İmalat');}},
  progress_kaynak:{cls:'sb-prog-kaynak', get text(){return _basamakMap['kaynak']||tv('dv_stage_kaynak','Kaynak');}},
  progress_on_kontrol:{cls:'sb-prog-on_kontrol', get text(){return _basamakMap['on_kontrol']||tv('dv_stage_on_kontrol','Ön Kontrol');}},
  progress_kk:{cls:'sb-prog-kk', get text(){return _basamakMap['kk']||tv('dv_stage_kk','Kalite Kontrol');}},
  progress_sevkiyat:{cls:'sb-prog-sevkiyat', get text(){return _basamakMap['sevkiyat']||tv('dv_stage_sevkiyat','Sevkiyat');}},"""

OLD_STEP_PROGRESS = """  if(s.isDurumu==='devam_ediyor') return 'progress';"""
NEW_STEP_PROGRESS = """  if(s.isDurumu==='devam_ediyor'){
    // SED-74-03: granular renk icin basamak adina gore key
    var _norm=_normalizeBasamak(s._aktifBasamak);
    return _norm ? ('progress_'+_norm) : 'progress';
  }"""

OLD_FALLBACK = """  return 'progress';"""
NEW_FALLBACK = """  // SED-74-03: granular renk icin basamak adina gore key
  var _normF=_normalizeBasamak(s._aktifBasamak);
  return _normF ? ('progress_'+_normF) : 'progress';"""

MARKER = 'SED-74-03'


def main():
    p = REPO_ROOT / 'devre_detay.html'
    if not p.exists():
        sys.exit(f'HATA: {p} bulunamadi')

    content = p.read_text(encoding='utf-8')

    if MARKER in content:
        print(f'[{p.name}] SED-74-03 zaten uygulanmis, atlaniyor')
        return

    # 1) CSS — .sb-stop satirindan sonra ekle
    old_css = '.sb-stop{background:rgba(229,62,62,.12);color:var(--re);}'
    if old_css not in content:
        sys.exit('CSS .sb-stop pattern bulunamadi')
    if content.count(old_css) != 1:
        sys.exit('CSS pattern uniq degil')
    content = content.replace(old_css, old_css + '\n' + CSS_ADD)

    # 2) DURUM() — stopped entry'sinden sonra yeni entry'ler
    old_durum = "  stopped:{cls:'sb-stop', get text(){return tv('dv_status_stopped','Durduruldu');}},"
    if old_durum not in content:
        sys.exit('DURUM stopped pattern bulunamadi')
    if content.count(old_durum) != 1:
        sys.exit('DURUM stopped uniq degil')
    content = content.replace(old_durum, old_durum + '\n' + DURUM_ENTRIES)

    # 3) _stepKey: is_durumu='devam_ediyor' branch
    if OLD_STEP_PROGRESS not in content:
        sys.exit('_stepKey devam_ediyor pattern bulunamadi')
    if content.count(OLD_STEP_PROGRESS) != 1:
        sys.exit('_stepKey devam_ediyor uniq degil')
    content = content.replace(OLD_STEP_PROGRESS, NEW_STEP_PROGRESS)

    # 4) _stepKey fallback (en sondaki return)
    if OLD_FALLBACK not in content:
        sys.exit('_stepKey fallback pattern bulunamadi')
    if content.count(OLD_FALLBACK) != 1:
        sys.exit(f'_stepKey fallback uniq degil: {content.count(OLD_FALLBACK)} esleme')
    content = content.replace(OLD_FALLBACK, NEW_FALLBACK)

    p.write_text(content, encoding='utf-8')
    print(f'[{p.name}] SED-74-03 uygulandi (CSS + DURUM + _stepKey)')


if __name__ == '__main__':
    main()
