#!/usr/bin/env python3
# giris_logo_buyut.py — giriş ekranı logo boyutlarını büyütür.
#   .giris-logo-img height 46px → 64px ;  .sol-amblem 52px → 72px
# İdempotent (yeni değer zaten varsa atla). Anchor tam 1 kez bulunmalı yoksa ABORT. .bak yedek.
#
# Kullanım: python3 giris_logo_buyut.py [--yaz]

import sys, os

F = 'giris.html'
YAZ = '--yaz' in sys.argv

DEGISIKLIKLER = [
    # (eski, yeni, ad)
    ('.giris-logo-img{height:46px;width:auto;display:block;margin-bottom:10px;}',
     '.giris-logo-img{height:64px;width:auto;display:block;margin-bottom:14px;}',
     'Sağ panel logo 46→64px'),
    ('.sol-amblem{width:52px;height:52px;display:block;margin-bottom:14px;}',
     '.sol-amblem{width:72px;height:72px;display:block;margin-bottom:16px;}',
     'Sol panel amblem 52→72px'),
]

with open(F, 'r', encoding='utf-8') as fh:
    icerik = fh.read()

orijinal = icerik
raporlar = []
for eski, yeni, ad in DEGISIKLIKLER:
    if yeni in icerik:
        raporlar.append(f'⏭  {ad}: yeni değer zaten var, atlandı')
        continue
    n = icerik.count(eski)
    if n != 1:
        raporlar.append(f'✗ {ad}: eski değer {n} kez bulundu (1 bekleniyordu), ABORT')
        print('\n'.join(raporlar))
        print('\n⚠ ABORT — HİÇBİR değişiklik yazılmadı.')
        sys.exit(1)
    icerik = icerik.replace(eski, yeni, 1)
    raporlar.append(f'✓ {ad}: uygulandı')

print('\n'.join(raporlar))

if icerik == orijinal:
    print('\nDeğişiklik yok (hepsi zaten güncel).')
    sys.exit(0)

if YAZ:
    if not os.path.exists(F + '.bak2'):
        with open(F + '.bak2', 'w', encoding='utf-8') as bh:
            bh.write(orijinal)
    with open(F, 'w', encoding='utf-8') as fh:
        fh.write(icerik)
    print(f'\n✓ {F} güncellendi (.bak2 yedeklendi).')
else:
    print('\n🔍 DRY-RUN — yazılmadı. Yazmak için: python3 giris_logo_buyut.py --yaz')
