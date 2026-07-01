# AresPipe — Son Durum (Oturum 212 kapanışı)

## Bu oturum: 112 migration teyidi + MDevreler tap bug fix + Sıra 7 ertelendi
Rutinler bozulup yeniden başlatılan bir oturumdu; önceki (yarım) 212'de yazılan 112 migration'ın
canlı oturduğu doğrulandı, MDevreler kart tıklama bug'ı çözülüp canlıya alındı, Sıra 7 (MMusteri)
web-first stratejisiyle ertelendi. Kapanışta **YENİ öncelik-1 iş** tanımlandı: mobil layout standardizasyonu.

## Yapılanlar

### 1. 112 migration canlı teyidi (Sıra 7 önkoşulu — 208 blokörü KAPANDI)
- `migrations/schema/112_kullanicilar_customer_id.sql` önceki yarım-212'de yazılıp uygulanmış.
- `information_schema` + `pg_constraint` ile teyit edildi (MK-200.5 — "CANLI uygulandı" commit mesajı
  yeterli değil, doğrulama şart):
  - FK var: `kullanicilar_customer_id_fkey → customers(id)`.
  - Mevcut FK'lar bozulmamış: `id → auth.users` (ON DELETE CASCADE), `tenant_id → tenants`.
- Migration temiz: additive + nullable + idempotent (`ADD COLUMN IF NOT EXISTS`), RLS tenant-scope
  kalıbına dokunmuyor. Yeni endpoint yok, api/*.js=12 sabit.
- Karar (dosyada): müşteri kullanıcı = `kullanicilar` satırı (`rol='musteri'`), doğrudan `customer_id`
  FK; görünürlük `customer_project_access (customer_id + proje_id + tenant_id)` üzerinden **kurulacak**
  (bu tablo HENÜZ YOK — Sıra 7 önkoşulunun ikinci yarısı). `customer_kullanicilar` rehber tablosuna
  dokunulmadı (auth'a bağsız ayrı amaç).

### 2. MDevreler kart tıklama bug'ı çözüldü (f9d7429) — CANLI
- **Semptom (Cihat, görsel):** Aktif Devreler'de bir karta tek dokunuş açmıyor, 5-6 ısrarlı dokunuştan
  sonra açılıyor; alt kartlarda daha beter.
- **Kök neden (DATA→UI→kod, MK-158.1):** `devreAc` handler'ı tertemiz düz `navigate`. Sorun handler'da
  değil, kartın **giriş animasyonunda**. `devreKart` stili `opacity:0` + `animation: mDvrFadeIn 260ms`,
  keyframe `translateY(4px)→translateY(0)`, inline `animationDelay: (i*45+80)ms` (stagger). translateY'li
  giriş, animasyon oturana kadar kartın hit-test bölgesini kaydırıyor → parmak "gördüğü" yere basıyor,
  tap oturmamış konuma gitmiyor. Israrlı dokunuş repaint tetikleyince tutuyor. Alt kartlarda delay
  büyük → pencere uzun → daha beter. Semptomla birebir tutarlı.
- **Fix (Karar A — Cihat):** Kartın giriş animasyonu tamamen kaldırıldı. `devreKart`'tan `opacity:0`
  + `animation` satırları, 492'deki inline `animationDelay` silindi. Kartlar anında %100 tıklanabilir.
  `mDvrFadeIn` yalnız devreKart'ta kullanılıyordu (grep teyitli); keyframe *tanımı* (710) ölü kaldı,
  zararsız → küçük temizlik borcu.
- Patch: Python anchor + .bak + ABORT-on-mismatch + idempotency. grep ile değişiklik doğrulandı
  (`animationDelay` ve `animation: mDvrFadeIn 260ms` artık yok). Commit [skip ci] YOK (kod). Push
  öncesi pull --rebase. Canlı deploy testi Cihat'ta (deploy sırasında kapanışa geçildi).

### 3. Sıra 7 (MMusteri) — ERTELENDİ (Cihat kararı)
- Önkoşulun DB tarafı (customer_id FK) tamam; mockup çıkarıldı (müşteri = dış/salt-okunur/yönetici gözü:
  proje başlığı + genel sevkiyat %'si + basamak hunisi + devre rollup nNRenkler; footer aksiyon YOK).
- **Karar:** Müşteri ekranı acil değil; **web'de yapılıp mobile'a adapte etmek daha doğru**. Şimdilik
  atlandı. Sıra 7 → web-first, tarih TBD.

## KRİTİK — YENİ öncelik-1 iş (213): Mobil layout standardizasyonu
Cihat üç ekranda tutarsızlık gösterdi (görsel):
- **İş Başlat (MIsBaslat):** altta tab bar (Ana Sayfa / Ara / Bildirim / Menü) VAR.
- **Yönetici anasayfa (MAnasayfaYonetici):** aynı tab bar YOK (farklı shell / shell dışı render).
- **Spool detay (IbSpoolDetay/spool ekranı):** tab bar yok + altta **kocaman ölü boşluk** (içerik
  yukarıda bitiyor, alt yarı boş gri).
- **Teşhis hipotezi:** Ekranlar ortak bir layout shell'i paylaşmıyor; tab bar'ın görünürlüğü tek
  yerden/kararlı bir kurala bağlı değil, bazı ekranlar çıplak render oluyor. Ölü alan = içerik
  100dvh flex iskeletine oturmamış (CLAUDE-MOBILE §9 layout kalıbı bazı ekranlarda uygulanmamış).
- **Karar (Cihat):** "Baştan doğru düzgün yapalım, yarım kalmasın." → 213 ana işi, R-10 mockup-first:
  önce standart iskelet mockup'ı (topbar + scroll içerik + tab bar görünürlük kuralı), sonra tek ortak
  `MLayout` komponenti; tüm ekranlar ona geçirilir. Detay CLAUDE-SONRAKI-OTURUM.md.

## Açık debt (213+)
- **[ÖNCELİK 1] Mobil layout standardizasyonu** — tab bar tutarsızlığı + spool detay ölü alan (yukarıda).
- **Sıra 7 (MMusteri):** web-first, ertelendi. DB önkoşulunun 2. yarısı: `customer_project_access` tablosu
  (113 migration) HENÜZ YOK.
- **Sıra 8 (kayıt/davet):** EN BÜYÜK kalan iş. §7 kilitli (§7-1 admin davet OTP+upsert, §7-2 rol='uygulama'
  +ortak tenant, §7-4 çoklu rol serbest).
- Ölü keyframe `mDvrFadeIn` (MDevreler:710) temizliği — küçük.
- Topbar mark animasyonu iOS Safari (208'den): SMIL beginElement() tutmuyor; kod duruyor.
- Üyelik paketi abonelik bağı (209'dan): MProfil statik "Kurumsal".
- Avatar canlı teyit (209'dan): upload + JWT tenant_id claim deploy testinde doğrulanacak.

## CI / push
- HEAD: f9d7429 (MDevreler tap fix) + öncesi a61979d (112 migration + bot ci). api/*.js=12 (tavan korundu).
- Push zinciri (212): 112 migration ilgili commit'ler (yarım-212'den) → f9d7429 (tap fix) → bu doc.
- Kod commit'i [skip ci] YOK; bu kapanış doc'u [skip ci] VAR. Her push öncesi pull --rebase (bot ci çakışmasız).

## Sonraki oturum (213) — detay CLAUDE-SONRAKI-OTURUM.md
- **Öncelik 1: Mobil layout standardizasyonu** (R-10 mockup → ortak MLayout → tüm ekranları geçir).
- Alternatif/sonra: Sıra 8 (kayıt/davet, en büyük iş), Sıra 7 (web-first).
