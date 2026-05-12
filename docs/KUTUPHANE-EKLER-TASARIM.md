# AresPipe — Kütüphane Ekleri ve Parça Etiketleme Tasarımı

> **Durum:** Tasarım belgesi — kod yazılmadı. 82+ oturumlarda implementasyon.
> **İlk yazım:** 13 Mayıs 2026 — 81. oturum.
> **Bağlam:** Kütüphane envanter sayfası ile birlikte tasarlandı. `docs/KUTUPHANE-KAPSAM.md` ve `docs/KUTUPHANE-YUKLEME-TAKIP.md` belgelerinin görsel/üç boyutlu uzantısı.
> **Vizyon bağı:** Bu belge `docs/VIZYON-VE-MODULER-MIMARI.md` Bölüm 2.A (Parça Kimliği Prensibi) ve `docs/SPOOL-AI-VIZYON.md` Madde 4 (etiketleme aracı), Madde 7 (görsel hata tespiti), Madde 11 (operasyonel pipeline), Madde 19-21 (görsel parça tanıma, izometri-foto eşleşme, fotogrametri), Vizyon Kategori C (STEP entegrasyon tetiği) maddelerinin somut altyapısıdır.

---

## 1. Amaç

Bugünkü kütüphane sistemi parçanın **geometrik kimliğini** taşıyor — ölçü, ağırlık, malzeme. Bu belge parçanın **görsel ve üç boyutlu kimliğini** ekler:

- DXF / STEP / Rhino dosyaları
- Stüdyo / üretici katalog fotoğrafları
- Saha montaj fotoğrafları (spool üzerinde)
- İzometri PDF bölgelerinin etiketlenmesi
- Malzeme listesi satırlarının kütüphaneye bağlanması
- Lazer nokta bulutu segmentleri (uzun vade)
- AR ekran seçimleri (vizyon F+)

Bu kayıtların tümü tek bir parça nesnesi etrafında toplandığında üç şey aynı anda gerçekleşir: **kullanıcı parçayı görsel olarak tanır** (KK'da, eğitimde, planlamada), **3D rendering doğru çizilir** (kütüphane ölçü + STEP konumu), **AI eğitim verisi organik birikir** (vizyon E katmanı için).

---

## 2. Sorun ve Çözüm Özeti

### 2.1 Mevcut durum

- `fotograflar` tablosu var — spool'a bağlı saha fotoları içeriyor, etiketleme yok
- Kütüphane satırlarına bağlı görsel veri YOK
- Spool ve katalog fotosu birbirini bilmiyor
- AI eğitim verisi yapılandırılmamış — `egitim_verisi_pipeline` tablosu altyapı olarak var ama içeriği boş

### 2.2 Çözüm — 3 tablo + 1 materialized view

```
┌─────────────────────────────────────────────────────────────┐
│                  Kütüphane parça nesnesi                    │
│       (flansh_olculer, fitting_olculer, vb.)                │
└─────────────────────────────────────────────────────────────┘
              ▲                              ▲
              │ doğrudan FK                  │ etiketleme katmanı
              │                              │
┌─────────────┴────────────┐     ┌──────────┴──────────────┐
│  kutuphane_ekler (yeni)  │     │  parca_etiketleri (yeni)│
│  DXF · STEP · Rhino      │     │  polimorfik kaynak →    │
│  katalog foto · video    │     │  kütüphane bağı         │
│  paylaşım: tenant→sistem │     │  + AI önerme/güven      │
└──────────────────────────┘     └─────────────────────────┘
                                            ▲
                                            │
                              ┌─────────────┴──────────────┐
                              │  fotograflar (mevcut)      │
                              │  + izometri PDF bbox       │
                              │  + spool_malzemeleri satır │
                              │  + step_solid (gelecek)    │
                              └────────────────────────────┘

       ┌──────────────────────────────────────────────────┐
       │   kutuphane_ogrenme_durumu (materialized view)   │
       │   Parça başına olgunluk → AI kanal seçimi        │
       └──────────────────────────────────────────────────┘
```

---

## 3. Tablo Şemaları

### 3.1 `kutuphane_ekler` — Doğrudan ek dosyalar

Kütüphane satırına **doğrudan bağlı** dosyalar. Üretici kataloğu, atölye stüdyo çekimi, üreticiden alınan DXF/STEP.

```sql
CREATE TABLE kutuphane_ekler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Polimorfik bağ (5 kütüphane tablosundan birine)
  hedef_tablo TEXT NOT NULL,
  hedef_id UUID NOT NULL,

  -- Ek tipi
  ek_tipi TEXT NOT NULL,
  -- 'foto_katalog' | 'foto_uretici' | 'dxf' | 'step' | 'rhino' | 'pdf_katalog' | 'video'

  -- Dosya
  dosya_url TEXT NOT NULL,            -- Supabase Storage path
  dosya_adi TEXT,
  boyut_byte BIGINT,
  sha256 TEXT,                        -- duplicate önleme (katalog tarafı)

  -- Metadata (genişleyebilir JSONB)
  etiket_jsonb JSONB,
  -- foto için: { "aci": "on/yan/ust", "isik": "studyo/atolye", "montaj_durumu": "tek_parca/kit" }
  -- 3D için:   { "format_versiyon": "AP242", "solid_sayisi": 1, "birim": "mm" }
  -- video için:{ "sure_sn": 28, "cozunurluk": "720p" }

  -- Provenance + lisans
  kaynak TEXT,                        -- 'uretici_katalog' | 'tersane_arsiv' | 'firma_ici' | 'public_dataset'
  kaynak_url TEXT,
  lisans TEXT NOT NULL,               -- 'public_domain' | 'cc_by' | 'firma_sahibi' | 'ticari_satin_alma' | 'belirsiz'
  paylasim TEXT NOT NULL DEFAULT 'private',
  -- 'private' (tenant) | 'shared_anon' (sistem geneli, anonim) | 'public' (gelecek)

  -- Yaşam döngüsü
  yukleyen_id UUID,
  yukleyen_tenant_id UUID,
  olusturma_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  guncelleme_at TIMESTAMPTZ,
  aktif BOOLEAN NOT NULL DEFAULT true,

  CONSTRAINT hedef_tablo_check CHECK (hedef_tablo IN (
    'boru_olculer','fitting_olculer','flansh_olculer',
    'malzeme_kataloglari','ozel_parcalar'
  )),
  CONSTRAINT ek_tipi_check CHECK (ek_tipi IN (
    'foto_katalog','foto_uretici','dxf','step','rhino','pdf_katalog','video'
  )),
  CONSTRAINT paylasim_check CHECK (paylasim IN ('private','shared_anon','public'))
);

CREATE INDEX kutuphane_ekler_hedef ON kutuphane_ekler (hedef_tablo, hedef_id) WHERE aktif;
CREATE INDEX kutuphane_ekler_tip ON kutuphane_ekler (ek_tipi) WHERE aktif;
CREATE UNIQUE INDEX kutuphane_ekler_sha ON kutuphane_ekler (hedef_tablo, hedef_id, sha256) WHERE aktif AND sha256 IS NOT NULL;
```

Notlar:
- `paylasim='private'` varsayılan. Cihat onayıyla `shared_anon`'a geçer. `public` modu vizyon Madde 14 (eğitim oyunu) için saklıdır, şu an YOK.
- `sha256` UNIQUE constraint: aynı parçaya aynı dosya 2× yüklenemez. Farklı parçalara aynı dosya yüklenebilir (UNIQUE `(hedef, sha)` kombinasyonunda).
- Storage path: `kutuphane/{hedef_tablo}/{hedef_id}/{ek_tipi}/{sha256[:8]}.{uzanti}`

### 3.2 `parca_etiketleri` — Polimorfik etiketleme katmanı

Çeşitli kaynaklardaki (spool fotoğrafı, izometri PDF, malzeme satırı, STEP solid, lazer segment, AR seçim) parçaların kütüphane satırına bağlanması. Manuel + AI önerme + grup_id ile çapraz validasyon dahil.

```sql
CREATE TABLE parca_etiketleri (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Kaynak (polimorfik)
  kaynak_tipi TEXT NOT NULL,
  -- 'foto_spool' | 'foto_katalog' | 'izometri_pdf' | 'malzeme_satir' | 'step_solid' | 'lazer_segment' | 'ar_secim'
  kaynak_id UUID NOT NULL,

  -- Hedef parça (kütüphane satırı)
  kutuphane_tablo TEXT NOT NULL,
  kutuphane_id UUID NOT NULL,

  -- Konum bilgisi (kaynak tipine göre değişir)
  bbox_jsonb JSONB,
  -- 2D (foto/izometri): { "x": 0.15, "y": 0.42, "w": 0.12, "h": 0.18 } yüzde
  -- 3D (STEP solid):    { "aabb_min": [x,y,z], "aabb_max": [x,y,z], "birim": "mm" }
  -- Satır (malzeme):    { "satir_no": 7, "kolon_aralik": [12,48] }
  -- Lazer segment:      { "primitive": "silindir", "merkez": [x,y,z], "yariap": r, "yon": [dx,dy,dz] }

  -- Çapraz etiket grubu (KRİTİK — aynı parça birden fazla kaynakta etiketlendiğinde)
  grup_id UUID,
  grup_aciklama TEXT,

  -- Öneri / güven / öğrenme zinciri
  etiket_tipi TEXT NOT NULL DEFAULT 'manuel',
  -- 'manuel' | 'ai_taslagi' | 'onaylanmis_ai' | 'reddedildi_ai'
  guven_skoru NUMERIC,                -- 0-1, AI taslakta dolu, manuelde NULL
  ai_kanal TEXT,                      -- 'kural' | 'embedding' | 'finetune' | 'geometri' | NULL
  benzer_grup_id UUID,                -- bu önerinin türetildiği eski altın grup (öğrenme zinciri)

  -- Embedding (Kanal 2 için, lazy compute)
  embedding_vec FLOAT[],              -- 768 boyutlu vektör (foto/izometri için)
  embedding_uretildi_at TIMESTAMPTZ,
  embedding_model TEXT,               -- 'clip-vit-base-patch32' gibi

  -- Yaşam döngüsü
  etiketleyen_id UUID,
  etiketleyen_tenant_id UUID,
  olusturma_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  guncelleme_at TIMESTAMPTZ,
  aktif BOOLEAN NOT NULL DEFAULT true,

  CONSTRAINT kaynak_tipi_check CHECK (kaynak_tipi IN (
    'foto_spool','foto_katalog','izometri_pdf','malzeme_satir',
    'step_solid','lazer_segment','ar_secim'
  )),
  CONSTRAINT kutuphane_tablo_check CHECK (kutuphane_tablo IN (
    'boru_olculer','fitting_olculer','flansh_olculer',
    'malzeme_kataloglari','ozel_parcalar'
  )),
  CONSTRAINT etiket_tipi_check CHECK (etiket_tipi IN (
    'manuel','ai_taslagi','onaylanmis_ai','reddedildi_ai'
  ))
);

CREATE INDEX parca_etiketleri_kutuphane ON parca_etiketleri (kutuphane_tablo, kutuphane_id) WHERE aktif;
CREATE INDEX parca_etiketleri_kaynak ON parca_etiketleri (kaynak_tipi, kaynak_id) WHERE aktif;
CREATE INDEX parca_etiketleri_grup ON parca_etiketleri (grup_id) WHERE aktif AND grup_id IS NOT NULL;
CREATE INDEX parca_etiketleri_tip ON parca_etiketleri (etiket_tipi) WHERE aktif;
```

Notlar:
- Bir "altın etiket grubu" = aynı `grup_id`'li 2-4 satır (foto + izometri + malzeme satırı, opsiyonel STEP solid).
- `embedding_vec` lazy hesaplanır — etiket onaylandıktan sonra arka plan job ile doldurulur.
- `reddedildi_ai` kayıtları **silinmez** — negatif sinyal olarak modelin gelecek önerilerinde kullanılır.
- Spool fotoğrafları SHA check'i YOK — her foto unique zaten.

### 3.3 `kutuphane_ogrenme_durumu` — Materialized view (parça başına olgunluk)

Power law dağılımı (Cihat'ın 81. oturum sezgisi): bazı parçalar yılda 300× kullanılır, bazıları yılda 0×. AI olgunluk **parça başına** ölçülür, sistem geneli ölçülmez.

```sql
CREATE MATERIALIZED VIEW kutuphane_ogrenme_durumu AS
SELECT
  kutuphane_tablo,
  kutuphane_id,

  -- Sayımlar
  COUNT(DISTINCT grup_id) FILTER (
    WHERE etiket_tipi IN ('manuel','onaylanmis_ai') AND grup_id IS NOT NULL
  ) AS altin_grup_sayisi,
  COUNT(*) FILTER (WHERE etiket_tipi='manuel') AS manuel_etiket_sayisi,
  COUNT(*) FILTER (WHERE etiket_tipi='onaylanmis_ai') AS onaylanmis_ai_sayisi,
  COUNT(*) FILTER (WHERE etiket_tipi='reddedildi_ai') AS reddedildi_ai_sayisi,
  COUNT(DISTINCT kaynak_id) FILTER (WHERE kaynak_tipi='foto_spool') AS spool_foto_sayisi,
  COUNT(DISTINCT etiketleyen_tenant_id) AS tenant_cesitliligi,

  -- Zaman damgaları
  MIN(olusturma_at) AS ilk_etiket_at,
  MAX(olusturma_at) AS son_etiket_at,

  -- Olgunluk kanalı (eşikler 81. oturumda tartışmaya açık seçildi, ileride veriye göre ayarlanır)
  CASE
    WHEN COUNT(DISTINCT grup_id) FILTER (
      WHERE etiket_tipi IN ('manuel','onaylanmis_ai') AND grup_id IS NOT NULL
    ) >= 50 THEN 'finetune'
    WHEN COUNT(DISTINCT grup_id) FILTER (
      WHERE etiket_tipi IN ('manuel','onaylanmis_ai') AND grup_id IS NOT NULL
    ) >= 5  THEN 'embedding'
    WHEN COUNT(DISTINCT grup_id) FILTER (
      WHERE etiket_tipi IN ('manuel','onaylanmis_ai') AND grup_id IS NOT NULL
    ) >= 1  THEN 'kural'
    ELSE 'yok'
  END AS ai_olgunluk

FROM parca_etiketleri
WHERE aktif
GROUP BY kutuphane_tablo, kutuphane_id;

CREATE UNIQUE INDEX kutuphane_ogrenme_durumu_pk
  ON kutuphane_ogrenme_durumu (kutuphane_tablo, kutuphane_id);
```

Refresh stratejisi:
- Gece otomatik tam refresh (CRON, Vercel function veya Supabase scheduled function)
- Etiket onaylandığında targeted refresh (sadece o parça satırı) — `REFRESH MATERIALIZED VIEW CONCURRENTLY` ile

Kullanım örneği — kütüphane detay sayfasında olgunluk badge:

```sql
SELECT f.*, o.altin_grup_sayisi, o.ai_olgunluk
FROM flansh_olculer f
LEFT JOIN kutuphane_ogrenme_durumu o
  ON o.kutuphane_tablo='flansh_olculer' AND o.kutuphane_id=f.id
ORDER BY o.altin_grup_sayisi DESC NULLS LAST;
```

---

## 4. Paylaşım ve Lisans Politikası

### 4.1 Üç paylaşım seviyesi

| Seviye | Görünürlük | Tipik içerik | Tetik |
|---|---|---|---|
| `private` | Sadece yükleyen tenant | Spool montaj fotoları, KK fotoları, firma içi DXF | Varsayılan |
| `shared_anon` | Tüm tenantlar, yükleyen anonim | Üretici katalog fotosu, public domain STEP, ASME ölçü tabloları | Cihat onayıyla terfi |
| `public` | İnternet (gelecekte) | Vizyon Madde 14 — eğitim oyunu için 30-40 anonimleştirilmiş izometri | YOK (vizyon Kategori C+) |

### 4.2 Lisans alanı zorunlu

`lisans` NULL olamaz. Olası değerler:

- `public_domain` — telif yok (eski ASME ölçüleri, NASA datasetler)
- `cc_by` — Creative Commons atıflı (GitHub açık datasetler)
- `firma_sahibi` — yükleyen firmanın iç verisi, paylaşım kararı firmaya ait
- `ticari_satin_alma` — lisans satın alınmış (ileride)
- `belirsiz` — kaynak biliniyor ama lisans netleştirilmemiş, `paylasim` `private` kalmalı, üst seviyeye terfi edilemez

Yasal disiplin: bir kayıt `shared_anon`'a terfi etmeden önce lisans **`public_domain` veya `cc_by` veya `firma_sahibi (paylaşım onaylı)`** olmalı. `belirsiz` lisanslı içerik paylaşılamaz.

### 4.3 RLS politikaları (özet)

```sql
-- kutuphane_ekler için
CREATE POLICY kut_ekler_okuma ON kutuphane_ekler FOR SELECT
USING (
  paylasim IN ('shared_anon','public')
  OR yukleyen_tenant_id = ARES.tenantId()
  OR EXISTS (SELECT 1 FROM kullanicilar WHERE id = auth.uid() AND rol = 'super_admin')
);

CREATE POLICY kut_ekler_yazma ON kutuphane_ekler FOR INSERT
WITH CHECK (yukleyen_tenant_id = ARES.tenantId());

CREATE POLICY kut_ekler_terfi ON kutuphane_ekler FOR UPDATE
USING (EXISTS (SELECT 1 FROM kullanicilar WHERE id = auth.uid() AND rol = 'super_admin'))
WITH CHECK (lisans IN ('public_domain','cc_by','firma_sahibi'));

-- parca_etiketleri her zaman tenant-scoped (montaj etiketleri başka firmaya sızmamalı)
CREATE POLICY parca_etiket_tenant ON parca_etiketleri FOR ALL
USING (
  etiketleyen_tenant_id = ARES.tenantId()
  OR EXISTS (SELECT 1 FROM kullanicilar WHERE id = auth.uid() AND rol = 'super_admin')
);
```

---

## 5. Dosya Boyutu Limitleri

Tip-bazlı limit, aşılırsa red + kullanıcıya sıkıştırma uyarısı:

| Ek tipi | Limit | Sebep |
|---|---|---|
| `foto_katalog` / `foto_spool` | 25 MB | Modern kamera/telefon orijinal foto bu aralıkta |
| `dxf` | 20 MB | 2D çizim, küçük dosya |
| `step` / `rhino` | 200 MB | Karmaşık fitting nadiren büyük olur, sınır makul |
| `video` | 100 MB | 10-60 sn, 720p — daha uzun video zaten gereksiz |
| `pdf_katalog` | 30 MB | Üretici kataloğu birkaç sayfa |

Aşılırsa: backend reddi + toast "Dosya çok büyük (X MB). DXF/STEP için ZIP'leyin, video için kısaltın veya 720p'ye düşürün, foto için sıkıştırın."

EXIF politikası: **bu oturumda kapalı**. AI eğitimi yaklaşırken (vizyon E katmanı) açılır. Şu an `etiket_jsonb` alanı esnek, sonradan migration gerekmez.

Thumbnail politikası: **dosya üretilmiyor**. Supabase Storage transform API (`?width=320&resize=cover`) ile on-the-fly üretim, sadece popup içinde küçük gösterim için. Cache otomatik. Liste sayfasında foto görünmüyor (sadece sayı: "3 foto").

---

## 6. Etiketleme Akışı (Üç-Pencere)

### 6.1 Manuel etiket (vizyon Madde 4 — etiketleme aracı)

Spool detay sayfasında "Etiketle" modu açıldığında üç pencere yan yana açılır:

```
┌────────────────┬────────────────┬────────────────┐
│  Saha fotoğraf │  İzometri PDF  │ Malzeme listesi│
│  [yüklü foto]  │  [PDF sayfa]   │  [BOM satırlar]│
│                │                │                │
│  Kullanıcı     │  Kullanıcı     │  Kullanıcı     │
│  dikdörtgen    │  dikdörtgen    │  satır seçer   │
│  çizer         │  çizer         │  (kırmızı vurgu)│
└────────────────┴────────────────┴────────────────┘
            ▼ "Etiketle" butonu
   [Kütüphane parça seçici modal]
   → DN100 WN Class 150 A105 seçilir
            ▼
   3 satır parca_etiketleri'ne yazılır
   hepsinde aynı grup_id
   etiket_tipi='manuel'
```

Bu **altın etiket grubu** — vizyon E katmanı eğitim verisinin en güçlü sinyali. Tek başına foto etiketinin 3-5 katı değerinde, çünkü model "DN100 flanş" kavramını üç açıdan birden öğrenir: görsel + çizim + metin.

### 6.2 AI önerme akışı (kanal aktifleştikten sonra)

Sonraki spool detay sayfası açıldığında, parça olgunluğuna göre arka planda öneri üretilir (5-10 sn):

```
┌────────────────┬────────────────┬────────────────┐
│  Foto          │  İzometri      │  Malzeme listesi│
│  [yarı saydam  │  [aynı renk    │  [satır 7      │
│   sarı bbox]   │   sarı bbox]   │   sarı vurgu]  │
└────────────────┴────────────────┴────────────────┘
   "Bu DN100 WN Class 150 A105 mı? — güven %87"
   [Onayla — 3 etiket]  [Tek tek incele]  [Reddet]
```

- **Onayla** → 3 etiket `etiket_tipi='onaylanmis_ai'`, yeni `grup_id`, kütüphane altın havuzu büyür
- **Reddet** → 3 etiket `etiket_tipi='reddedildi_ai'` — model debug için saklanır
- **Tek tek incele** → kutuyu yeniden çiz, parça değiştir, manuel düzelt modu

**Kritik disiplin:** Sistem ÖNERİR, kullanıcı ONAYLAR. Otomatik etiket yazma YOK. Bu vizyon belgesinin "halüsinasyon koruyucu" prensibi.

---

## 7. AI Öğrenme — Üç Kanal Stratejisi

### 7.1 Kanal 1 — Kural-tabanlı (en hızlı)

- Yöntem: malzeme listesi satırını `parser_kural` regex/fuzzy ile kütüphane satırına bağla
- Doğruluk: %30-50
- Maliyet: $0 (lokal hesap, Vercel function içinde)
- Tetik: ilk altın grup biriktiği anda (parça başına 1+ altın)
- Implementasyon: yarın yapılabilir, altyapı var (`parser_kural` JSONB zaten DB'de)

### 7.2 Kanal 2 — Görsel embedding (orta vade)

- Yöntem: foto/izometri bbox'ı CLIP gibi pretrained modelle 768-vektör → kütüphane referans vektörleriyle cosine similarity
- Doğruluk: %60-80
- Maliyet: foto başına ~0.5 ¢ (Vercel + OpenAI/Anthropic vision API çağrısı, ya da Replicate üzerinden CLIP)
- Tetik: parça başına 5+ altın grup
- Implementasyon: 6-12 ay içinde, kanal 1 stabil çalıştıktan sonra

### 7.3 Kanal 3 — Fine-tune (uzun vade)

- Yöntem: domain-specific model — 500+ altın etiket biriktikten sonra kendi modelimiz
- Doğruluk: %85+
- Maliyet: bir-kez eğitim ($500-5000 bütçe ile), sonra düşük çalıştırma
- Tetik: parça başına 50+ altın grup
- Implementasyon: 18+ ay, vizyon E katmanı

### 7.4 Paralel çalışma

Üç kanal aynı parça için aynı anda çalışır:
- Kanal 1 dedi "A105", Kanal 2 dedi "A105 %87", Kanal 3 yok → güven yüksek, öneri sun
- Kanal 1 dedi "A105", Kanal 2 dedi "F316 %60" → çelişki, kullanıcıya seçim sun
- Hiçbir kanal aktif değil → manuel etiket bekle, sistem önermez

---

## 8. Parça Başına Olgunluk — Power Law Kabulü

**81. oturumda Cihat'ın belirlediği temel sezgi:** Spool imalatı homojen değil — bazı parçalar yılda 300×, bazıları 10 yılda 1× çıkar. AI olgunluk sistem geneli değil, parça başına ölçülür.

Olgunluk eşikleri (`kutuphane_ogrenme_durumu` view'inde):

| Eşik | Olgunluk | Pratik anlamı |
|---|---|---|
| 0 altın grup | `yok` | Manuel etiket zorunlu, sistem önermez |
| 1+ altın grup | `kural` | Kanal 1 aktif, %30-50 güvenli öneri |
| 5+ altın grup | `embedding` | Kanal 2 aktif, %60-80 güvenli öneri |
| 50+ altın grup | `finetune` | Kanal 3 aktif (model eğitildiyse), %85+ |

Pratik tablo (gemi spool projeleri tipik karışım):

| Parça | Yıllık görülme | 50 altın etikete ulaşma | Aktif kanal (orta vadede) |
|---|---|---|---|
| DN100 WN A105 (her geminin omurgası) | 300-500× | ~1-2 ay | `finetune` |
| DN50 WPB 90LR | 80-120× | ~6 ay | `finetune` |
| DN200 SO Class 300 | 15-25× | ~2 yıl | `embedding` |
| DN15 SW A350 Class 600 | 0-2× | ~hiç | `kural` veya manuel |

**Bazı parçalar AI olgunluğa hiç ulaşmaz, sorun değil.** Manuel etiket de altın veridir, fine-tune'a katkı verir. Kütüphane "tamamlanması gereken liste" değil, "kullanım gördükçe büyüyen organik depo".

Eşik rakamları (1 / 5 / 50) **tartışmaya açık**, gerçek veriye göre ileride ayarlanır. Yapı doğru olduktan sonra eşik bir UPDATE.

---

## 9. Geometrik Kaynak Eşleştirme (3D + Ölçüm)

Vizyon Kategori C'deki "tetik koşullu" işler. Şimdi mimari hazırlanır, tetik gelince geliştirme 1-2 oturum sürer (6 ay değil).

### 9.1 STEP / Rhino solid eşleştirmesi

**Bu güçlü bir fırsat çünkü AI değil, deterministik geometri matching.**

- Yöntem:
  1. STEP parser (opencascade.js — WebAssembly, Vercel'de çalışabilir) her solid'i ayırır
  2. Her solid için ölçüt vektörü: bounding box, hacim, yüzey alanı, eksen vektörü, simetri tipi
  3. Vektör kütüphane parçalarıyla tolerans karşılaştırması (±%2-5)
  4. Eşleşirse → `parca_etiketleri` satırı: `kaynak_tipi='step_solid'`, `ai_kanal='geometri'`
- Doğruluk: %90+ standart parçada
- Maliyet: $0 (lokal hesap)
- Tetik: vizyon Kategori C — *"STEP veren ilk müşteri çıkınca"*
- Implementasyon süresi: 1-2 oturum (mimari hazırsa)

**Kanal-bağımsızlık:** STEP eşleştirmesi sık/nadir ayrımı GÖZETMEZ. Kütüphane satırı bugün var ise yarın STEP geldiğinde eşleşebilir. Power law sınırlamasından muaf.

Rhino özel durumu: `.3dm` parser karmaşık. Pratik çözüm: Rhino dosyası gelirse otomatik STEP'e dönüştür (Rhino native export) → STEP pipeline'ına gir. İki parser yazılmaz.

### 9.2 Yan kazanımlar (STEP entegrasyonu gelirse)

- **3D rendering kalitesi:** Three.js mevcut sahnesi STEP konumlarıyla mükemmel çalışır. Mevcut "AI yön çıkarımı" iş borcu (vizyon Kategori B, 2-3 oturum tahmin) STEP veren müşterilerde **potansiyel olarak gereksiz** kalır.
- **Otomatik BOM:** STEP içindeki tüm solid'ler → kütüphane eşleşmesi → ağırlıklı malzeme listesi. İnsan veri girişi sıfır.
- **Çapraz validasyon:** izometri parser çıktısı vs STEP içindekiler. Tutarsızlık → uyarı. Vizyon Madde 7 (görsel hata tespiti) bu yolla 18 ay beklemeden çalışır.
- **Tier modeli:** STEP veren tersane "Tier 3" sınıfına girer, premium fiyat. Vizyon Kategori C'deki tier tetikleri ile uyumlu.

### 9.3 Lazer nokta bulutu

- Yöntem:
  1. RANSAC ile silindir/tor/düzlem primitive fitleme (her boru bir silindir, her dirsek bir tor segment)
  2. Çıkan primitive → çap + uzunluk + eksen yönü
  3. Tolerans karşılaştırması ile kütüphane bul
  4. Sapma raporu: tasarımda DN100 (114.3mm) yazıyor, saha 102mm okuyorsa → as-built uyarı
- Doğruluk: %70-85
- Tetik: vizyon Madde 21 — fotogrametri ile boyut kontrolü, vizyon E katmanı
- Önkoşul: QR ölçek altyapısı (vizyon Madde 16) — **bugünden** `ayarlar.html` tenant bazlı QR fiziksel boyut tanımı eklenmeye başlanabilir
- Implementasyon süresi: 18+ ay

### 9.4 AR seçim

- Yöntem: AR ekranda parçaya bakıp dokun → embedding (Kanal 2'nin görsel kanalı) AR'a çıkarılır
- Doğruluk: %60-80 (görsel)
- Tetik: vizyon F+ — şu an yok
- Schema etkisi: `parca_etiketleri.kaynak_tipi='ar_secim'` günü gelince eklenir, mimari engel YOK

### 9.5 Schema etkisi — minimum

Schema yukarıda zaten 3D'yi destekliyor:
- `parca_etiketleri.kaynak_tipi` enum'da `step_solid`, `lazer_segment`, `ar_secim` var
- `bbox_jsonb` polimorfik: 2D bbox, 3D AABB/OBB, lazer primitive, malzeme satır — hepsi aynı alanda

Yeni tablo açılmıyor.

---

## 10. Vizyon Belgesi ile Çapraz Referans

Bu tasarım belgesinin vizyon haritasındaki yeri:

| Vizyon maddesi | Bu belgenin katkısı |
|---|---|
| `VIZYON-VE-MODULER-MIMARI.md` Bölüm 2.A — Parça Kimliği Prensibi | Görsel + 3D kimliğin altyapısı (`kutuphane_ekler`, `parca_etiketleri`) |
| `SPOOL-AI-VIZYON.md` Madde 4 — Etiketleme aracı | Üç-pencere manuel etiketleme akışı (bölüm 6.1) |
| Madde 7 — Görsel hata tespiti | STEP çapraz validasyon (bölüm 9.2), AI önerme reddi sinyali |
| Madde 11 — Operasyonel pipeline | `parca_etiketleri` ML-uyumlu kayıt, `egitim_verisi_pipeline` ile entegre |
| Madde 13 — 3D montaj aracı | STEP solid eşleştirmesi 3D rendering kalitesini yükseltir (bölüm 9.2) |
| Madde 14 — Halka açık eğitim oyunu | `paylasim='public'` enum değeri saklı, vizyon tetiklenince hazır |
| Madde 16 — QR ölçek altyapısı | Lazer nokta bulutu önkoşulu (bölüm 9.3) |
| Madde 19 — Görsel parça tanıma | Kanal 3 fine-tune (bölüm 7.3) |
| Madde 20 — İzometri-foto hata tespiti | Altın etiket grupları (`grup_id` üçlü etiket) bu modelin eğitim verisi |
| Madde 21 — QR fotogrametri ile boyut kontrolü | Lazer pipeline'ı (bölüm 9.3) |
| Vizyon Kategori C — STEP entegrasyon tetiği | Bölüm 9.1 mimari altyapısı, tetik gelince 1-2 oturum implementasyon |
| Vizyon Kategori C — Tier modeli | STEP veren tersane Tier 3 sınıfı (bölüm 9.2) |

---

## 11. Implementasyon Takvimi

| Faz | Ne | Önkoşul | Süre |
|---|---|---|---|
| **81 (bugün)** | Tasarım belgesi (bu dosya) | — | ✓ |
| **82** | `admin/kutuphane.html` ana sayfa + tek detay sayfa (salt-okunur) | Mockup onaylandı | 1 oturum |
| **83** | `kutuphane_ekler` migration + detay sayfa "Ekler" sekmesi (salt-okunur liste, popup gösterim) | 82 ✓ | 1 oturum |
| **~85-90** | `parca_etiketleri` migration + üç-pencere manuel etiketleme UI | Kütüphanede 100+ parça referans foto biriktiğinde | 2-3 oturum |
| **~90-100** | `kutuphane_ogrenme_durumu` view + parça başına olgunluk badge | Manuel etiketleme akışı çalışıyor | 1 oturum |
| **~3 ay sonra** | Kanal 1 (kural-tabanlı öneri) — parça başına | İlk 50-100 spool girildi, sık parçalarda 5+ altın grup birikti | 1-2 oturum |
| **~6-12 ay** | Kanal 2 (embedding) — sık parçalar için CLIP entegrasyonu | Kanal 1 stabil, parça başına 5+ altın grup | 2-3 oturum |
| **~12-18 ay** | Kanal 3 (fine-tune) — üst %5 parçalar için | 50+ altın grup, model bütçesi onayı | Birden fazla oturum |
| **Tetik gelince** | STEP/Rhino entegrasyonu — opencascade.js + solid eşleştirme | Vizyon Kategori C tetiği: STEP veren ilk müşteri | 1-2 oturum |
| **18+ ay** | Lazer nokta bulutu — RANSAC primitive fitleme | QR ölçek altyapısı + 5+ aktif müşteri | Birden fazla oturum |
| **F+ (uzak)** | AR seçim | Vizyon F katmanı tetiklenirse | — |

**Hiçbiri zaman bazlı değil, sinyal bazlı.** Sinyal gelmezse iş başlamaz, sinyal gelirse altyapı zaten hazır olduğu için hızlı eklenir. Bu vizyon belgesinin temel prensibi.

---

## 12. Açık Sorular (Sonraki Oturumlarda Karar Verilecek)

1. **Olgunluk eşikleri (1/5/50):** İlk 6 ay veri biriktikten sonra bu eşikler gerçek davranışa göre ayarlanır. Tartışmaya açık.
2. **CLIP modeli seçimi:** Kanal 2 için OpenAI CLIP, Anthropic vision API, ya da self-hosted (Replicate üzerinden) — maliyet/doğruluk karşılaştırması Kanal 2 gelirken.
3. **Fine-tune modeli seçimi:** Vision Transformer base mı, daha spesifik bir görsel model mi — Kanal 3 yaklaşırken karar.
4. **Embedding refresh stratejisi:** Kütüphane satırı güncellenirse mevcut embeddings invalidate olur mu? — Kanal 2 implementasyonunda.
5. **Lisans denetim akışı:** `belirsiz` lisansların `firma_sahibi`'ye terfi'i için süper admin onay UI'ı — `paylasim` terfi işlemleri başlatıldığında.
6. **Storage temizliği:** `aktif=false` kayıtları storage'dan ne zaman silinecek? (90 gün soft delete + cron temizlik?)
7. **Rhino .3dm direkt parser:** STEP dönüştürme yeterli olmazsa, kendi .3dm parser'ı yazılır mı?

---

## 13. Bu Belgenin Dışında Kalanlar (Kasıtlı)

- **Mobil React tarafında etiketleme UI:** İleride mobilde de etiketleme yapılabilir mi? Belki, ama şu an web tarafı önceliği.
- **3D viewer (Three.js) entegrasyonu:** STEP solid'leri Three.js'te göstermek — mevcut spool detay 3D sekmesi var, oraya entegre. Bu belge oraya değiniyor ama detay vermiyor.
- **Veri ihracı (BOM Excel, eğitim seti zip):** Altın etiket havuzunu dışarı alma akışı — vizyon F (belgeleme) kapsamında, ayrı belge gerekir.

---

> Bu belge yaşayan dosya. Schema değişiklikleri burada izlenir, vizyon belgesiyle çapraz referans korunur. Her oturumda kararı etkileyen yeni bilgi çıkarsa buraya not düşülür, son güncelleme tarihi değişir.
>
> **Son güncelleme:** 13 Mayıs 2026 — 81. oturum (kuruluş)
