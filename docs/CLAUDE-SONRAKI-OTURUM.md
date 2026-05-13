# CLAUDE-SONRAKI-OTURUM — 85. Oturum Gündemi

> Bu dosya 85'in açılışında okunacak. Birlikte: `.github/son-durum.md` + `docs/CLAUDE-SON-OTURUM.md`.

---

## 85. Oturum Ana Tema

**Uç işlemi sözlük katmanı + spool ↔ kütüphane standart gösterimi tam akışı.**

84'te KARAR-83.2'nin DB tarafı uygulandı (uc_a_islemi/uc_b_islemi kolonları + 36 Victaulic migrate). Sonra spool_detay'a Standart sütunu eklenirken altyapı tasarımı tetiklendi:
1. Boru için Standart sütunu canlıda (v4)
2. Fitting/flansh için kolon adı `geometri_std` (farklı şema, v5'te eklenecek)
3. Uç işlemleri (yiv/bevel/yaka) standartlarının nereye yazılacağı: **sözlük tablosu + FK pattern'i** kararı verildi
4. Tanımsız ölçüler için öneri akışı placeholder hâlinde (gerçek DB tablosu 85'te)

85'te bunların hepsi DB + frontend uygulamasıyla kapatılır.

---

## Açılış Ritüeli

```
Oturum başlangıç ritüeli. 2 kısa kontrol:

1. cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -3

2. Bugün ne yapmak istiyorsun? (Önerilen: 85.A → 85.B → 85.C → 85.D sırası)
```

`son-durum.md`, `CLAUDE-SON-OTURUM.md`, `CLAUDE-SONRAKI-OTURUM.md` okunur. Sonra 85.A'ya başlanır.

---

## 85.A — Migration 058: `uc_islemi_tipleri` sözlük tablosu (~15 dk, öncelik 1)

KARAR-84.1'in DB tarafı.

### Şema

```sql
CREATE TABLE uc_islemi_tipleri (
  kod              TEXT PRIMARY KEY,
  ad_tr            TEXT NOT NULL,
  ad_en            TEXT,
  varsayilan_std   TEXT,
  alternatif_std   JSONB DEFAULT '[]'::jsonb,
  kategori         TEXT,
  aktif            BOOLEAN DEFAULT true,
  sira             INT,
  aciklama         TEXT,
  olusturma_at     TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE uc_islemi_tipleri ENABLE ROW LEVEL SECURITY;
CREATE POLICY "uc_islemi_select_all" ON uc_islemi_tipleri FOR SELECT USING (true);
CREATE POLICY "uc_islemi_super_admin_only" ON uc_islemi_tipleri
  FOR ALL USING (
    EXISTS (SELECT 1 FROM kullanicilar
            WHERE id = auth.uid() AND rol = 'super_admin')
  );

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE uc_islemi_tipleri;
```

### Seed (KARAR-84.1 + KARAR-84.4)

| sira | kod | ad_tr | ad_en | varsayilan_std | kategori | aciklama |
|---|---|---|---|---|---|---|
| 1 | `plain` | Düz | Plain | — | — | Boru ucu kesimsiz/düz |
| 2 | `bevel` | Kaynak Ağzı | Beveled End | ASME B16.25 | kaynakli | Buttwelding ağzı |
| 3 | `socket` | Soket Kaynak | Socket Weld | ASME B16.11 | kaynakli | Soket içine yerleştirilen uç |
| 4 | `threaded` | Vida Dişi | Threaded | ASME B1.20.1 | disli | NPT diş (alternatif: ISO 7-1 BSPT) |
| 5 | `groove_victaulic` | Victaulic Yiv | Victaulic Groove | ANSI/AWWA C606 | mekanik | Yiv açılarak Victaulic kelepçe ile bağlanır |
| 6 | `yaka_formlu` | Yaka (Form Verilmiş) | Formed Lap End (Vanstone) | MSS SP-43 | flansli | Borunun ucuna makinayla form verilerek oluşturulan yaka; loose lap joint flange ile kullanılır. Fabrika yapımı stub end (Type A/B) ile karıştırılmamalı. |

### Migration dosyası adı

`058_uc_islemi_tipleri_sozluk.sql`

### Doğrulama SELECT'leri (migration sonu)

```sql
SELECT count(*) AS toplam FROM uc_islemi_tipleri;  -- beklenen: 6
SELECT kod, ad_tr, varsayilan_std FROM uc_islemi_tipleri ORDER BY sira;
```

---

## 85.B — Migration 059: spool_malzemeleri 4 yeni kolon + CHECK → FK (~10 dk)

KARAR-84.5'in DB tarafı (müşteri raw metni saklanır).

### Plan

```sql
ALTER TABLE spool_malzemeleri
  ADD COLUMN IF NOT EXISTS uc_a_aciklama TEXT,
  ADD COLUMN IF NOT EXISTS uc_b_aciklama TEXT,
  ADD COLUMN IF NOT EXISTS uc_a_std      TEXT,
  ADD COLUMN IF NOT EXISTS uc_b_std      TEXT;

-- Önce mevcut CHECK constraint'i kaldır
ALTER TABLE spool_malzemeleri DROP CONSTRAINT IF EXISTS spool_malzemeleri_uc_islemi_chk;

-- FK ekle (sözlük tablosu zaten 058'de yaratıldı + seed'lendi)
ALTER TABLE spool_malzemeleri
  ADD CONSTRAINT spool_malzemeleri_uc_a_fk
    FOREIGN KEY (uc_a_islemi) REFERENCES uc_islemi_tipleri(kod)
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT spool_malzemeleri_uc_b_fk
    FOREIGN KEY (uc_b_islemi) REFERENCES uc_islemi_tipleri(kod)
    ON DELETE SET NULL ON UPDATE CASCADE;

COMMENT ON COLUMN spool_malzemeleri.uc_a_aciklama IS 'Musteri raw metni (orneklerde gelen aciklama)';
COMMENT ON COLUMN spool_malzemeleri.uc_a_std IS 'Standart override - NULL ise sozlukten varsayilan_std gelir (KARAR-84.5)';
```

### Doğrulama

```sql
-- 36 Victaulic kaydı groove_victaulic koduna FK ile baglanmali (zaten oyle)
SELECT count(*) FROM spool_malzemeleri WHERE uc_a_islemi = 'groove_victaulic';  -- beklenen: 36
-- FK constraint test: gecersiz kod insert edilemez
-- INSERT INTO spool_malzemeleri (..., uc_a_islemi) VALUES (..., 'YOK_OLAN_KOD');
-- ERROR: violates foreign key constraint
```

---

## 85.C — Frontend spool_detay v5 (~30 dk)

Standart sütunu **alt satırlar** ile uç işlemi bilgisi gösterir.

### SELECT cümlesi güncelleme

```js
.select('*, spool_malzemeleri(
  id, tip, tanim, malzeme, kalite, dis_cap_mm, et_mm, boy_mm,
  agirlik_kg, sertifikali, heat_no,
  malzeme_ref_id, boru_olculer_id, fitting_olculer_id, flansh_olculer_id,
  uc_a_islemi, uc_b_islemi, uc_a_aciklama, uc_b_aciklama, uc_a_std, uc_b_std,
  malzeme_tanimlari(kategori_kod, kalite_kod, kalite_goster, standart, tenant_id),
  boru_lib:boru_olculer_id(standart, schedule_kod),
  uc_a_tip:uc_a_islemi(ad_tr, varsayilan_std),
  uc_b_tip:uc_b_islemi(ad_tr, varsayilan_std)
), fotograflar(...), belgeler(...), devreler(...)')
```

### MAP'e yeni alanlar

```js
uc_a_islemi:    m.uc_a_islemi || null,
uc_b_islemi:    m.uc_b_islemi || null,
uc_a_aciklama:  m.uc_a_aciklama || '',
uc_b_aciklama:  m.uc_b_aciklama || '',
uc_a_std_eff:   m.uc_a_std || (m.uc_a_tip ? m.uc_a_tip.varsayilan_std : ''),
uc_b_std_eff:   m.uc_b_std || (m.uc_b_tip ? m.uc_b_tip.varsayilan_std : ''),
uc_a_ad:        m.uc_a_tip ? m.uc_a_tip.ad_tr : '',
uc_b_ad:        m.uc_b_tip ? m.uc_b_tip.ad_tr : '',
```

### TBODY render — Standart hücresinde 3 satırlı yapı

```js
// Ana satır: boru/fitting/flansh std (mevcut v4 davranisi)
var ucAlt = '';
// Uc A: gosterilecek mi? (plain veya null disindaysa)
if(m.uc_a_islemi && m.uc_a_islemi !== 'plain'){
  var ucAGoster = m.uc_a_aciklama || m.uc_a_ad;  // raw varsa raw, yoksa ad_tr
  var ucAStdEk  = m.uc_a_std_eff ? ' <span style="color:var(--txd);">(' + esc(m.uc_a_std_eff) + ')</span>' : '';
  ucAlt += '<div style="font-size:11px;color:var(--txm);">↳ A: ' + esc(ucAGoster) + ucAStdEk + '</div>';
}
// Uc B: aynisi
if(m.uc_b_islemi && m.uc_b_islemi !== 'plain'){
  // ...
}
// Hucre icerik: ana satir + ucAlt
stdGoster = stdGoster + ucAlt;
```

### Test spool'ları

- `00d4926d` (S07) — bir borunun uc_a_islemi='groove_victaulic' olmali, alt satirda "Yiv A: Victaulic Yiv (ANSI/AWWA C606)" gorunmeli
- Migration 057 sonrasi 36 boru groove_victaulic'e set edildi, hepsinde alt satir gorunecek
- Plain veya null uc'lar alt satir gostermez

---

## 85.D — fitting/flansh Standart sütunu (v6) (~20 dk)

84'te kesfedilen sema:
- `fitting_olculer.geometri_std` (kolon adi farkli, `standart` degil)
- `flansh_olculer.geometri_std` + `flansh_tipi` + `basinc_sinifi`

### SELECT'e nested join

```js
fitting_lib:fitting_olculer_id(geometri_std, parca_tipi, class_no),
flansh_lib:flansh_olculer_id(geometri_std, flansh_tipi, basinc_sinifi)
```

### MAP'te tip-bagimli geom belirleme

```js
var geom;
var geom_extra = '';
if(m.tip === 'boru' && m.boru_lib){
  geom = m.boru_lib.standart;
  geom_extra = m.boru_lib.schedule_kod || '';
} else if(m.tip === 'fitting' && m.fitting_lib){
  geom = m.fitting_lib.geometri_std;
  geom_extra = m.fitting_lib.parca_tipi || '';
} else if(m.tip === 'flansh' && m.flansh_lib){
  geom = m.flansh_lib.geometri_std;
  geom_extra = (m.flansh_lib.flansh_tipi || '') + ' ' + (m.flansh_lib.basinc_sinifi || '');
} else {
  geom = null;
}
```

Bu degisiklik sonrasi 11 flansh + 43 fitting'in de Standart sutunu dolar (varsa).

---

## 85.E — Tanımsız malzeme öneri akışı DB tarafı (~1 saat)

KARAR-84.2'nin DB tarafı.

### `tanimsiz_malzeme_onerileri` tablosu

```sql
CREATE TABLE tanimsiz_malzeme_onerileri (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  spool_malzeme_id    UUID REFERENCES spool_malzemeleri(id) ON DELETE SET NULL,
  tip                 TEXT NOT NULL,  -- 'boru' | 'fitting' | 'flansh'
  ham_data            JSONB NOT NULL, -- {dis_cap, et, kalite, tanim, ...}
  hash_anahtari       TEXT NOT NULL,  -- normalize edilmis benzersiz tanimlayici
  kullanici_sebep     TEXT,           -- 'kutuphanede_eksik' | 'standart_disi' | 'veri_hatasi'
  kullanici_aciklama  TEXT,
  kullanici_id        UUID REFERENCES kullanicilar(id),
  siklik_sayisi       INT DEFAULT 1,  -- ayni hash icin tekrar tetiklerse artar
  durum               TEXT DEFAULT 'bekliyor', -- 'bekliyor'|'onaylandi'|'reddedildi'|'tenant_ozel'
  super_admin_id      UUID REFERENCES kullanicilar(id),
  karar_zamani        TIMESTAMPTZ,
  karar_notu          TEXT,
  olusturma_at        TIMESTAMPTZ DEFAULT now(),
  guncelleme_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE (tenant_id, hash_anahtari)
);

-- hash_anahtari ornek: 'boru|139.70|4.500|St 37|karbon' (normalize)
-- UNIQUE ile ayni teklif tek satira toplanir, siklik_sayisi artirilir
```

RLS: tenant kendi onerilerini gorur+yazar, super_admin tumunu gorur+karar verir.

### Frontend `tanimsizModalAc` upgrade

confirm() placeholder yerine gercek modal:
- Form: kullanici_sebep dropdown (3 secenek), kullanici_aciklama textarea
- INSERT veya UPSERT (ayni hash varsa siklik_sayisi += 1)
- Toast: "Oneri alindi - super admin onayina gonderildi"

### `arespipe_hash_anahtari` SQL fonksiyonu

Tip ve ana ozelliklere gore normalize hash uret (yazim farkliliklarini eler).

---

## 85.F — Süper admin paneli `admin/oneriler.html` (~2 saat, ayrı oturum olabilir)

KARAR-84.2'nin UI tarafı.

### Yapı

- Sidebar'a "Öneriler" linki (super_admin only)
- Üst: 4 metric kart (Bekleyen / Bu Hafta Gelen / Toplam Onaylanan / Reddedilen)
- Filtre çubuğu: Durum / Tip / Tenant / Sıklık
- Tablo:
  - Sıklık rozeti (kaç tenant'tan / kaç spool'da)
  - Ham veri özeti (tip, dis_cap, et, kalite, tanim)
  - Kullanıcı sebebi
  - 3 buton: **Sisteme Ekle** | **Tenant-Özel Onayla** | **Reddet**
- Detay popup: tam ham_data jsonb, ilgili spool linki, kullanıcı bilgisi

### Karar sonrası eylem

- **Sisteme Ekle**: ilgili kütüphane tablosuna INSERT (`sistem_preset=true, tenant_id=NULL`) + tanimsiz_malzeme_onerileri.durum='onaylandi'
- **Tenant-Özel Onayla**: kütüphaneye INSERT (`sistem_preset=false, tenant_id=öneren tenant`) + durum='tenant_ozel'
- **Reddet**: durum='reddedildi' + karar_notu zorunlu (kullanıcıya neden gösterilir)

Tüm üçü için: ilgili `spool_malzemeleri.boru/fitting/flansh_olculer_id` UPDATE (FK kalıcı olur, satır mavi olur, turuncu rozet kalkar).

---

## 85 İçin Hatırlatmalar

- **MK-84.1** — Migration'lar Supabase Studio'da çalıştırıldıktan sonra **aynı oturumda** repo'ya commit edilir. Kapanışta `git status` zorunlu.
- **MK-84.2** — Yeni nested join eklerken `information_schema.columns` ile şema doğrulanır. 85.D'de fitting/flansh için bu kural kritik.
- **MK-84.3** — Aggregate sorgu sonuçlarından inference yapmadan önce detay sorgusu çalıştırılır.
- **MK-84.4** — Uç işlemleri sözlük tablosu + FK ile yönetilir, CHECK enum büyütmek yok.
- **MK-84.5** — Müşteri raw metni saklanır (`uc_a_aciklama`), arka planda kanonik kodla eşleştirilir.
- **MK-83.1** İki boyutlu standartlık (KARAR-83.1) — yeni rapor/yayın endpoint'inde bu filtre uygulanmalı
- **MK-83.4** — Supabase UPDATE sonrası `count(*) FILTER (WHERE fk IS NOT NULL)` ile gerçek etki doğrula

---

## 86+ Genel Yön

- **86** — Public kütüphane sayfası (`arespipe.com/kutuphane`, sistem_preset=true filtresi)
- **87+** — `parca_etiketleri` + üç-pencere etiketleme UI
- **88+** — `kutuphane_ogrenme_durumu` materialized view
- **89+** — İzometri parser KARAR-83.2 uygulaması (Victaulic-türü kayıtlar uç işlemi olarak çıkar)
- **90+** — `spool_flansh_eslesme` junction DROP
- **91+** — Diğer uç işlemleri (lazer, threaded varyantları, expanded taper, vb.) sözlüğe eklenecek tipler

---

## Bonus İşler (85'te zaman kalırsa)

- Migration 060: uc_a_std back-fill (mevcut 36 groove_victaulic kaydına `uc_a_std='ANSI/AWWA C606'` set et — opsiyonel, sözlük varsayılanı zaten gelir)
- KUTUPHANE-YUKLEME-TAKIP.md'ye 139.70×4.5 ölçüsü için tenant-özel ekleme örneği (85.F sonrasında ilk gerçek vaka)
- 60.30×6.3 boş 2 kalemin tanısı (kütüphanede var, 056 neden bağlamadı)
- 114.30×null boş 1 kalemin tanısı (eksik veri tespiti)
- `tanimsizModalAc` modal'a "Önce kütüphaneye baktım, gerçekten yokmuş" tipinde otomatik kontrol (sözlük + tolerans)

---

## Storage / Test Spool ID'leri

- `00d4926d-5bcf-472c-96af-0447d9feb045` (S07) — 84.A'da Victaulic migrate edildi, parent boru groove_victaulic almali
- `01485adf-aead-49b2-9734-00113053223d` (S10) — 84.E test edildi, 5 kalem
- `9911dc39-f826-4eb9-89aa-cdb40253edb1` — 3 kalem hepsi St 37
- `88114af4-38bf-4b22-aa75-04c29e80e830` — boru kesit modal DN50 60.3×4.5

85'te 85.C uygulanınca bu spool'larda Standart hücresinin alt satırında uç işlemi bilgisi görünmeli.

---

> 85. oturum açılışında bu dosya, `.github/son-durum.md` ve `docs/CLAUDE-SON-OTURUM.md` okunur. Sonra Cihat'a "85.A migration ile başlayalım mı?" sorusu sorulur (gündem kilitli, açılış sorusu standart).
