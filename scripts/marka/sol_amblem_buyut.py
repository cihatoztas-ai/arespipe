#!/usr/bin/env python3
# sol_amblem_buyut.py — Giriş ekranı SOL panel amblemini belirgin büyütür.
#   .sol-amblem 72px → 140px (geniş sol panelde flanş net görünsün)
# İdempotent. Anchor tam 1 kez. .bak3 yedek.
#
# Kullanım: python3 sol_amblem_buyut.py [--yaz]

import sys, os

F = 'giris.html'
YAZ = '--yaz' in sys.argv

ESKI = '.sol-amblem{width:72px;height:72px;display:block;margin-bottom:16px;}'
YENI = '.sol-amblem{width:140px;height:140px;display:block;margin-bottom:20px;}'

with open(F, 'r', encoding='utf-8') as fh:
    icerik = fh.read()

if YENI in icerik:
    print('⏭  Sol amblem zaten 140px, atlandı.'); sys.exit(0)

n = icerik.count(ESKI)
if n != 1:
    print(f'✗ ABORT: eski değer {n} kez bulundu (1 bekleniyordu). Mevcut .sol-amblem satırını kontrol et.')
    sys.exit(1)

yeni_icerik = icerik.replace(ESKI, YENI, 1)

if YAZ:
    if not os.path.exists(F + '.bak3'):
        with open(F + '.bak3', 'w', encoding='utf-8') as bh:
            bh.write(icerik)
    with open(F, 'w', encoding='utf-8') as fh:
        fh.write(yeni_icerik)
    print(f'✓ Sol amblem 72→140px (.bak3 yedeklendi).')
else:
    print('🔍 DRY-RUN — anchor bulundu, yazılmadı. Yazmak için: python3 sol_amblem_buyut.py --yaz')
