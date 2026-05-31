# Oturum 137 — Malzeme hazırlık sistemi (web tarafı uçtan uca) + GAP 1 klasör ağacı

Konu malzeme yönetimine kaydı: "devreyi imalata almadan önce malzemesi hazırlansın → personel sahada
mobilden takip etsin → yönetici devreler tablosundan görsün." Cihat'ın tarifi okunup toparlandı; çıkan
sistemin profesyonel karşılığı (MRP → kitting → staging → eksik raporu) teyit edildi, stok/depo bilinçli
olarak DIŞARIDA bırakıldı (depo yazılımı ayrı, çelişmesin). Sonuç: web tarafı uçtan uca oturdu.

## Bağlam — neden bu sıra
Sistemin web tarafı meğer ~%70 kuruluymuş (4-durumlu yıldız + malzeme kontrol modalı), ama iki yapısal
hatayla: (1) yıldız durumu localStorage'da → başka cihaz/mobil göremez; (2) modal `pipeline_malzemeleri`'nden
okuyordu, o tablo terk edilmiş/boş — gerçek malzeme `spool_malzemeleri`'nde. İkisi de düzeltildi.

## Yapılanlar
1. **GAP 1 (wizard):** devre_wizard_v3 Adım 1 düz tablo → klasör ağacı. Kontroller fitem içinde (B),
   eski/hariç klasör kozmetik işaret (2a). Mevcut ağaç altyapısı yeniden kullanıldı.
2. **Migration 095 + 096:** kuyruk + teslim_adet kolonları. 095'te teslim_adet yanlışlıkla pipeline'a
   eklenmişti; ölçümle (1750 kalem spool'da, 1 satır pipeline'da) gerçek kaynak görülüp 096 ile spool_malzemeleri'ne taşındı.
3. **Yıldız motoru DB'ye:** localStorage → `devreler.malzeme_kuyrukta` + renk türetme. Çok-cihaz/mobil görünür.
4. **Malzeme kaynağı spool_malzemeleri:** devre bazlı toplama (tip|çap|et|malzeme|kalite), satır-bazlı teslim,
   kısmi (3/5) görünür, mobil kısmiyi ezmeyen kayıt (dirty-only).
5. **Toplu çekim export:** `kalemler=[]` stub'ı gerçek batch veriye bağlandı + popup gesture fix.
6. **Mobil 2-sekme mockup:** görsel referans (commit edilmedi), React inşasında kullanılacak.

## Kararlar / içgörüler
- **Stok modülü yok, bilinçli:** Bu sayfa "malzemenin imalat sahasına gelmesi" (kit staging), envanter değil.
  Depo yazılımıyla çelişmemek için sınır net. İleride gemi-bazlı BOM−teslim farkı stok kurmadan yapılabilir.
- **Miktar bazlı başla:** boolean var/yok seni köşeye sıkıştırırdı; `teslim_adet` ile başlandı → ileride
  rezervasyon/stok "üstüne takılır", rework olmaz. (Önerildi, Cihat onayladı.)
- **Ölç, körlemesine yazma:** "malzeme var ama listelenmedi" → tahmin yerine COUNT'larla kök bulundu
  (pipeline boş, spool dolu). Yanlış tablo düzeltildi. MK-126.8 ruhu.
- **localStorage = tek-cihaz tuzağı:** Cihat'ın "başka bilgisayarda görünür mü" sorusu doğru içgüdü; motorun DB'ye taşınma gerekçesi buydu.

## Süreç notu
Her DB değişikliği önce dry-run/ölçüm; her HTML patch öncesi gerçek kod okundu (mlKontrolAc/_mlPdf/_mlExcel
zinciri); kaynak hatası tahminle değil 3 COUNT sorgusuyla teşhis edildi; mockup R-10 gereği koddan önce
çizildi; mobil kısmi-teslim ezme riski fark edilip dirty-only kayıtla önlendi. node --check + MD5 her dosyada.
MK-101.1 sessiz kayıp iki kez yakalandı (kopya MD5 tutmadı → tekrar kopyalandı).

## Mühürlenecek MK (KARARLAR.md'ye — 138 açılışında ya da şimdi ayrı doc commit)
- MK-137.1: malzeme hazırlık = yıldız DB kuyruk (`devreler.malzeme_kuyrukta`), renk `spool_malzemeleri`
  teslim/ihtiyaç toplamından türetilir, miktar bazlı (`teslim_adet`). Stok/depo modülü DIŞARIDA.
- MK-137.2: malzeme gerçek kaynağı `spool_malzemeleri` (spool_id→devre zinciri); `pipeline_malzemeleri` terk/boş.
  Toplama anahtarı tip|çap|et|malzeme|kalite. Teslim satır bazında, ekranda birleşik.
- MK-137.3: web manager modalı kısmiyi ezmesin → sadece dirty kalem yazılır (mobil kısmi teslim korunur).

## Süreç
> 138 açılışında: son-durum + bu dosya + CLAUDE-SONRAKI-OTURUM + (varsa) KARARLAR MK-137.*.
> İlk iş: malzeme hazırlık deploy görsel teyit (export PDF/Excel gerçek veri) → eksik→Uyarılar VEYA mobil React.
