# AresPipe — Son Durum

> **Son güncelleme:** 13 Mayıs 2026 — 81. oturum (KAPATILDI ✅)
> **Bir önceki oturum:** 80. oturum — A-050 + E hayalet + B-051 + fitting ağırlık 171→452 (commit `4bf1102`, detay: `docs/sessions/`)
> **Sonraki oturum:** 82 — Kütüphane envanteri sayfası implementasyon (`admin/kutuphane.html`)

---

## 81. Oturum Özeti — Tasarım Oturumu

Ana tema: **Kütüphane görsel/3D mimarisi**. Cihat'ın talebiyle başladı: "kütüphane tablolarını süper admin sayfasında bir menü altında görebilir miyiz?". İkinci açılış sorusu (iki Vercel URL'i) hızla cevaplandı (production alias vs deploy hash, normal davranış).

Konuşma genişledi: sadece tablo listeleme değil, parçanın **görsel + üç boyutlu kimliğinin** tasarımı çıktı. 81'in çıktısı: **`docs/KUTUPHANE-EKLER-TASARIM.md`** (kapsamlı yeni belge, 3 tablo + 1 view + 3 kanal AI stratejisi + STEP/Rhino/lazer/AR mimarisi + vizyon çapraz referansı).

Kod yazılmadı, mockup-first kuralı (R-10) gereği önce 2 mockup widget çizildi (kütüphane ana sayfa + parça foto mimarisi diyagramı). İmplementasyon 82'de başlar.

---

## Yapılanlar (81)

### Tasarım belgesi: `docs/KUTUPHANE-EKLER-TASARIM.md` (yeni)

- **`kutuphane_ekler` tablosu** — kütüphane satırına doğrudan bağlı dosyalar (DXF, STEP, Rhino, katalog foto, video). Polimorfik (`hedef_tablo` + `hedef_id`). SHA256 ile duplicate koruması. Paylaşım seviyeleri: `private` / `shared_anon` / `public`. Lisans alanı zorunlu, NULL olamaz.
- **`parca_etiketleri` tablosu** — polimorfik etiket katmanı. Kaynaklar: `foto_spool`, `foto_katalog`, `izometri_pdf`, `malzeme_satir`, `step_solid`, `lazer_segment`, `ar_secim`. **Çapraz etiket grupları (`grup_id`)** — aynı parça birden fazla kaynakta etiketlendiğinde altın eğitim verisi. AI önerme/güven/öğrenme alanları schema'ya bugünden eklendi (`etiket_tipi`, `guven_skoru`, `ai_kanal`, `benzer_grup_id`, `embedding_vec`).
- **`kutuphane_ogrenme_durumu` materialized view** — parça başına AI olgunluk (`yok` / `kural` / `embedding` / `finetune`). Power law kabulü (sık parçalar hızlı olgunlaşır, nadirler manuel kalabilir). Eşikler: 1 / 5 / 50 altın grup.
- **3 kanal AI stratejisi** — Kanal 1 (kural, $0, %30-50, hemen), Kanal 2 (embedding/CLIP, ~0.5¢, %60-80, 6-12 ay), Kanal 3 (fine-tune, $500-5000, %85+, 18+ ay). Paralel çalışırlar, parça başına aktif kanal seçilir.
- **Manuel onay disiplini** — sistem ÖNERİR, kullanıcı ONAYLAR. Otomatik etiket yazma YOK. Reddedilen öneriler silinmez, negatif sinyal olarak saklanır.
- **Geometrik kaynak eşleştirme bölümü** — STEP/Rhino solid eşleştirme (deterministik geometri matching, %90+ standart parçada, vizyon Kategori C tetiği), lazer nokta bulutu RANSAC (18+ ay), AR seçim (vizyon F+). Yeni tablo açılmıyor, `kaynak_tipi` enum genişlemesi yeterli.
- **Vizyon belgesi çapraz referansı** — VIZYON-VE-MODULER-MIMARI Bölüm 2.A, SPOOL-AI-VIZYON Madde 4/7/11/13/14/16/19/20/21, Kategori C tetikleri eşleştirildi.

### Mockup'lar (R-10 kuralı)

- Kütüphane envanteri ana sayfa mockup'ı — 5 metric kart (Geometri / Malzeme / Uyum / Özel / Spec), 8 tablo gruplar halinde listelenir, her satır tıklanabilir. Cihat onayladı.
- Parça fotoğraf mimarisi diyagramı — 3 katman (kütüphane anchor → iki saklama tablosu → AI eğitim havuzu), Cihat'ın "aynı flanş çok yerden çekilir" sorusuna yapısal cevap.

### Kararlar Alındı

- **KARAR-81.1** — Kütüphane envanteri ayrı sayfa: `admin/kutuphane.html` ana + tek detay sayfa query string ile (`?tablo=X`). AresPipe'ın mevcut paterniyle uyumlu (`devre_detay.html?id=...`).
- **KARAR-81.2** — 3 tablo + 1 view mimarisi (kutuphane_ekler, parca_etiketleri, kutuphane_ogrenme_durumu). Tablolar polimorfik, yeni kütüphane tablosu eklenince CHECK constraint güncelle yeterli.
- **KARAR-81.3** — 3 kanal AI stratejisi parça başına seçilir. Sık/nadir ayrımı kabul edilir, bazı parçalar AI olgunluğa hiç ulaşmayabilir.
- **KARAR-81.4** — Geometrik kaynak (STEP/Rhino/lazer/AR) aynı tasarım belgesine dahil edildi, ayrı belge açılmadı. STEP vizyon Kategori C tetiğiyle aktif bağ kuruldu.
- **KARAR-81.5** — Salt-okunur mod. CRUD + Excel import sonraya bırakıldı. Veri girişi hâlâ Claude oturumları + SQL ile sağlıklı yürüyor.
- **KARAR-81.6** — Hedef rakamlar (`/280`, `/2.500` gibi) `docs/KUTUPHANE-YUKLEME-TAKIP.md`'den fetch + parse (Pano paterniyle aynı). Mevcut sayım DB count.
- **KARAR-81.7** — Thumbnail dosyası üretilmez. Supabase Storage transform URL kullanılır (`?width=320`). Tablo listesinde foto görünmez (sadece sayı), popup'ta küçük gösterim.
- **KARAR-81.8** — EXIF metadata otomatik çıkarma kapalı. Vizyon E katmanı yaklaşırken açılır. `etiket_jsonb` alanı bugünden esnek.
- **KARAR-81.9** — Dosya boyut limiti tip-bazlı: foto 25 MB, DXF 20 MB, STEP/Rhino 200 MB, video 100 MB, PDF 30 MB. Aşılırsa red + sıkıştırma uyarısı.

### Yeni Mimari Kurallar

- **MK-81.1** — Polimorfik etiketleme katmanı: yeni etiket kaynağı eklemek için ayrı tablo açma, `parca_etiketleri.kaynak_tipi` enum genişlet. `bbox_jsonb` polimorfik (2D bbox / 3D AABB / lazer primitive / satır numarası) — sınır yok.
- **MK-81.2** — Power law kabulü: AI olgunluk sistem geneli ölçülmez, parça başına ölçülür. `kutuphane_ogrenme_durumu` view bunu sağlar. Bazı parçaların manuel kalması doğru davranış, sistem hatası değil.
- **MK-81.3** — AI önerir, kullanıcı onaylar. Otomatik etiket yazma YOK. Bu vizyonun "halüsinasyon koruyucu" prensibi.
- **MK-81.4** — Lisans alanı zorunlu, NULL olamaz. `belirsiz` lisanslı kayıt `shared_anon`'a terfi edemez. Yasal disiplin schema'ya gömülü.

---

## Açık Borçlar (82+ Oturumlara Devreden)

### 82. Oturum gündemi (sırada)

- **Kütüphane envanteri sayfaları** — `admin/kutuphane.html` (ana) + `admin/kutuphane-detay.html` (tek dosya, query string ile). Salt-okunur, 5 metric kart, gruplar halinde tablo listesi, tıklanınca detay sayfa.
- **Yan: AresPipe CSS değişkenleri ile mockup'tan gerçek implementasyon** — mockup Anthropic widget tarzında çizilmişti, gerçek implementasyon Barlow font, `var(--ac)`, G-02 Hero+Pill standardıyla.
- **Hedef sayı fetch** — `docs/KUTUPHANE-YUKLEME-TAKIP.md` markdown parse, Pano paterni referans alınır.
- **DB count sorgu** — 8 tablo × `SELECT count(*)` paralel, materialized view'la cache'lenmez (basit, ihtiyaç olunca optimize edilir).

### 83+ Oturumlar

- **`kutuphane_ekler` migration** — 3 tablo + 1 view DDL yazılır. SHA256 UNIQUE index, RLS politikaları (private/shared_anon/public terfi), lisans CHECK constraint.
- **Kütüphane detay sayfa "Ekler" sekmesi** — satıra tıklanınca popup, ekler listesi (DXF/STEP/foto sayımları), tıklanınca indir/gör.
- **Üç-pencere manuel etiketleme UI** — spool detay sayfasında "Etiketle" modu, foto + izometri + malzeme listesi yan yana, bbox çizim, kütüphane parça seçici modal, `grup_id` ile üçlü kayıt.

### Veri/Vizyon Borçları (sinyal bazlı)

- **Kanal 1 (kural-tabanlı öneri)** — ilk 50-100 spool girildikten sonra, sık parçalarda 5+ altın grup birikince
- **Kanal 2 (embedding)** — Kanal 1 stabil, sık parçalarda 5+ altın grup birikince. CLIP modeli seçimi o zaman yapılır (OpenAI vs Anthropic vs Replicate self-hosted).
- **STEP/Rhino entegrasyonu** — vizyon Kategori C tetiği: STEP veren ilk müşteri çıkınca. opencascade.js, 1-2 oturum implementasyon (mimari hazır).
- **Lazer nokta bulutu** — vizyon Madde 21, QR ölçek altyapısı önkoşul, 18+ ay.
- **Fine-tune (Kanal 3)** — vizyon E katmanı, 50+ altın grup biriken parçalar için, 18+ ay.

### Önceki Oturumlardan Açık (80 ve öncesi)

- 80'in açık borçları kendi `son-durum.md` yedek satırlarında (git history). 81 bağımsız tasarım oturumu olduğu için yeni borç eklemedi, eskilerden silmedi.

---

## CI Son Durum

- **Build:** ✅ YEŞİL (son commit `7f011a7` ci-son-rapor.json güncelle [skip ci])
- **Lint:** 81 oturum öncesi neyse o (kod değişikliği yok)
- **Vercel:** ✅ Production = `7f011a7` (Current)
- **Bu oturumda kod commit'i:** YOK (sadece dokümantasyon)

---

## Süreç Disiplinleri (52+ den, 81'de değişiklik yok)

- **Heredoc yöntemi** dosya yazma için (Mac indirme bozuk)
- **`arespipe_kopyala`** MD5 doğrulamalı (MK-52.1)
- **`gp`** otomatik rebase + push (MK-52.2)
- **Sadece terminal git** akışı, GitHub web UI upload YOK
- **`AT TIME ZONE 'Europe/Istanbul'`** SQL'de
- **`information_schema.columns`** ile sütun adı doğrula

---

## Performans / Bütçe Bilgisi

81'de canlı test yapılmadı (tasarım oturumu). Performans/maliyet beklentileri tasarım belgesinde (KUTUPHANE-EKLER-TASARIM.md Bölüm 7) yazılı.

---

> **82. oturum açılışında bu dosya, `docs/CLAUDE-SON-OTURUM.md` ve `docs/CLAUDE-SONRAKI-OTURUM.md` okunacak.** Ek olarak `docs/KUTUPHANE-EKLER-TASARIM.md` (yeni) kütüphane sayfaları yazılırken referans.
