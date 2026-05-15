# Kütüphane Veri Besleme Vizyonu

> **Amaç:** AresPipe'ın parça kütüphanesinin **AI / AR / 3D ölçü kontrolü** yetkinliklerinin temel altyapısı olarak nasıl beslendiğini ve uzun vadede nasıl olgunlaşacağını tanımlamak.
>
> **Bağlam:** Bu belge 89. oturumda Cihat'ın kütüphane refactor sırasında belirlediği vizyon parçalarını yazılı kayda alır. İleride "neden 4 katmanlı navigasyon?", "neden satır seviyesinde medya?", "olgunluk göstergesi ne anlama gelir?" sorularının referans cevabıdır.
>
> **Oluşturulma:** 15 Mayıs 2026 — 89. oturum
>
> **İlgili belgeler:**
> - `docs/SPOOL-AI-VIZYON.md` — genel AI ekosistemi vizyonu
> - `docs/KUTUPHANE-KAPSAM.md` — hedef parça çeşitleri (~12.000 satır)
> - `docs/KUTUPHANE-YUKLEME-TAKIP.md` — mevcut doluluk takip

---

## 1. Temel Felsefe — Kütüphane Bir Tablo Değil, Yakıt Deposu

AresPipe'ın parça kütüphanesi (`boru_olculer`, `fitting_olculer`, `flansh_olculer`, `malzeme_kataloglari` vb. tablolar) yüzeysel olarak bir admin envanteridir. Gerçekte ise **AI/AR ekosisteminin yakıt deposu**:

- Sahada operatör fotoğrafından parça tanıma → kütüphane referansı şart
- AR overlay ile ölçü doğrulama → kütüphane referansı şart
- STEP dosyasında geometri tanıma → kütüphane referansı şart
- Mobile sahadan etiketleme → kütüphane besleme noktası

Yani kütüphane olgunlaştıkça AresPipe'ın **akıllı yetkinlikleri açılır**. Boş kütüphane = AI yok, AR yok, 3D kontrol yok. Bu yüzden refactor "sadece UI iyileştirme" değil — **uzun vadeli vizyona yatırım**.

---

## 2. Dört Veri Pipeline'ı

Kütüphane dört farklı kaynaktan beslenir. Her kaynağın **güven seviyesi**, **otomasyon derecesi** ve **operatör müdahalesi** farklıdır.

### Pipeline 1 — Manuel Admin Yükleme

**Akış:** Super admin `admin/kutuphane-*` sayfalarından tek tek ekler.

**Kaynak:** ASME / EN / DIN katalogları + üretici PDF'leri (Wermac, Octal, Ferrobend vb.)

**Güven:** Yüksek — insan doğrulamalı, kaynak belgesi var.

**Veri modeli:** `medya.kaynak = 'manuel'`

**Şu an:** Çalışıyor (`kutuphane-detay.html` mevcut hali). 89. oturumda 4 katmanlı navigasyona refactor edildi.

### Pipeline 2 — Mobile Sahadan Etiketleme

**Akış:** Operatör tablette/telefonda → fotoğraf çek → parça etiketle (NPS/DN seç, standart seç) → "Kütüphaneye yükle" → satır beslenir.

**Hedef nokta:** `boru_olculer.id` (veya benzeri tablo satırı) — yani **satır seviyesi**.

**Güven:** Orta — operatör tanı + ölçü cihazla doğrulanmamış, görsel onaya bağlı.

**Veri modeli:** `medya.kaynak = 'mobile_etiketleme'`

**Durum:** 89'da satır seviyesinde medya altyapısı kurulacak. Mobil endpoint 90+ oturumlarda.

### Pipeline 3 — İmalat Fotoğrafı + QR-Ölçek Parse

**En büyük veri kaynağı.** İmalatın her aşamasında (kesim, büküm, markalama, kalite kontrol) operatör zaten QR-etiketli ölçekli fotoğraf çekiyor. Bu fotoğraflar üzerinde görünen parçalar etiketlenince **kütüphane otomatik beslenir**.

**Akış:**
1. Foto + QR yüklenir
2. QR çözülür → spool tespit edilir
3. Spool'un parça listesi DB'den alınır (`spool_malzemeleri`)
4. Foto üzerindeki bölgeler manuel veya AI ile parça-segmentlere eşlenir
5. QR ölçek referansıyla gerçek mm değerleri hesaplanır
6. Eşleşen `boru_olculer` / `fitting_olculer` / `flansh_olculer` satırına medya bağlanır

**Güven:** Orta-yüksek — QR ölçek + spool tablosundan ground truth eşleştirme + insan doğrulama.

**Veri modeli:** `medya.kaynak = 'imalat_foto'`

**Durum:** 91+ oturumlarda pipeline tasarımı.

### Pipeline 4 — STEP / Rhino Otomatik Parse

**Akış:** Üretici/tasarımcı 3D dosyası (STEP, IGES, Rhino) yüklendiğinde içerik parse edilir. İçindeki standart parçalar (DN500 flanş, DN200 boru vb.) tanınır ve ilgili kütüphane satırına 3D geometri verisi otomatik akar.

**Pipeline:**
1. STEP dosya yüklenir (spool projesi içinde veya standalone)
2. Topoloji analizi (silindirler, halkalar, deliklerin geometrisi)
3. Standart parça pattern'leri ile eşleştirme (örn: dış çap 219.1mm + et 6.3mm = NPS 8" Sch 40)
4. Tolerans kontrolü (±0.5mm dış çap / ±0.3mm et — 88.A'daki RPC ile aynı pattern)
5. Eşleşen kütüphane satırına 3D geometri bilgileri (vertices, faces, BREP referansı) bağlanır

**Güven:** Yüksek — deterministik geometri, halüsinasyon yok.

**Veri modeli:** `medya.kaynak = 'step_parse'`

**Durum:** Uzun vadeli — pipeline backend job'u olarak, 100+ oturumlarda.

---

## 3. Bootstrap Learning Loop

Kütüphane "soğuk başlangıçtan" "kendi kendine besleyen sisteme" doğru evrim geçirir:

```
[Faz 0] Manuel admin yüklemeler — kütüphane sıfırdan kurulur
    ↓
[Faz 1] Temel doluluk ~%30 (P0 standartlar)
    ↓
[Faz 2] Mobile etiketleme + imalat foto pipeline'ları açılır
        — operatör müdahaleli besleme başlar
    ↓
[Faz 3] Kütüphane fotoğraftaki parçayı tanımaya başlar (~%70 doluluk)
        — AI önerisi: "Bu fotoğraftaki parça = B16.9 DN200 90LR (%95 güven)"
        — operatör onaylar, kütüphane büyür
    ↓
[Faz 4] STEP-parse pipeline'ı çalışır
        — 3D model yüklendiğinde kütüphane otomatik beslenir
    ↓
[Faz 5] AR doğrulama açılır
        — Sahada operatör → mobil AR overlay → "Bu parça gerçekten DN500 mi, ±0.5mm içinde mi?"
```

**Klasik AI veri büyüme döngüsü.** Her fazda kütüphanenin değeri artar, AI yetkinliği artar, sahadan gelen veri kalitesi artar.

---

## 4. Olgunluk Göstergesinin Anlamı

Tabloda her satırın yanında gösterilen olgunluk badge'leri (📷 / 🎲 / 📐) sadece "veri var/yok" göstergesi değildir. Her biri AR/AI yetkinliği için bir **gereklilik göstergesi**:

| Badge | İçerik | Hangi yetkinliği açar |
|---|---|---|
| 📷 **Foto** | Gerçek parça fotoğrafları | Görsel referans, parça tanıma için training data |
| 🎲 **3D** | STEP/OBJ/glTF model | AR overlay için referans, ölçü kontrolü için ground truth |
| 📐 **DXF** | 2D teknik resim | Üretim doğrulama, kesim/büküm referansı |

**AR-hazırlık yüzdesi** = (dolu katman sayısı / 3) × 100. Tam olgunluk = 3 katman da dolu.

Standart geneli özet kartı (`Ek Dosyalar`) → bu standardın tüm satırları için toplam medya sayısı. Yönetim için "nerede eksik var" görünürlüğü.

---

## 5. Veri Modeli (Önerilen)

```sql
CREATE TABLE kutuphane_medya (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Hedef satır (polymorphic referans)
  hedef_tablo TEXT NOT NULL,    -- 'boru_olculer' | 'fitting_olculer' | 'flansh_olculer'
  hedef_id UUID NOT NULL,

  -- Medya tipi
  tip TEXT NOT NULL,             -- 'foto' | '3d' | 'dxf' | 'svg'
  dosya_url TEXT NOT NULL,       -- Supabase Storage URL

  -- Kaynak ve güven
  kaynak TEXT NOT NULL,          -- 'manuel' | 'mobile_etiketleme' | 'imalat_foto' | 'step_parse'
  kaynak_referans TEXT,           -- STEP dosya adı, spool id, foto upload id vb.
  guven_yuzde INT,                -- 0-100, kaynak ve doğrulama durumuna göre

  -- Tenant ve kullanıcı
  tenant_id UUID,                 -- NULL = sistem geneli (manuel admin)
  yukleyen_id UUID,               -- kullanicilar.id (NULL = otomatik pipeline)

  -- Meta
  olusturma_at TIMESTAMPTZ DEFAULT NOW(),
  meta JSONB                      -- pipeline-spesifik ekstra veri (örn. QR koordinatları)
);

-- Index'ler
CREATE INDEX idx_kutuphane_medya_hedef ON kutuphane_medya (hedef_tablo, hedef_id);
CREATE INDEX idx_kutuphane_medya_tip   ON kutuphane_medya (hedef_tablo, tip);

-- RLS (super_admin tüm sistem geneli kayıtlara erişir, tenant kayıtları kendi tenant'ına)
```

**Polymorphic pattern:** `(hedef_tablo, hedef_id)` ikilisi — bir medya kaydı `boru_olculer.id = X` veya `fitting_olculer.id = Y` veya `flansh_olculer.id = Z`'ye bağlanabilir. Tek tablo, çok kaynak.

Bu migration 89'da yapılmaz — Katman 4 sayfası önce **mevcut kolonlar (varsa)** veya **placeholder** ile çalışsın, medya tablosu 90+'da eklenir.

---

## 6. Sayfa Hiyerarşisi (4 Katman)

| Katman | Dosya | URL Parametreleri | İçerik | Durum (89 sonu) |
|---|---|---|---|---|
| 1 | `admin/kutuphane.html` | — | 8 parça tipi grup kartı | Mevcut, dokunmuyor |
| 2 | `admin/kutuphane-malzemeler.html` | `?tablo=boru_olculer` | Malzeme grubu listesi (Karbon, Paslanmaz, CuNi, ...) | YENİ |
| 3 | `admin/kutuphane-standartlar.html` | `?tablo=boru_olculer&mg=karbon` | Standart listesi (B36.10M, EN 10216, DIN 86019, ...) | YENİ |
| 4 | `admin/kutuphane-detay.html` | `?tablo=boru_olculer&mg=karbon&std=B36.10M` | Tek tablo + SVG + sağ panel | REVİZE (mevcut dosya) |

**Navigasyon:** Her seviye breadcrumb ile geri dönüş + URL parametresinden konum okuma.

**Yetki:** Tüm sayfalar `super_admin` (manuel inline rol kontrolü pattern'i, `kutuphane.html`'daki gibi).

---

## 7. Sonraki Adımlar

| Oturum | İş |
|---|---|
| **89** | Katman 2-3-4 implementasyonu — mockup onaylı yapı |
| **89 sonrası** | `admin/kutuphane.html` grup kartı linklerini yeni Katman 2'ye yönlendir |
| **90+** | `kutuphane_medya` tablosu migration + manuel yükleme akışı |
| **91+** | Mobile etiketleme akışı (sahadan upload) |
| **92+** | İmalat foto QR-ölçek pipeline'ı |
| **100+** | STEP/Rhino parse pipeline'ı |
| **Uzun vade** | AR overlay yetkinliği |

---

## 8. Açık Sorular (89'da Kararlaştırılmadı)

1. **`kutuphane_medya` migration zamanı** — Katman 4'te şu an placeholder (foto sayısı = 0). 90'da gerçek tablo yapılınca placeholder'lar gerçek verilerle dolacak.
2. **Mobile upload endpoint** — Supabase Storage doğrudan mı, yoksa Vercel function aracılığıyla mı? Güvenlik ve quota açısından değerlendirme gerekli.
3. **STEP parse motoru** — Üçüncü parti kütüphane (OpenCASCADE, opencascade.js) mı, harici servis mi (Onshape API benzeri)?
4. **AI parça tanıma modeli** — Custom train mi, pretrained (CLIP, BLIP) + few-shot mi?

Bu sorular tetik koşulu çıkınca açılır, şimdi karar bekliyor değil.

---

> **Bu belge yaşayan bir doküman.** Yeni vizyon parçaları eklendikçe güncellenir. 89'dan sonraki oturumlarda kütüphane konusu açılırsa açılış ritüelinde bu belge okunur.
