#!/usr/bin/env python3
# favicon_ekle_abort4.py — İlk script'in ABORT ettiği 4 dosya için.
# Bu dosyalarda <meta charset> birden fazla geçiyor (JS ile üretilen print HTML'leri).
# Gerçek <head> charset'i HER ZAMAN satır ~4'te ve dosyadaki İLK geçiş.
# Strateji: SADECE İLK '<meta charset="UTF-8">' geçişine ekle (replace count=1), gömülülere dokunma.
# İdempotent. Her dosyaya .bak.
#
# Kullanım: python3 favicon_ekle_abort4.py [--yaz]

import sys, os

HEDEFLER = ['devre_detay.html', 'devreler.html', 'kesim.html', 'spool_detay.html']
MARKER = 'arespipe-favicon.svg'

BLOK = '''
<link rel="icon" type="image/svg+xml" href="/assets/marka/arespipe-favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/marka/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/marka/favicon-16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/marka/icon-180.png">'''

YAZ = '--yaz' in sys.argv

for f in HEDEFLER:
    if not os.path.exists(f):
        print(f'  ✗ {f}: dosya yok'); continue
    with open(f, 'r', encoding='utf-8') as fh:
        icerik = fh.read()

    if MARKER in icerik:
        print(f'  ⏭  {f}: zaten var, atlandı'); continue

    # İlk charset'i bul — devreler.html'de 2 boşluk girintili olabilir, ikisini de dene
    for cipa in ['<meta charset="UTF-8">']:
        idx = icerik.find(cipa)
        if idx != -1:
            break
    if idx == -1:
        print(f'  ✗ {f}: çıpa bulunamadı, ABORT'); continue

    # Sadece İLK geçişe ekle (count=1) — gömülü string'lere dokunmaz
    yeni = icerik[:idx] + cipa + BLOK + icerik[idx + len(cipa):]

    # Doğrula: tam 1 favicon bloğu eklendi mi
    if yeni.count(MARKER) != 1:
        print(f'  ✗ {f}: beklenmeyen marker sayısı ({yeni.count(MARKER)}), ABORT'); continue

    if YAZ:
        if not os.path.exists(f + '.bak'):
            with open(f + '.bak', 'w', encoding='utf-8') as bh:
                bh.write(icerik)
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(yeni)
        print(f'  ✓ {f}: favicon eklendi (ilk charset, satır ~4)')
    else:
        # dry-run: eklenecek yeri göster
        satir = icerik[:idx].count('\n') + 1
        gomulu = icerik.count('meta charset') - 1
        print(f'  🔍 {f}: satır {satir}\'teki ilk charset\'e eklenecek ({gomulu} gömülü charset dokunulmaz)')

if not YAZ:
    print('\nDRY-RUN — yazmak için: python3 favicon_ekle_abort4.py --yaz')
