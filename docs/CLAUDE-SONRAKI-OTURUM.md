# CLAUDE-SONRAKI-OTURUM — 90. Oturum Gündemi

> 89'dan gelen plan. Öncelik sırası, açılış kontrolleri, somut adımlar.

---

## Açılış Ritüeli (CLAUDE.md'den)

90 başlangıcında Cihat'a 2 kontrol:

```
1. cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -3
2. Bugün ne yapmak istiyorsun? (Kaldığımız yerden, yeni konu, vb.)
```

Cevap geldikten sonra Claude şu dosyaları okur:
- `son-durum.md` (89 kapanışı)
- `docs/CLAUDE-SON-OTURUM.md` (detaylı 89 özeti)
- Bu dosya (`CLAUDE-SONRAKI-OTURUM.md`)
- `docs/KUTUPHANE-VERI-BESLEME-VIZYONU.md` (89'da yazılan ana vizyon belgesi)

---

## Önce Yapılması Gereken — DB Schema Doğrulama (10 dk)

89'da yazılan 3 sayfa (`kutuphane-malzemeler`, `kutuphane-standartlar`, `kutuphane-detay`) şu DB kolonlarını **varsayıyor**:

- `boru_olculer.malzeme_grubu_kod` (text)
- `boru_olculer.standart` (text)

Canlı testte sayfalar açılınca:
- **Kolon varsa** → veriler düzgün gelir, sayfalar çalışır
- **Kolon yoksa** → "Kolon yok, sayfalar boş" uyarısı görünür (MK-89.B hata dayanıklılığı)

Test komutu:

```bash
# Lokal Supabase yoksa, prod test:
# 1. Vercel'de deploy bekle
# 2. https://arespipe.vercel.app/admin/kutuphane.html'i aç
# 3. "Borular" kartına tıkla → /admin/kutuphane-malzemeler.html?tablo=boru_olculer
# 4. Console'da hata var mı bak
# 5. Karbon grubuna tıkla → standartlar geliyor mu
# 6. Bir standarda tıkla → tek tablo açılıyor mu
```

Eğer kolonlar yoksa migration gerekli. Önerilen migration adı:
`065_boru_olculer_malzeme_grubu_standart_kolonlari.sql`

İçerik:
```sql
ALTER TABLE boru_olculer ADD COLUMN IF NOT EXISTS malzeme_grubu_kod TEXT;
ALTER TABLE boru_olculer ADD COLUMN IF NOT EXISTS standart TEXT;

-- Aynı diğer tablolar için
ALTER TABLE fitting_olculer ADD COLUMN IF NOT EXISTS malzeme_grubu_kod TEXT;
ALTER TABLE fitting_olculer ADD COLUMN IF NOT EXISTS standart TEXT;
ALTER TABLE flansh_olculer ADD COLUMN IF NOT EXISTS malzeme_grubu_kod TEXT;
ALTER TABLE flansh_olculer ADD COLUMN IF NOT EXISTS standart TEXT;

-- Mevcut veri backfill (manuel veya RPC ile) — boru_olculer için örnek
-- UPDATE boru_olculer SET standart = 'ASME B36.10M' WHERE et_mm IS NOT NULL AND malzeme_grubu_kod IS NULL;
-- ...
```

Migration **opsiyonel** — Cihat canlı testte gerek görürse yapılır.

---

## Ana Öncelik Sırası (90 için)

### Öncelik 1 — 89.A: kutuphane-oneriler.html Refactor (60 dk)

88'den kalan iş. Mevcut dosya (88'de yazılan) AresPipe pattern'ine uymuyor (script 404, sidebar yok, CSS palette yüklenmiyor).

**Yapılacak:**
- Sıfırdan yaz (mevcut 250 satır → ~400 satır AresPipe pattern'iyle)
- Pattern: `admin/kutuphane.html` referans (89'da 3 sayfa yaptık, aynı pattern)
- URL: aynı kalır (`admin/kutuphane-oneriler.html` — Katman 1'den özel kart link'i)
- RPC: `v_tanimsiz_havuz_listele()` (88.A'da canlıya alındı)
- İçerik: tanımsız malzeme havuzu listesi, sıklığa göre sıralı
- Olgunluk göstergesi placeholder (90+'da kutuphane_medya tablo)

**Tahmini süre:** 45 dk yazma + 15 dk lokal test

### Öncelik 2 — 89.B: 88.G Detay Paneli + Özel Parça Formu (90 dk)

88.A'da `ozel_parca_boru_kaydet()` RPC canlıda. Frontend tarafı yok.

**Yapılacak:**
- Katman 4 (`kutuphane-detay.html`) içinde aksiyon butonu "⊕ Yeni ölçü" aktif edilir
- Tıklanınca modal açılır: form (dn, schedule, dış çap, et, ağırlık-auto-hesap)
- Submit → `ozel_parca_boru_kaydet()` RPC çağrı
- Sonuç: yeni satır tabloya eklenir, toast

VEYA mevcut tanımsız havuz sayfasında (`kutuphane-oneriler.html`) listedeki satıra tıklayınca yan panel açılır + form. Hangisi daha doğru görünüyorsa Cihat'a sorulacak.

**Tahmini süre:** 60-90 dk

### Öncelik 3 — Katman 4 Fitting/Flanş Kolon Konfigi (60 dk)

89'da sadece boru için `TABLO_KONFIG.boru_olculer.kolonlar` dolu. Fitting/flanş için boş, "konfig yok" uyarısı görünüyor.

**Yapılacak:**
- `fitting_olculer` için kolon listesi (örn: NPS, dn, tip_kod, A, B, ağırlık)
- `flansh_olculer` için kolon listesi (örn: NPS, dn, sinif, OD, civata_sayisi, civata_capi, vb.)
- Her biri için panel-lejant + SVG kesit tipi
- SVG kesit yer tutucusu (fitting için elbow, flanş için flanş kesit)

**Tahmini süre:** 45-60 dk

### Öncelik 4 — `kutuphane_medya` Migration + UI Bağlama (2 saat)

Vizyon belgesi Bölüm 5'teki polymorphic medya tablosu.

**Yapılacak:**
1. Migration `065_kutuphane_medya.sql` (veya sonraki numara)
2. Storage bucket (Supabase Storage) konfigürasyonu
3. RLS politikaları
4. Katman 4'te aksiyon butonları aktif (foto yükle, 3D yükle, DXF yükle)
5. Satır seviyesinde olgunluk badge'leri canlı (`📷 0/1`, `🎲 0/1`, `📐 0/1`)
6. Standart geneli "Ek Dosyalar" özeti canlı

**Tahmini süre:** 2 saat. 90'da yapılabilir veya 91'e kayar.

---

## İkincil İşler (90'da zaman kalırsa)

- **STANDART_KATALOG markdown'a taşıma** — Kod-içi sabit yerine `docs/KUTUPHANE-STANDART-KATALOG.md` fetch + parse. `kutuphane.html`'da `KUTUPHANE-YUKLEME-TAKIP.md` parse pattern'i var, referans alınabilir.
- **CI uyarıları temizlik** — 38 uyarı (88'den kalan). i18n eksik `tv()` çağrılarına lang dosyalarında anahtar ekleme.

---

## Kritik Hatırlatmalar (89 + öncesi)

- **MK-89.D:** Vizyon parçaları netleştiğinde mutlaka yazılı belge (`docs/*-VIZYON*.md`).
- **MK-89.B:** Yeni DB kolonu varsayan UI → hata dayanıklılığı (404/column-not-exist).
- **MK-89.A:** Admin sayfa pattern → inline `getSession → select rol → appShell visibility`.
- **MK-88.D:** Yeni admin sayfası → referans admin sayfasını gör (`admin/kutuphane.html`).
- **MK-88.C:** SECURITY DEFINER RPC'leri SQL Editor'da test edilemez (`auth.uid()=NULL`).
- **MK-88.B:** CHECK constraint vs vizyon çakışması → ikisini buluştur.
- **MK-52.x:** `~/Downloads/_arsiv/` disiplin, MD5 doğrulama, terminal git akışı.

---

## DB Operasyonları (90'da gerekirse)

```sql
-- Katman 2/3/4 sayfalar için varsayılan kolonlar
ALTER TABLE boru_olculer ADD COLUMN IF NOT EXISTS malzeme_grubu_kod TEXT;
ALTER TABLE boru_olculer ADD COLUMN IF NOT EXISTS standart TEXT;
-- fitting_olculer, flansh_olculer için aynı
```

```sql
-- Kütüphane medya tablosu (vizyon belgesi Bölüm 5)
CREATE TABLE kutuphane_medya (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hedef_tablo TEXT NOT NULL,
  hedef_id UUID NOT NULL,
  tip TEXT NOT NULL,  -- 'foto' | '3d' | 'dxf' | 'svg'
  dosya_url TEXT NOT NULL,
  kaynak TEXT NOT NULL,  -- 'manuel' | 'mobile_etiketleme' | 'imalat_foto' | 'step_parse'
  kaynak_referans TEXT,
  guven_yuzde INT,
  tenant_id UUID,
  yukleyen_id UUID,
  olusturma_at TIMESTAMPTZ DEFAULT NOW(),
  meta JSONB
);

CREATE INDEX idx_kutuphane_medya_hedef ON kutuphane_medya (hedef_tablo, hedef_id);
CREATE INDEX idx_kutuphane_medya_tip ON kutuphane_medya (hedef_tablo, tip);

-- RLS politikaları (super_admin tüm, tenant kendi)
ALTER TABLE kutuphane_medya ENABLE ROW LEVEL SECURITY;
-- ...
```

---

## Vizyon Belgelerinden Hatırlat

**Uzun vade hedefler (KUTUPHANE-VERI-BESLEME-VIZYONU.md):**
- 90+: Mobile etiketleme akışı (mobil → kütüphaneye satır besleme)
- 91+: İmalat foto QR-ölçek pipeline'ı (en büyük veri kaynağı)
- 100+: STEP/Rhino parse pipeline'ı
- Uzun vade: AR overlay (sahada parça doğrulama)

Her oturumda küçük bir adım. 90'da odak: 89'un implementasyonunu sahaya almak + 88'in borçlarını kapatmak.

---

## 90 Açılışında Öneri

Cihat "kaldığımız yerden devam" derse:
1. Önce canlı test (kütüphane sayfalarını aç, hata var mı bak)
2. DB schema doğrulama (gerekirse 065 migration)
3. 89.A oneriler refactor
4. 89.B 88.G form

3+4 toplamı ~2.5 saat. 90 uygun bir oturum.

---

> Bu dosya 89 kapanışında yazıldı. 90 başında okunur, çalışılır, gerekirse güncellenir.
