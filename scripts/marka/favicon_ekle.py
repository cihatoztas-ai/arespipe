#!/usr/bin/env python3
# favicon_ekle.py — Tüm *.html sayfalarının <head>'ine favicon <link>'lerini ekler.
# Disiplin: çıpa = '<meta charset="UTF-8">'; blok hemen ardına. İdempotent (zaten varsa atla).
# Çıpa yoksa o dosyada ABORT (dokunma). Her dosyaya .bak yedek. Sonunda rapor.
#
# Kullanım:
#   python3 favicon_ekle.py            # DRY-RUN (hiçbir şey yazmaz, ne olacağını söyler)
#   python3 favicon_ekle.py --yaz      # gerçek yazma (.bak yedekle)

import sys, glob, hashlib, os

CIPA = '<meta charset="UTF-8">'
MARKER = 'arespipe-favicon.svg'   # idempotency işareti: zaten varsa bu geçer

BLOK = '''
<link rel="icon" type="image/svg+xml" href="/assets/marka/arespipe-favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/marka/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/marka/favicon-16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/marka/icon-180.png">'''

YAZ = '--yaz' in sys.argv

dosyalar = sorted(glob.glob('*.html'))
eklendi, atlandi_var, abort = [], [], []

for f in dosyalar:
    with open(f, 'r', encoding='utf-8') as fh:
        icerik = fh.read()

    # İdempotency: zaten favicon varsa atla
    if MARKER in icerik:
        atlandi_var.append(f)
        continue

    # Çıpa yoksa ABORT (bu dosyaya dokunma)
    adet = icerik.count(CIPA)
    if adet != 1:
        abort.append((f, f'çıpa {adet} kez bulundu (1 bekleniyordu)'))
        continue

    yeni = icerik.replace(CIPA, CIPA + BLOK, 1)

    if YAZ:
        # .bak yedek (zaten varsa üzerine yazma — ilk koşumun yedeği korunsun)
        if not os.path.exists(f + '.bak'):
            with open(f + '.bak', 'w', encoding='utf-8') as bh:
                bh.write(icerik)
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(yeni)
    eklendi.append(f)

print('─' * 50)
print(f'Toplam HTML      : {len(dosyalar)}')
print(f'Favicon eklenecek: {len(eklendi)}')
print(f'Zaten var (atlan): {len(atlandi_var)}')
print(f'ABORT (çıpa yok) : {len(abort)}')
print('─' * 50)
if abort:
    print('⚠ ABORT edilen dosyalar (elle bakılmalı):')
    for f, neden in abort:
        print(f'  ✗ {f}: {neden}')
if not YAZ:
    print('\n🔍 DRY-RUN — hiçbir şey yazılmadı.')
    if eklendi:
        print('Eklenecekler:', ', '.join(eklendi[:8]) + (' …' if len(eklendi) > 8 else ''))
    print('Gerçek yazmak için: python3 favicon_ekle.py --yaz')
else:
    print(f'\n✓ {len(eklendi)} dosyaya favicon eklendi (.bak yedeklendi).')
