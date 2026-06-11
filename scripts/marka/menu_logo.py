#!/usr/bin/env python3
# menu_logo.py — ares-layout.js'te menü "AP" placeholder'ını AresPipe amblemiyle değiştirir.
# İki nokta: (1) HTML default <div class="logo-mark">AP</div>, (2) JS fallback logoMark.innerHTML='AP'.
# Tenant kendi logosunu yüklediyse o gösterilir (DOKUNULMAZ); yoksa AP yerine AresPipe amblemi.
# Mavi kutu (--ac) korunur, içine beyaz-flanşlı mark-koyu.svg → her iki temada okunur.
# İdempotent. Her anchor tam 1 kez. .bak yedek. "Hep ya da hiç".
#
# Kullanım: python3 menu_logo.py [--yaz]

import sys, os

F = 'ares-layout.js'
YAZ = '--yaz' in sys.argv
MARKER = 'menu-amblem'   # idempotency işareti

IMG = '<img class="menu-amblem" src="/assets/marka/arespipe-mark-koyu.svg" style="width:20px;height:20px;display:block;">'

DEGISIKLIKLER = [
    # (eski, yeni, ad)
    ('<div class="logo-mark">AP</div>',
     f'<div class="logo-mark">{IMG}</div>',
     'HTML default (AP kutusu)'),
    ("logoMark.innerHTML = 'AP';",
     f"logoMark.innerHTML = '{IMG}';",
     'JS fallback'),
]

with open(F, 'r', encoding='utf-8') as fh:
    icerik = fh.read()

if MARKER in icerik:
    print(f'⏭  {F}: amblem zaten eklenmiş, atlandı.'); sys.exit(0)

orijinal = icerik
raporlar = []
for eski, yeni, ad in DEGISIKLIKLER:
    n = icerik.count(eski)
    if n != 1:
        raporlar.append(f'✗ {ad}: anchor {n} kez bulundu (1 bekleniyordu), ABORT')
        print('\n'.join(raporlar))
        print('\n⚠ ABORT — HİÇBİR değişiklik yazılmadı.')
        sys.exit(1)
    icerik = icerik.replace(eski, yeni, 1)
    raporlar.append(f'✓ {ad}: uygulandı')

print('\n'.join(raporlar))

if YAZ:
    if not os.path.exists(F + '.bak'):
        with open(F + '.bak', 'w', encoding='utf-8') as bh:
            bh.write(orijinal)
    with open(F, 'w', encoding='utf-8') as fh:
        fh.write(icerik)
    print(f'\n✓ {F} güncellendi (.bak yedeklendi). Menü logosu tüm sayfalarda görünecek.')
else:
    print('\n🔍 DRY-RUN — yazılmadı. 2 anchor da bulundu. Yazmak için: python3 menu_logo.py --yaz')
