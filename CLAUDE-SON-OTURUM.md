# CLAUDE-SON-OTURUM.md — Oturum 178 özeti

## Ana tema
**Paslanmaz B16.9 fitting kütüphanesi başladı, cunife-seviyesi rigorla.** Yöntem oturdu: %100 referans, türetme yasak,
≥2 kaynak çapraz-doğrulama. 90LR + 45LR seed'lendi (fitting_olculer 897→935). Seed kapısı (unique constraint) açıldı,
seed aracı fitting'e uyarlandı, kütüphane dokümanı yenilendi.

## Yapılanlar
1. **Grup seçimi DATA'dan (MK-158.1).** Eski takip belgesi bayat (fitting=0 diyordu, gerçek 897) → DB GROUP BY ile
   sıradaki gerçek eksik belirlendi. Cihat: paslanmaz B16.9+B16.11 fitting.
2. **Ağırlık kuralı (MK-178.1).** Cihat net: türetme/formül/yoğunluk-faktörü YASAK; karbon-bazlı ağırlık kabul değil;
   her değer referanstan, tablo ikinci kaynakla doğrulanır. Sandvik paslanmazda otorite.
3. **Kaynak + çapraz-doğrulama.** dynamicforge A403/A815 ↔ buyfittingsonline gerçek SS ürün kg → DN40/50/80 90LR'de
   **<%1 örtüşme**. ZIZI karbon-bazlı çizelge %7 sapma + iç typo (DN200 STD>Sch40 imkansız) → elendi. Ölçü B16.9/MSS-SP-43.
4. **JSON üretimi + doğrulama.** 90LR 20 satır (DN90 FLAG_SUPHELI), 45LR 19. Python ile JSON geçerlilik + fiziksel
   monotonluk kontrolü (tek anomali = zaten flag'li DN90).
5. **Seed kapısı (MK-178.2).** MK-98.2 dry-run (çakışma yok) → constraint eklendi (NULLS NOT DISTINCT 7-alan).
   Seed: INSERT...ON CONFLICT → teyit 45LR=19/90LR=19.
6. **seed-from-json.mjs uyarlaması.** UNIQUE_KEY fitting 7-alan + notlar stringify (tablo-bilinçli) + 'YENI' aksiyonu.
   node --check temiz.
7. **Doküman.** KUTUPHANE-DURUM.md (kapsam+takip+yöntem+kural). Eski TAKİP → docs/arsiv/ (git mv).

## Yöntem / disiplin (işe yarayanlar)
- **MK-158.1 (DATA önce):** sıradaki grup belgeden değil DB GROUP BY'dan seçildi → bayat belge tuzağına düşülmedi.
- **MK-96 çapraz-doğrulama gerçekten iş yaptı:** ZIZI'yi eledi, dynamicforge+buyfittingsonline'ı <%1 ile onayladı.
- **MK-85.3/126.8:** fitting_olculer şema + karbon satır kalıbı seed JSON'undan önce okundu (kolon adları, hangi alanda ne).
- **MK-98.2 dry-run:** constraint öncesi çakışma kontrolü; Supabase editör BEGIN/ROLLBACK'i yutsa da pg_get_constraintdef ile teyit.
- **Fiziksel sanity (yeni alışkanlık):** ağırlık DN ile monoton artmalı → DN90 anomalisi otomatik yakalandı, flag'lendi.

## Cihat'ın kritik müdahaleleri
1. "türetme diye bir seçenek asla yok, hepsi referans belgelerden %100 doğru" → ağırlık metodolojisi sertleşti (MK-178.1).
2. "ağırlık önemli, bir kaynakta yoksa başka referanstan; tabloyu başka kaynaktan doğrula" → MK-96 disiplini birebir.
3. "paslanmazda sandvik referans alınabilir" → Sandvik/Alleima otorite kaynak (5S-Sch160, 304/316+dupleks teyitli).
4. "md dosyası basit olmuş, takip çizelgesi de vardı" → KUTUPHANE-DURUM tablo-tablo/parça-tipi takiple zenginleştirildi
   (sahte sayı yok: fitting DB-birebir, boru/flanş "tazelenecek" işaretli).
5. "biz şu şekilde yapıyorduk, aynen devam" → atölye/referans-çekme akışı (Claude çeker, kullanıcı yüklemez) hatırlatıldı.

## Tuzaklar / öğrenmeler
- **Handoff "JSON'lar hazır" demişti — değildi** (177 yanlış sayım). Tamamlandı-iddiası şüpheyle karşılandı, doğrulandı.
- **Karbon kütüphanesinde quirk'ler var:** yaricap_mm=1.5×OD (muhtemel hata, doğrusu 1.5×NPS); 45° uç-uca ucu_uca_b'de
  (şema ucu_uca_c der). Paslanmaz uyumluluk için karbon FIELD kullanımı aynalandı; quirk'ler ayrı temizlik (okuma kodu gerek).
- **Supabase SQL editörü BEGIN/ROLLBACK'i her zaman tutmuyor** — dry-run ALTER kalıcı oldu; DDL sonrası HER ZAMAN
  pg_get_constraintdef ile teyit (tanım doğruysa sorun yok).
- **Public B16.9 ağırlık çizelgeleri karbon-bazlı** (Projectmaterials açıkça yazıyor) → paslanmaz için A403-özgü kaynak şart.

## Karar günlüğü (KARARLAR.md'ye)
**MK-178.1** referans-çekme/türetme-yasak/≥2-kaynak; **MK-178.2** fitting unique-key (NULLS NOT DISTINCT 7-alan);
**MK-178.3** kaynak hiyerarşisi (dynamicforge A403 + buyfittingsonline + Sandvik/Alleima); + iki quirk notu (yaricap, 45°-alan).
