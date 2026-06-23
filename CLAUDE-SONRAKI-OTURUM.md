# Oturum 201 — Kalite Kontrol canlı test + DEFER kalemleri

> Önceki: 200 — KK faz-1 iskelet CANLI. Migration 110 + kalite_kontrol.html rewrite + auth fix + CI fix.
> Sayfa açıldı (auth çözüldü) ama akış uçtan-uca TEST EDİLMEDİ. Detay: `.github/son-durum.md` (200).

ÖN OKUMA: docs/KALITE-KONTROL-TASARIM.md (özellikle Bölüm 4 akış, 7 PDF, 8 entegrasyon) + son-durum 200.

## İLK İŞ — KK canlı uçtan-uca test (200'de yapılmadı)
1. **Hard-refresh** → `kalite_kontrol.html` → 3 sekme (Havuz/Açık/Arşiv) görünüyor mu, giris.html'e atmıyor mu (auth fix `64148f8` teyidi).
2. 🔴 **ET kolonu şüphesi:** Havuz tablosunda ET dolu mu? Sorgu `et_kalinligi_mm` çekiyor (`_spNorm`'da `s.et_kalinligi_mm`→`et_mm`). spooller'da gerçek kolon `et_kalinligi_mm` MI yoksa `et_mm` mi — `information_schema` ile DOĞRULA (MK-126.8). Boş geliyorsa tek-kelime fix.
3. **Round-trip:** havuzdan spool seç → Davetiye Oluştur → tersane-tek guard → **KK26-005** üretildi mi (sayac_tanimlari kk satırı + `_noFormatla`) → Açık sekmesinde göründü mü → Sonuç Gir (varsayılan onay, birini ret=tamir yap + personel + açıklama) → Daveti Kapat → onay spool'u `sevkiyat`'a, ret `on_kontrol`'e döndü mü, davet Arşiv'e geçti mi.
4. A-002210 çift davet: Açık sekmede 2 kayıt görünecek (test verisi) — round-trip testinde kapatılarak temizlenebilir veya tek UPDATE.

## SONRA — DEFER kalemleri (200'de kapsam dışıydı)
- **Client-side PDF (Bölüm 7):** pdfmake vendor'a eklenecek (vendor'da YOK; CDN değil, izometri vendor deseni). Davet PDF'i paket oluşumuyla atomik → Supabase Storage → `kk_davetler.pdf_yolu`.
- **spool_detay + devre_detay entegrasyonu (Bölüm 8):** spool_detay'de "KK26-005 ile davette" + tam KK tarihçesi (ret notları dahil). devre_detay KK davet gösterimini yeni modele uyarla (~496).
- **Ret foto Storage+galeri:** `fotograflar` tablosuna `spool_id` ile insert → spool_detay galerisinde otomatik görünür (çift-bağ). KK'da foto file input şu an stub.
- **is_kayitlari QR personel adayı:** ret personel select şu an `kullanicilar` fallback. `is_kayitlari.personel_id`+`islem_tipi` şemasını teyit (MK-126.8) → QR adayları.

## DİĞER AÇIK (devir)
- A11 kütüphane kapsamlı denetimi (198'den, planlı — KUTUPHANE-DURUM A11).
- Operasyon-sayfası küçük borçları: kesim 599/600 D-02 markup, markalama ms-action i18n, bukum ölü kod 586-613.
- KK i18n: kk_* anahtarları lang/{tr,en,ar}.json'a (TR fallback ile çalışıyor; EN/AR için ekle).
- Sonuç Gir modal mı inline mı kararı.

## Sabit kurallar
- Yeni sayfa rewrite'larında **kanonik auth-ready döngüsü ATLANMAZ** (MK-200.4): getSession→oturumKontrol→tenantKod→sayfaYetkiKontrol. Yoksa _oturum null → giris.html.
- `sonuc` constraint `{gecti,hatali,tamir,bekliyor}` DEĞİŞMEZ (MK-200.1). UI onay=gecti/ret=tamir.
- `exec_sql` SELECT-only (MK-200.3) — DDL/migration Supabase SQL editöründen (BEGIN/ROLLBACK dry-run).
- 12/12 endpoint tavanı (yeni endpoint YOK). Kod commit `[skip ci]` YOK; doc/veri `[skip ci]`.
- information_schema kolon doğrula, varsayma (MK-126.8). Migration: panel dry-run→APPLY→repo (MK-184.5/98.2).
