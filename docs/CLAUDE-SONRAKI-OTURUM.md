# CLAUDE-SONRAKI-OTURUM — 91. Oturum Gündemi

> 90'dan gelen plan. Hedef: **Kütüphane Faz 2 — fitting/flansh için filtre modelini hayata geçir + bekleyen öneriler aksiyon akışı + küçük temizlikler.** Kütüphane işi 91 sonunda **şimdilik kapanmış** olacak (vizyon devam eder ama pilot için yeterli).

---

## Açılış Ritüeli (CLAUDE.md'den)

91 başlangıcında Cihat'a 2 kontrol:

```
1. cd ~/Desktop/arespipe && git pull origin main && git status && git log --oneline -3
2. Bugün ne yapmak istiyorsun? (Kaldığımız yerden, yeni konu, vb.)
```

Cevap geldikten sonra Claude şu dosyaları okur:
- `.github/son-durum.md` (90 kapanışı)
- `docs/CLAUDE-SON-OTURUM.md` (detaylı 90 özeti)
- Bu dosya (`CLAUDE-SONRAKI-OTURUM.md`)
- `docs/KUTUPHANE-VERI-BESLEME-VIZYONU.md` (89'da yazılan ana vizyon belgesi — fitting/flansh için filtre modeli vizyon belgesinde de var)

---

## Önce Yapılması Gereken (5 dk)

90'ın yedek dosyaları temizlenecek (canlı test 90 sonunda geçtiyse):

```bash
cd ~/Desktop/arespipe && \
ls -la admin/*.bak90* && \
echo "—" && \
echo "Canlı testler hâlâ geçiyorsa şu komut çalıştırılır:" && \
echo "rm admin/*.bak90*"
```

`son-durum.md` 90 sonu yedek listesi:
- admin/kutuphane-detay.html.bak90 (sch_kod öncesi)
- admin/kutuphane-detay.html.bak90a (auth fix öncesi)
- admin/kutuphane-standartlar.html.bak90 (normStd öncesi)
- admin/kutuphane-standartlar.html.bak90a (auth fix öncesi)
- admin/kutuphane-malzemeler.html.bak90a (auth fix öncesi)
- admin/kutuphane-oneriler.html.bak90c (89.A öncesi)

---

## Ana Öncelik Sırası (91 için)

### Öncelik 1 — Fitting/Flansh Filtre Modeli (3-4 saat, 91'in ana işi)

**Cihat'ın 90'da netleştirdiği vizyon:**
> "Aynı tabloyu farklı yerlerde göstermemizde sakınca var mı?"

Doğru tasarım: **geometri tek tablo, malzeme tek tablo, sayfa filtreyle birleştirir**.

#### 1.1 — DB hazırlığı (30 dk)

`fitting_malzeme_uyum` tablosu zaten DB'de var (boş). Doldurma:

```sql
-- Migration 066: fitting/flansh uyum tablosu doldurma
-- Manuel insert ~20-30 satır (her standart × hangi malzeme grupları)

INSERT INTO fitting_malzeme_uyum (geometri_std, malzeme_grubu, uyumlu, notlar) VALUES
  ('ASME B16.9',  'karbon',     true, 'A234 WPB'),
  ('ASME B16.9',  'paslanmaz',  true, 'A403 WP304/WP316/WP316L'),
  ('ASME B16.9',  'cunife',     true, 'B466 (CuNi BW fitting)'),
  ('ASME B16.9',  'aluminyum',  true, 'B361'),
  ('ASME B16.11', 'karbon',     true, 'A105'),
  ('ASME B16.11', 'paslanmaz',  true, 'A182'),
  ('B16.5',       'karbon',     true, 'A105 (flansh)'),
  ('B16.5',       'paslanmaz',  true, 'A182 F304/F316/F316L'),
  ('B16.5',       'cunife',     true, 'B467'),
  ('EN-1092-1',   'karbon',     true, 'EN flansh'),
  ('EN-1092-1',   'paslanmaz',  true, 'EN paslanmaz flansh');

-- ... vs (toplam ~20-30 satır, KATALOG referansla doldurulur)
```

Tablo yapısı kontrol (varsa hazır, yoksa yarat):
```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema='public' AND table_name='fitting_malzeme_uyum';
```

Yoksa migration:
```sql
CREATE TABLE fitting_malzeme_uyum (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  geometri_std TEXT NOT NULL,
  malzeme_grubu TEXT NOT NULL,
  uyumlu BOOLEAN NOT NULL DEFAULT true,
  notlar TEXT,
  olusturma_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(geometri_std, malzeme_grubu)
);
```

#### 1.2 — Sayfa hiyerarşisi yeniden tasarım (1 saat)

**Yeni hiyerarşi:**

```
Katman 1: kutuphane.html (envanter ana sayfa, mevcut)
   ├─ Borular → mevcut 4 katman akışı (90'da kapandı)
   ├─ Fittings → kutuphane-standartlar.html?tablo=fitting_olculer (mg parametresiz)
   │              ↓ direkt standart listesi (ASME B16.9, B16.11, B16.28...)
   │              ↓
   │              kutuphane-detay.html?tablo=fitting_olculer&std=ASME-B16.9
   │              (üstte malzeme filtresi: [Karbon ▼] [Paslanmaz] [CuNi] [Hepsi])
   │
   └─ Flanşlar → aynı pattern
```

**Önemli karar:** Fittings/flanşlar için Katman 2 (malzeme grubu listesi) **atlanır**. Direkt standart listesine gidilir.

#### 1.3 — Katman 4 (detay) modifikasyonu (1.5 saat)

`kutuphane-detay.html`'a malzeme filtresi eklenir:
- Sayfanın üstünde dropdown: [Karbon / Paslanmaz / CuNi / Alüminyum / Hepsi]
- Filtre değişince:
  - URL hash güncellenir (`#mg=karbon`)
  - `fitting_malzeme_uyum`'dan uyumlu malzemeler kontrol edilir
  - Seçilen malzeme uyumlu değilse uyarı: "ASME B16.11 paslanmaz uyumlu değildir"
  - Tablo aynı kalır (geometri değişmez)
  - **Ağırlık sütunu dinamik hesaplanır:** `hacim × yogunluk_kg_m3 / 1000`
    - Yoğunluk `malzeme_kataloglari` tablosundan o malzeme grubunun ortalaması veya seçili spec'i

**Hacim hesabı (boru için, fitting için adaptasyon gerekli):**
```javascript
function hacimM3(disCap, et, uzunlukM) {
  // Boru: π × (OD-et) × et × uzunluk × 1e-9 (m³)
  return Math.PI * (disCap - et) * et * uzunlukM * 1e-9;
}
// Fitting için: hacim_m3 ya DB'de saklı ya da geometri formülüyle (elbow: π × R × area)
```

#### 1.4 — Ağırlık hesabı için yoğunluk lookup (30 dk)

`malzeme_kataloglari`'dan grup ortalaması:
```sql
SELECT malzeme_grubu, AVG(yogunluk_kg_m3) AS ortalama_yogunluk
FROM malzeme_kataloglari
WHERE aktif = true AND sistem_preset = true
GROUP BY malzeme_grubu;
```

Beklenen değerler (referans):
- karbon: 7850
- paslanmaz: 7980
- aluminyum: 2700
- cunife (CuNi): 8940
- duplex: 7805
- nikel: 8190

JS tarafında cache'lenir (sayfa açılışında bir kez sorgu).

#### 1.5 — kutuphane.html ana sayfa link güncellemesi (15 dk)

Borular kartı → `kutuphane-malzemeler.html?tablo=boru_olculer` (mevcut, dokunma)
Fittings kartı → `kutuphane-standartlar.html?tablo=fitting_olculer` (yeni, mg parametresiz)
Flanşlar kartı → `kutuphane-standartlar.html?tablo=flansh_olculer` (yeni)

### Öncelik 2 — Tutarsızlık Çöz (15 dk)

`kutuphane-oneriler.html` 2 gösteriyor, ana sayfa kartı "1 bekliyor".

İki ayrı kaynak:
- Oneriler: `v_tanimsiz_havuz_listele` (benzersiz ölçü×kalite gruplaması)
- Ana sayfa: `from('tanimsiz_kayitlar').select('*',{count:'exact',head:true}).eq('durum','bekliyor')`

**Karar gerekli:** Hangi sayım doğru? İki yorum var:
- (a) "Bekleyen kayıt sayısı" = onaylanmamış kayıt sayısı (1 — durum='bekliyor' COUNT)
- (b) "Benzersiz öneri sayısı" = farklı ölçü×kalite kombinasyonu (2 — RPC gruplaması)

Önerim **(a)** — ana sayfa kartı "Bekleyen Öneriler" diyor, durumu vurguluyor. Oneriler sayfasındaki sayım yanıltıcı (RPC adı `havuz_listele` = liste, sayım değil — istat hesabı sayfa kodunda yapılıyor).

Fix: kutuphane-oneriler.html'da istat hesabı değişir:
```javascript
// Mevcut: var toplamKayit = satirlar.length;
// Yeni: COUNT('bekliyor') sorgusu paralel
var bekleyenSayi = await _supaProxy.from('tanimsiz_kayitlar')
  .select('*', {count:'exact', head:true}).eq('durum','bekliyor');
```

### Öncelik 3 — Bekleyen Öneriler Aksiyon Akışı (2 saat)

Cihat'ın 90'daki vizyonu:
> "Standartta yok sahada varsa bekleyen önerilerden yapacaz zaten."

Sayfa: `admin/kutuphane-oneriler.html`. Her satıra eklenecek:
- **[Kütüphaneye Ekle]** butonu → modal: hangi standardın altına ekleneceğini seç → yeni RPC
- **[Yoksay]** butonu → `tanimsiz_kayitlar.durum = 'yoksayildi'` UPDATE
- **[Detay]** butonu → hangi spool/devre'lerde görüldü (modal'da liste)

Yeni RPC:
```sql
CREATE OR REPLACE FUNCTION oneri_kutuphaneye_ekle(
  p_hash TEXT,           -- tanimsiz_kayitlar.hash_anahtari
  p_hedef_standart TEXT, -- 'ASME-B36.10M' vs.
  p_kalite_kod TEXT      -- 'St 37'
)
RETURNS UUID  -- yeni boru_olculer.id
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Auth kontrol (super_admin)
  -- INSERT boru_olculer (standart=p_hedef_standart, sistem_preset=true)
  -- UPDATE tanimsiz_kayitlar SET durum='eklendi', islenme_at=NOW() WHERE hash=p_hash
  -- UPDATE spool_malzemeleri SET boru_olculer_id=yeni_id WHERE matching
  -- RETURN yeni_id
END $$;
```

Önemli: bu RPC `ozel_parca_boru_kaydet`'ten farklı çünkü:
- `standart` parametre olarak alınır (sabit 'Ozel' değil)
- `sistem_preset = true` (kataloğa katılır)
- Hash'e bağlı kayıt güncellemesi var

### Öncelik 4 — `ozel_parca_boru_kaydet` RPC Kararı (10 dk)

İki seçenek:
- (a) Sil — kullanılmıyor, kafa karıştırıyor (`DROP FUNCTION ozel_parca_boru_kaydet`)
- (b) Dokümante et + isim değiştir → `ozel_parca_kayit_takibi` veya `tenant_ozel_boru_ekle` (senaryo C için ileride)
- (c) Bırak, dokunma, dokümantasyona ekle

Önerim **(b)** — gelecekte tenant'a özel parça takibi (senaryo C) için temel olabilir. İsmin niyet yansıtması için rename.

### Öncelik 5 — kutuphane.html Broken Link Temizliği (10 dk)

3 tablo kartı şu an "Geçersiz tablo" diyor:
- `malzeme_kataloglari`
- `fitting_malzeme_uyum`
- `ozel_parcalar`

İki seçenek:
- (a) Katman 2 sayfasında (`kutuphane-malzemeler.html`) bu 3 tabloyu da destekle (TABLO_KONFIG genişlet)
- (b) Ana sayfada bu kartların linkini kaldır (özel sayfa açılır veya hiç link olmaz)

Önerim **(b)** — bu tablolar zaten farklı doğada (malzeme katalog yönetimi, uyum eşleştirme, özel parça arşivi). Her biri ayrı sayfa hak ediyor, Katman 2 hiyerarşisiyle uyumsuz.

---

## İkincil İşler (91'de zaman kalırsa)

### kutuphane_medya tablosu (~2 saat)

Vizyon belgesi Bölüm 5'teki polymorphic medya tablosu. Aksiyon butonları (foto yükle, 3D yükle, DXF yükle) aktif olur. Olgunluk göstergesi (📷 / 🎲 / 📐) gerçek sayılarla dolar.

```sql
CREATE TABLE kutuphane_medya (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hedef_tablo TEXT NOT NULL,   -- 'boru_olculer' / 'fitting_olculer' / 'flansh_olculer'
  hedef_id UUID NOT NULL,
  tip TEXT NOT NULL,           -- 'foto' / '3d' / 'dxf' / 'svg'
  dosya_url TEXT NOT NULL,
  kaynak TEXT NOT NULL,        -- 'manuel' / 'mobile_etiketleme' / 'imalat_foto' / 'step_parse'
  kaynak_referans TEXT,
  guven_yuzde INT,
  tenant_id UUID,
  yukleyen_id UUID,
  olusturma_at TIMESTAMPTZ DEFAULT NOW(),
  meta JSONB
);
CREATE INDEX idx_kutuphane_medya_hedef ON kutuphane_medya (hedef_tablo, hedef_id);
CREATE INDEX idx_kutuphane_medya_tip ON kutuphane_medya (hedef_tablo, tip);
```

---

## Kritik Hatırlatmalar (90 + öncesi)

- **MK-90.B (90'dan):** Patch script üretmeden önce `py_compile` syntax kontrolü zorunlu
- **MK-90.C (90'dan):** Mockup tasarımı sırasında DB modeliyle uyumu sorgula
- **MK-90.D (90'dan):** Kütüphane sayfalarında manuel veri girişi istenmez
- **MK-90.E (90'dan):** RPC adı yanıltıcı olabilir, gövdeyi `pg_get_functiondef` ile kontrol et
- **MK-89.D:** Vizyon parçaları netleştiğinde yazılı belge
- **MK-89.A:** Admin sayfa pattern: inline `getSession → select rol → appShell`
- **MK-52.x:** `~/Downloads/_arsiv/` disiplin, MD5 doğrulama, terminal git akışı
- **macOS base64:** `-D` (büyük D) tüm sürümlerde çalışır

---

## DB Operasyonları (91'de gerekirse)

```sql
-- fitting_malzeme_uyum boş mu kontrol
SELECT COUNT(*) FROM fitting_malzeme_uyum;

-- Yoğunluk lookup için ortalama hesap
SELECT malzeme_grubu, AVG(yogunluk_kg_m3) AS ortalama_yogunluk
FROM malzeme_kataloglari
WHERE aktif = true AND sistem_preset = true
GROUP BY malzeme_grubu;

-- boru_olculer'da özel kayıt var mı (90 sonu 0, takip için)
SELECT COUNT(*) FROM boru_olculer WHERE sistem_preset = false;
```

---

## "Kütüphane İşi Kapatılacak" Kararı

Cihat'ın 90 sonundaki sözü:
> "Bir dahaki oturumda problemli yerleri çözüp kütüphane işini şimdilik kapatalım."

91 sonunda kapatılacaklar:
- ✅ Fitting/flansh filtre modeli çalışıyor (Öncelik 1)
- ✅ Tutarsızlık çözülmüş (Öncelik 2)
- ✅ Bekleyen öneri aksiyon akışı kurulmuş (Öncelik 3)
- ✅ ozel_parca RPC durumu netleşmiş (Öncelik 4)
- ✅ Broken link temizliği (Öncelik 5)

92+'ya kalan vizyon işleri (pilot sinyaliyle açılır):
- Mobile etiketleme akışı (vizyon Vizyon 8 — pasif öğrenme)
- İmalat foto QR-ölçek pipeline (en büyük veri kaynağı)
- STEP/Rhino parse pipeline
- AR overlay (sahada parça doğrulama)
- kutuphane_medya tablosu + foto/3D/DXF UI

Bu liste vizyon belgesinde detaylı — pilot tersanenin sinyaliyle sıralanır.

---

## 91 Açılışında Öneri

Cihat "kaldığımız yerden devam" derse:
1. Önce yedek temizlik (5 dk, opsiyonel)
2. Fitting/flansh filtre modeli — uyum tablosu doldurma (30 dk) → Katman 2 atla (15 dk) → Katman 4 filtre + ağırlık hesap (1.5 saat)
3. Bekleyen öneriler aksiyon akışı (2 saat)
4. Tutarsızlık + ozel_parca + broken link (toplam 30 dk)

Toplam ~5 saat. 91 dolu ama yapılabilir bir oturum.

---

## Cihat'ın Sözleri (vizyon notu olarak kalıcı)

> *"Standartta varsa zaten tablomuzda vardır. Standartta var ama tabloda yoksa veritabanından yükleriz manuel riskli gereksiz. Standartta yok ama sahada varsa bekleyen önerilerden yapacaz zaten."*

Bu cümle kütüphane veri yönetimi prensibini şekillendirdi. 91'in tasarımı bu cümleye göre çıkıyor.

> *"Aynı tabloyu farklı yerlerde göstermemizde sakınca var mı?"*

Bu soru fitting/flansh filtre modelinin temelini attı.

---

> Bu dosya 90 kapanışında yazıldı. 91 başında okunur, çalışılır, gerekirse güncellenir.
