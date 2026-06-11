#!/usr/bin/env python3
# giris_logo.py — giris.html'e marka logosu yerleştirir.
#  1) Sağ panel (.logo-baslik düz "ARESPIPE" yazısı) → tema-duyarlı yatay logo (açık+koyu img).
#  2) Sol panel (.brand-ad üstü) → beyaz amblem (arespipe-mark-koyu.svg), mevcut yazı korunur.
#  3) CSS: tema-duyarlı gösterim + boyut.
# Disiplin: her anchor TAM 1 kez bulunmalı, yoksa o adımda ABORT. İdempotent (zaten varsa atla). .bak yedek.
#
# Kullanım: python3 giris_logo.py [--yaz]

import sys, os

F = 'giris.html'
YAZ = '--yaz' in sys.argv
MARKER = 'giris-logo-img'   # idempotency işareti

# ── 1) SAĞ PANEL: .logo-baslik düz yazıyı tema-duyarlı logo ile değiştir ──
ANCHOR_SAG = '''      <div class="logo-alan">
        <div class="logo-baslik">ARESPIPE</div>
        <div class="logo-altyazi" data-i18n="giris_hosgeldiniz">Hoş geldiniz</div>
      </div>'''

YENI_SAG = '''      <div class="logo-alan">
        <img class="giris-logo-img logo-acik" src="/assets/marka/arespipe-logo-yatay.svg" alt="AresPipe">
        <img class="giris-logo-img logo-koyu" src="/assets/marka/arespipe-logo-yatay-koyu.svg" alt="AresPipe">
        <div class="logo-altyazi" data-i18n="giris_hosgeldiniz">Hoş geldiniz</div>
      </div>'''

# ── 2) SOL PANEL: .brand-ad üstüne amblem ekle ──
ANCHOR_SOL = '''    <div class="sol-brand">
      <div class="brand-ad">ARESPIPE</div>'''

YENI_SOL = '''    <div class="sol-brand">
      <img class="sol-amblem" src="/assets/marka/arespipe-mark-koyu.svg" alt="">
      <div class="brand-ad">ARESPIPE</div>'''

# ── 3) CSS: .logo-altyazi kuralından SONRA ekle ──
ANCHOR_CSS = '.logo-altyazi{font-size:14px;color:var(--txd);}'

YENI_CSS = ANCHOR_CSS + '''
.giris-logo-img{height:46px;width:auto;display:block;margin-bottom:10px;}
.logo-koyu{display:none;}
[data-theme=dark] .logo-acik{display:none;}
[data-theme=dark] .logo-koyu{display:block;}
.sol-amblem{width:52px;height:52px;display:block;margin-bottom:14px;}'''


def patch(icerik, anchor, yeni, ad):
    n = icerik.count(anchor)
    if n != 1:
        return None, f'✗ {ad}: anchor {n} kez bulundu (1 bekleniyordu), ABORT'
    return icerik.replace(anchor, yeni, 1), f'✓ {ad}: uygulandı'


with open(F, 'r', encoding='utf-8') as fh:
    icerik = fh.read()

if MARKER in icerik:
    print(f'⏭  {F}: logo zaten eklenmiş (marker bulundu), atlandı.')
    sys.exit(0)

orijinal = icerik
raporlar = []
for anchor, yeni, ad in [
    (ANCHOR_CSS, YENI_CSS, 'CSS'),
    (ANCHOR_SAG, YENI_SAG, 'Sağ panel logo'),
    (ANCHOR_SOL, YENI_SOL, 'Sol panel amblem'),
]:
    sonuc, mesaj = patch(icerik, anchor, yeni, ad)
    raporlar.append(mesaj)
    if sonuc is None:
        print('\n'.join(raporlar))
        print('\n⚠ Bir adım ABORT — HİÇBİR değişiklik yazılmadı (hep ya da hiç).')
        sys.exit(1)
    icerik = sonuc

print('\n'.join(raporlar))

if YAZ:
    if not os.path.exists(F + '.bak'):
        with open(F + '.bak', 'w', encoding='utf-8') as bh:
            bh.write(orijinal)
    with open(F, 'w', encoding='utf-8') as fh:
        fh.write(icerik)
    print(f'\n✓ {F} güncellendi (.bak yedeklendi). 3 adım da uygulandı.')
else:
    print('\n🔍 DRY-RUN — yazılmadı. 3 adım da anchor buldu. Yazmak için: python3 giris_logo.py --yaz')
