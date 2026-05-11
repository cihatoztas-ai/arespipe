#!/usr/bin/env python3
"""
74. Oturum — Web spool_id format enforcement patch
====================================================
Hedef dosyalar:
  - devre_yeni.html (toplu spool insert, satır 1706 civarı)
  - devre_detay.html (tekil spool insert, satır 1638 civarı)

Yapılan değişiklikler:
  1. Her iki dosyaya idempotent spoolIdFormatla() + spoolIdDevreSonraki()
     helper'ları eklenir (zaten varsa atlanır)
  2. devre_yeni.html: spool_id atamasında spoolIdFormatla() kullanılır
  3. devre_detay.html: insert payload'una spoolIdDevreSonraki(SPOOLS) eklenir

Idempotent: tekrar çalıştırılabilir, helper marker varsa hiçbir şey değişmez.
Çalıştırma:
    cd ~/Desktop/arespipe && python3 scripts/patch-74-frontend-spool-id.py
"""
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

HELPER_JS = '''  // SED-74-01: spool_id format normalize helper (MK-74.2)
  // İdempotent: tanımsız format icin NULL döndürür (CHECK constraint izin verir)
  function spoolIdFormatla(deger) {
    if (deger == null || deger === '') return null;
    var s = String(deger).trim();
    if (s === '') return null;
    if (/^A-[0-9]+$/.test(s)) {
      var sayi = s.slice(2);
      if (sayi.length < 4) sayi = sayi.padStart(4, '0');
      return 'A-' + sayi;
    }
    if (/^[0-9]+$/.test(s)) return 'A-' + s.padStart(4, '0');
    if (typeof console !== 'undefined') console.warn('[ARES] spool_id format tanimsiz, NULL atandi:', s);
    return null;
  }
  // Devre icindeki SPOOLS array'inden bir sonraki spool_id'yi uret
  function spoolIdDevreSonraki(spoolsArray) {
    var max = 0;
    if (spoolsArray && spoolsArray.length) {
      for (var i = 0; i < spoolsArray.length; i++) {
        var sid = spoolsArray[i].spoolId || spoolsArray[i].spool_id;
        if (sid && /^A-[0-9]+$/.test(sid)) {
          var n = parseInt(sid.slice(2), 10);
          if (n > max) max = n;
        }
      }
    }
    return 'A-' + String(max + 1).padStart(4, '0');
  }
'''

HELPER_MARKER = 'function spoolIdFormatla('


def patch_devre_yeni(path):
    content = path.read_text(encoding='utf-8')

    if HELPER_MARKER in content:
        print(f'  [{path.name}] helper zaten var, atlaniyor')
        return False

    # 1) spool_id satirini guncelle
    eski_spool_id = "spool_id:      kisaKodlar[idx] || null,"
    yeni_spool_id = "spool_id:      spoolIdFormatla(kisaKodlar[idx]),"
    if eski_spool_id not in content:
        raise RuntimeError(f'{path.name}: spool_id atama satiri bulunamadi')
    if content.count(eski_spool_id) != 1:
        raise RuntimeError(f'{path.name}: spool_id atama satiri uniq degil ({content.count(eski_spool_id)} esleme)')
    content = content.replace(eski_spool_id, yeni_spool_id)

    # 2) Helper'i spoolRows = spooller.map oncesi IIFE scope'una koy
    eski_pre_map = "const spoolRows = spooller.map(function(s, idx) {"
    if eski_pre_map not in content:
        raise RuntimeError(f'{path.name}: spoolRows.map satiri bulunamadi')
    if content.count(eski_pre_map) != 1:
        raise RuntimeError(f'{path.name}: spoolRows.map satiri uniq degil')
    yeni_pre_map = HELPER_JS + '\n\n        ' + eski_pre_map
    content = content.replace(eski_pre_map, yeni_pre_map)

    path.write_text(content, encoding='utf-8')
    print(f'  [{path.name}] patch uygulandi')
    return True


def patch_devre_detay(path):
    content = path.read_text(encoding='utf-8')

    if HELPER_MARKER in content:
        print(f'  [{path.name}] helper zaten var, atlaniyor')
        return False

    # 1) Insert payload'una spool_id ekle — devre_detay.html'de pipeline_no satirinden once
    eski_kayit = "tenant_id:_tid(),devre_id:devreId,spool_no:sn,\n      pipeline_no:_pl||null,rev:_rev,"
    yeni_kayit = "tenant_id:_tid(),devre_id:devreId,spool_no:sn,\n      spool_id:spoolIdDevreSonraki(SPOOLS),\n      pipeline_no:_pl||null,rev:_rev,"
    if eski_kayit not in content:
        raise RuntimeError(f'{path.name}: kayit payload bulunamadi')
    if content.count(eski_kayit) != 1:
        raise RuntimeError(f'{path.name}: kayit payload uniq degil')
    content = content.replace(eski_kayit, yeni_kayit)

    # 2) Helper'i spoolEkleKaydet fonksiyonu oncesi ekle
    eski_fn = "async function spoolEkleKaydet(){"
    if eski_fn not in content:
        raise RuntimeError(f'{path.name}: spoolEkleKaydet fn bulunamadi')
    if content.count(eski_fn) != 1:
        raise RuntimeError(f'{path.name}: spoolEkleKaydet fn uniq degil')
    yeni_fn = HELPER_JS + '\n' + eski_fn
    content = content.replace(eski_fn, yeni_fn)

    path.write_text(content, encoding='utf-8')
    print(f'  [{path.name}] patch uygulandi')
    return True


def main():
    print('[ARES 74] Web spool_id format patch basladi')
    yeni = REPO_ROOT / 'devre_yeni.html'
    detay = REPO_ROOT / 'devre_detay.html'

    if not yeni.exists():
        sys.exit(f'HATA: {yeni} bulunamadi')
    if not detay.exists():
        sys.exit(f'HATA: {detay} bulunamadi')

    try:
        patch_devre_yeni(yeni)
        patch_devre_detay(detay)
    except RuntimeError as e:
        sys.exit(f'PATCH HATASI: {e}')

    print('[ARES 74] Patch tamamlandi')


if __name__ == '__main__':
    main()
