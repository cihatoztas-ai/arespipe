#!/usr/bin/env python3
"""
74. Oturum — SED-73-03 yeniden uygulama
========================================
Hedef dosya: spool_detay.html

73'te denenmis, "basarisiz" diye revert edilmis fix'in AYNEN tekrar uygulamasi
(commit 7e4dc14 -> revert 4a7912d). Follow-up `window._normalizeBasamak = ...`
DAHIL EDILMIYOR cunku 907-3708 script blogu IIFE'siz, top-level. Function
declaration zaten global'de.

Mobile DB'ye `aktif_basamak='argon_kaynagi'` (veya `gazalti_kaynagi`) yaziyor.
spool_detay.html `STAGE_SISTEM=['on_imalat','imalat','kaynak','on_kontrol','kk',
'sevkiyat']` ile `indexOf('argon_kaynagi') = -1` -> tracker "Baslamadi" gosteriyor.
Cozum: cagri yerinde alt-tip 'kaynak'a indirilsin.

devre_detay.html'de SED-71-05 ayni cozumu satir 1000'de uyguluyor (kanit).

Patch:
  - spoolYukle icinde: _aktifStr = s.aktif_basamak || '' -> _normalizeBasamak ile sar
  - STAGE_SISTEM tanimindan once _normalizeBasamak fonksiyonunu ekle

Idempotent: marker varsa atlanir.

Calistirma:
    cd ~/Desktop/arespipe && python3 scripts/patch-74-sed-73-03.py
"""
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

NORMALIZE_FN = '''// SED-73-03 (74'te yeniden uygulama): Kaynak alt-tipini ana 'kaynak'
// sistem_adi'na normalize et. Mobile argon_kaynagi/gazalti_kaynagi yaziyor,
// STAGE_SISTEM sadece ust basamaklar (kaynak) icerdigi icin tracker indexOf'ta
// bulamiyordu. devre_detay'da SED-71-05 ayni cozumu satir 1000'de uyguluyor.
function _normalizeBasamak(sistemAdi){
  if(!sistemAdi) return sistemAdi;
  if(/kaynak/i.test(sistemAdi)) return 'kaynak';
  return sistemAdi;
}
'''

MARKER = 'function _normalizeBasamak'


def main():
    p = REPO_ROOT / 'spool_detay.html'
    if not p.exists():
        sys.exit(f'HATA: {p} bulunamadi')

    content = p.read_text(encoding='utf-8')

    if MARKER in content:
        print(f'[{p.name}] _normalizeBasamak zaten var, atlaniyor')
        return

    # 1) spoolYukle icindeki cagri satirini sar
    old_call = "var _aktifStr = s.aktif_basamak || '';"
    new_call = "var _aktifStr = _normalizeBasamak(s.aktif_basamak || '');"

    if old_call not in content:
        sys.exit(f'HATA: cagri satiri bulunamadi: {old_call!r}')
    if content.count(old_call) != 1:
        sys.exit(f'HATA: cagri satiri uniq degil ({content.count(old_call)} esleme)')

    content = content.replace(old_call, new_call)

    # 2) STAGE_SISTEM tanimindan once normalize fonksiyonunu ekle
    stage_decl = "var STAGE_SISTEM=['on_imalat','imalat','kaynak','on_kontrol','kk','sevkiyat'];"
    if stage_decl not in content:
        sys.exit(f'HATA: STAGE_SISTEM tanimi bulunamadi')
    if content.count(stage_decl) != 1:
        sys.exit(f'HATA: STAGE_SISTEM tanimi uniq degil')

    new_stage = NORMALIZE_FN + '\n' + stage_decl
    content = content.replace(stage_decl, new_stage)

    p.write_text(content, encoding='utf-8')
    print(f'[{p.name}] SED-73-03 yeniden uygulandi')


if __name__ == '__main__':
    main()
